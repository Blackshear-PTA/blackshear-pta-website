#!/usr/bin/env bash
# Blackshear PTA Website - local dev controller
#
# WHY THIS EXISTS
#   Same reason as the IMPRES fleet controller
#   (impres-architect/shared-references/bootstrap/dev-control.template.sh):
#   a dev server blocks the tab you launch it from. This relocates it into the
#   shared "impres-dev" tmux session, so it lands as a NEW TAB IN THE SAME
#   GHOSTTY WINDOW as every other app, and your launch tab stays free.
#
#   While the interactive menu is on screen, it also sets THIS Ghostty tab's
#   title to a live glyph reflecting service state (🟢 up / 🟡 partial /
#   ⚫ down) via OSC 0 - same feature as the fleet controller, ported as-is.
#   It reverts once you leave the menu; there's no background watcher. Note:
#   Ghostty ignores OSC titles on a tab whose title you've pinned by hand
#   (right-click > Change Tab Title...) - clear that override first if the
#   glyph doesn't show up.
#
# HOW IT DIFFERS FROM THE FLEET TEMPLATE
#   This is a static site, not an Express + React + Postgres app. There is no
#   backend, no database, no Prisma and no PowerShell engine, so `dev-start.ps1
#   -Mode Prep|Launch` has nothing to do here and the whole PowerShell layer is
#   gone. What replaces it is three ways to SERVE the same site, which are not
#   interchangeable:
#
#     dev      astro dev        :4321  hot reload. What you want almost always.
#     preview  astro preview    :4322  the built static output, no HMR.
#     worker   wrangler dev     :8787  the real Cloudflare Workers runtime.
#
#   The third one matters more than it looks. `_headers` (the site-wide noindex),
#   `_redirects` (none today), and src/worker.ts (the pre-launch password gate)
#   only exist in the Workers runtime. `astro dev` and `astro preview` know
#   nothing about any of them, so on :4321 and :4322 the site is UNGATED and a
#   change to those files LOOKS fine and only fails once deployed. If you are
#   touching them, verify on :8787 - and copy .dev.vars.example to .dev.vars
#   first, or the gate will fail closed and let nobody through.
#
#   /admin and announcement photos need more than the other two modes, because
#   Cloudflare Access and the production R2 bucket are edge infrastructure and
#   neither exists here. `worker` handles it: before launching it checks
#   .dev.vars and says which of the gate and /admin will not work, then seeds
#   the local photo bucket. The one thing it cannot invent is the sign-in
#   address - put DEV_ADMIN_EMAIL in .dev.vars, or /admin answers 401.
#   See docs/DEVELOPMENT.md.
#
#   preview and worker build first, so they show you the real thing rather than
#   whatever was in dist/ from last time.
#
# USAGE
#   ./dev-control.sh              interactive controller
#   ./dev-control.sh start        one-shot actions (scriptable)
#   ./dev-control.sh all | preview | worker | stop | restart | status | logs
#   ./dev-control.sh check | open | images
#
#   The three modes are independent - `start` brings up dev and nothing else.
#   `all` starts dev + worker, the pair worth having open together. `restart`
#   with no argument restarts whatever is currently up rather than dropping
#   back to dev, because `stop` takes down all three and quietly losing the
#   worker looks like /admin and photos breaking rather than stopping.
#
#   The global `dev` command finds this by walking up from $PWD, so `dev` and
#   `dev start` work from anywhere inside the repo. `dev blackshear-web` from
#   elsewhere does NOT work - that shortcut only scans $IMPRES_DEV_ROOT, and
#   this repo lives outside it.
#
# REQUIREMENTS: bash, tmux, fnm. Per-app values come from ./dev.config.

set -u

TMUX_SESSION="impres-dev"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"

if [[ ! -f "$REPO_DIR/dev.config" ]]; then
  echo "ERROR: dev.config not found next to dev-control.sh ($REPO_DIR)." >&2
  exit 1
fi
# shellcheck disable=SC1091
. "$REPO_DIR/dev.config"

: "${APP_NAME:?dev.config is missing APP_NAME}"
: "${APP_SHORT:?dev.config is missing APP_SHORT}"
: "${DEV_PORT:?dev.config is missing DEV_PORT}"
PREVIEW_PORT="${PREVIEW_PORT:-4322}"
WORKER_PORT="${WORKER_PORT:-8787}"
NODE_RUNNER="${NODE_RUNNER:-fnm exec --}"

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; CYAN=""; RESET=""
fi

case "$(uname -s)" in
  Darwin) OS="mac" ;;
  Linux)  OS="linux" ;;
  *)      OS="unknown" ;;
esac

_lc() { printf '%s' "$1" | tr 'A-Z' 'a-z'; }

# ── Service table ─────────────────────────────────────────────────────────────
# key | tmux window | port | label | launch command
_svc_window() { case "$1" in dev) printf '%s' "$APP_SHORT";; preview) printf '%s-pv' "$APP_SHORT";; worker) printf '%s-wk' "$APP_SHORT";; esac; }
_svc_port()   { case "$1" in dev) printf '%s' "$DEV_PORT";; preview) printf '%s' "$PREVIEW_PORT";; worker) printf '%s' "$WORKER_PORT";; esac; }
_svc_label()  { case "$1" in dev) printf 'Dev (HMR)';; preview) printf 'Preview';; worker) printf 'Worker';; esac; }
_svc_cmd() {
  case "$1" in
    dev)     printf '%s npm run dev' "$NODE_RUNNER" ;;
    preview) printf '%s npm run build && %s npx astro preview --port %s' "$NODE_RUNNER" "$NODE_RUNNER" "$PREVIEW_PORT" ;;
    worker)  printf '%s npm run build && %s npx wrangler dev --port %s --local' "$NODE_RUNNER" "$NODE_RUNNER" "$WORKER_PORT" ;;
  esac
}
SERVICES="dev preview worker"

# ── Probes ────────────────────────────────────────────────────────────────────
port_listening() {
  local p="$1"
  [[ -z "$p" ]] && return 1
  command -v lsof >/dev/null 2>&1 && lsof -ti "tcp:$p" -sTCP:LISTEN >/dev/null 2>&1
}

session_exists() { tmux has-session -t "$TMUX_SESSION" 2>/dev/null; }

window_exists() {
  session_exists || return 1
  tmux list-windows -t "$TMUX_SESSION" -F '#W' 2>/dev/null | grep -qx "$1"
}

any_running() {
  local s
  for s in $SERVICES; do port_listening "$(_svc_port "$s")" && return 0; done
  return 1
}

# ── Worker environment ────────────────────────────────────────────────────────
# The Workers runtime needs setup that astro dev does not, and every missing
# piece fails in a way that reads as a bug rather than as absent configuration:
# no SITE_PASSWORD and the gate fails closed on everyone, no DEV_ADMIN_EMAIL and
# /admin answers "401 Not signed in.", an empty local R2 bucket and every
# announcement photo 404s. Checking here turns three confusing symptoms into
# three sentences, and seeds the photos rather than just complaining about them.

# One value out of .dev.vars. Only ever used to test whether something is set,
# except DEV_ADMIN_EMAIL, which is an address rather than a secret and is shown
# deliberately so you can see which identity you are about to edit as.
_dev_var() {
  [[ -f "$REPO_DIR/.dev.vars" ]] || return 1
  sed -n "s/^$1=//p" "$REPO_DIR/.dev.vars" | head -1
}

# How many photos the seeder believes are in the local bucket. Its manifest
# lives inside .wrangler/state, so it is only trustworthy while that is too.
_seeded_count() {
  local manifest="$REPO_DIR/.wrangler/state/pta-seeded-images.json"
  if [[ -f "$manifest" && -d "$REPO_DIR/.wrangler/state/v3" ]]; then
    grep -c '"[0-9a-f]\{32\}\.' "$manifest" 2>/dev/null || printf '0'
  else
    printf '0'
  fi
}

# Runs before the worker launches. Never fatal: a half-configured worker that
# starts and says why is more useful than one that refuses to.
_worker_preflight() {
  cd "$REPO_DIR" || return 0

  if [[ ! -f "$REPO_DIR/.dev.vars" ]]; then
    printf '%s  ! No .dev.vars - the password gate fails closed and lets nobody in.%s\n' "$YELLOW" "$RESET"
    printf '%s    cp .dev.vars.example .dev.vars, then fill in SITE_PASSWORD.%s\n' "$DIM" "$RESET"
    return 0
  fi

  local pw admin token
  pw="$(_dev_var SITE_PASSWORD)"
  admin="$(_dev_var DEV_ADMIN_EMAIL)"
  token="$(_dev_var GITHUB_TOKEN)"

  if [[ -z "$pw" || "$pw" == "replace-me" ]]; then
    printf '%s  ! SITE_PASSWORD is unset - the gate fails closed, nobody gets in.%s\n' "$YELLOW" "$RESET"
  fi

  if [[ -z "$admin" ]]; then
    printf '%s  ! DEV_ADMIN_EMAIL is unset - /admin will answer 401 Not signed in.%s\n' "$YELLOW" "$RESET"
    printf '%s    Add DEV_ADMIN_EMAIL=you@example.com to .dev.vars (loopback only).%s\n' "$DIM" "$RESET"
  else
    printf '  %s/admin signs in as%s %s\n' "$DIM" "$RESET" "$admin"
  fi

  # A token is not needed for read-only local work, and a bad one is worse than
  # none: the repository is public, so reads succeed unauthenticated and fail
  # with a bare "Bad credentials" the moment a stale token is attached.
  if [[ -n "$token" && "${#token}" -lt 20 ]]; then
    printf '%s  ! GITHUB_TOKEN looks like a placeholder - posts will fail to load.%s\n' "$YELLOW" "$RESET"
    printf '%s    Delete the line; local reads need no token.%s\n' "$DIM" "$RESET"
  fi

  # Silent when the bucket is already populated; noisy only when it does work.
  if ! $NODE_RUNNER npm run --silent dev:images -- --quiet; then
    printf '%s  ! Could not seed photos - they will 404. Try: dev images%s\n' "$YELLOW" "$RESET"
  fi
}

# ── Status panel ──────────────────────────────────────────────────────────────
_row() {
  local label="$1" port="$2" up="$3" note="${4:-}"
  local mark
  if [[ "$up" == "1" ]]; then mark="${GREEN}● running${RESET}"; else mark="${DIM}○ stopped${RESET}"; fi
  printf '%s│%s  %-11s :%-5s  %b   %s%s%s\n' "$CYAN" "$RESET" "$label" "$port" "$mark" "$DIM" "$note" "$RESET"
}

print_status() {
  clear 2>/dev/null || printf '\033[2J\033[H'
  printf '%s┌─ Dev Controller ─ %s%s%s\n' "$CYAN" "$BOLD" "$APP_NAME" "$RESET"
  printf '%s│%s\n' "$CYAN" "$RESET"

  local s p up note
  for s in $SERVICES; do
    p="$(_svc_port "$s")"
    if port_listening "$p"; then up=1; else up=0; fi
    case "$s" in
      dev)     note="hot reload" ;;
      preview) note="built output" ;;
      worker)  note="the gate, /admin, photos, _headers" ;;
    esac
    _row "$(_svc_label "$s")" "$p" "$up" "$note"
  done

  printf '%s│%s\n' "$CYAN" "$RESET"
  local live=""
  for s in $SERVICES; do
    window_exists "$(_svc_window "$s")" && live="$live $(_svc_window "$s")"
  done
  if [[ -n "$live" ]]; then
    printf '%s│%s  %-11s %s%s%s\n' "$CYAN" "$RESET" "dev tabs" "$GREEN" "${live# }" "$RESET"
  else
    printf '%s│%s  %-11s %snone%s\n' "$CYAN" "$RESET" "dev tabs" "$DIM" "$RESET"
  fi

  # What the :8787 worker will and will not be able to do, before you start it.
  printf '%s│%s\n' "$CYAN" "$RESET"
  local admin seeded
  if [[ ! -f "$REPO_DIR/.dev.vars" ]]; then
    printf '%s│%s  %-11s %bno .dev.vars - gate and /admin will not work%b\n' \
      "$CYAN" "$RESET" "worker env" "$YELLOW" "$RESET"
  else
    admin="$(_dev_var DEV_ADMIN_EMAIL)"
    if [[ -n "$admin" ]]; then
      printf '%s│%s  %-11s %s\n' "$CYAN" "$RESET" "/admin as" "$admin"
    else
      printf '%s│%s  %-11s %bDEV_ADMIN_EMAIL unset - /admin will 401%b\n' \
        "$CYAN" "$RESET" "/admin as" "$YELLOW" "$RESET"
    fi
    seeded="$(_seeded_count)"
    if [[ "$seeded" != "0" ]]; then
      printf '%s│%s  %-11s %s in the local bucket\n' "$CYAN" "$RESET" "photos" "$seeded"
    else
      printf '%s│%s  %-11s %bnone seeded - `dev worker` will fetch them%b\n' \
        "$CYAN" "$RESET" "photos" "$DIM" "$RESET"
    fi
  fi
  printf '%s└%s\n' "$CYAN" "$RESET"
}

_pause() { printf '\n%sPress Enter to continue…%s' "$DIM" "$RESET"; read -r _ || true; }

# ── tmux + Ghostty ────────────────────────────────────────────────────────────
# Lifted from the fleet controller on purpose. The whole point is that this repo
# lands in the same shared window as every other app, so the behavior has to
# match rather than merely resemble it.
_fleet_tmux_conf() {
  local c
  for c in \
    "$SCRIPT_DIR/dev.tmux.conf" \
    "${IMPRES_DEV_ROOT:-$HOME/impres-architect}/shared-references/bootstrap/dev.tmux.conf" \
    "$HOME/impres-architect/shared-references/bootstrap/dev.tmux.conf"
  do
    [[ -f "$c" ]] && { printf '%s' "$c"; return 0; }
  done
  return 1
}

_style_tmux() {
  local conf
  if conf="$(_fleet_tmux_conf)"; then tmux source-file "$conf" 2>/dev/null || true; fi
  tmux set -t "$TMUX_SESSION" mouse on            2>/dev/null || tmux set -g mouse on 2>/dev/null || true
  tmux set -t "$TMUX_SESSION" status-position top 2>/dev/null || true
}

_open_dev_window() {
  local win="$1"
  [[ "$OS" == "mac" ]] || return 0
  if tmux list-clients -t "$TMUX_SESSION" 2>/dev/null | grep -q .; then
    # Already attached somewhere: focus this tab and raise the window.
    tmux select-window -t "$TMUX_SESSION:$win" 2>/dev/null || true
    open -a Ghostty 2>/dev/null || true
  else
    open -na Ghostty --args -e tmux attach -t "$TMUX_SESSION" 2>/dev/null \
      || printf '%sOpen a terminal and run: tmux attach -t %s%s\n' "$YELLOW" "$TMUX_SESSION" "$RESET"
  fi
}

_launch() {
  local svc="$1" win cmd
  win="$(_svc_window "$svc")"
  cmd="$(_svc_cmd "$svc")"
  # Drop to a shell after the server exits so a crash leaves the output on
  # screen instead of closing the tab out from under you.
  local full="$cmd; printf '\n[%s exited] shell follows.\n'; exec ${SHELL:-/bin/zsh}"
  if session_exists; then
    tmux new-window  -t "$TMUX_SESSION" -n "$win" -c "$REPO_DIR" "$full"
  else
    tmux new-session -d -s "$TMUX_SESSION" -n "$win" -c "$REPO_DIR" "$full"
  fi
  _style_tmux
  _open_dev_window "$win"
}

# ── Actions ───────────────────────────────────────────────────────────────────
do_start() {
  local svc="${1:-dev}"
  case "$svc" in dev|preview|worker) ;; *) printf '%sUnknown service: %s%s\n' "$RED" "$svc" "$RESET"; return 2 ;; esac
  cd "$REPO_DIR" || return 1

  local win port
  win="$(_svc_window "$svc")"; port="$(_svc_port "$svc")"

  if port_listening "$port"; then
    printf '%s%s is already listening on :%s.%s Use restart for a fresh one.\n' \
      "$YELLOW" "$(_svc_label "$svc")" "$port" "$RESET"
    _open_dev_window "$win"
    return 0
  fi
  if window_exists "$win"; then
    printf '%sTab %s exists but nothing is on :%s - reusing it.%s\n' "$YELLOW" "$win" "$port" "$RESET"
    tmux kill-window -t "$TMUX_SESSION:$win" 2>/dev/null || true
  fi

  case "$svc" in
    preview|worker) printf '%s▶ Building first (%s serves the built output)…%s\n' "$BOLD" "$svc" "$RESET" ;;
  esac
  # The gate, /admin and the photos exist only in the Workers runtime, so this
  # is the one mode whose environment is worth checking before it starts.
  [[ "$svc" == "worker" ]] && _worker_preflight
  # Said once here rather than left to be rediscovered: on 4321 and 4322 the
  # site is ungated and the editor's API is simply absent.
  # astro dev proxies /admin/api and /images to :8787, so 4321 is complete only
  # while the worker is also up. Preview has no such proxy.
  if [[ "$svc" == "dev" ]] && ! port_listening "$WORKER_PORT"; then
    printf '%s  Note: /admin and photos need the worker too - `dev all` starts both.%s\n' "$DIM" "$RESET"
  elif [[ "$svc" == "preview" ]]; then
    printf '%s  Note: the gate, /admin and photos are Workers-only - use `dev worker`.%s\n' "$DIM" "$RESET"
  fi

  printf '%s▶ Launching %s into the "%s" window, tab "%s"…%s\n' \
    "$BOLD" "$(_svc_label "$svc")" "$TMUX_SESSION" "$win" "$RESET"
  _launch "$svc"
  printf '%s✓ Started.%s http://localhost:%s - this tab is free.\n' "$GREEN" "$RESET" "$port"
  printf '%s  Switch tabs: click one, or Ctrl-b n / Ctrl-b <number>. Detach: Ctrl-b d.%s\n' "$DIM" "$RESET"
}

do_stop() {
  cd "$REPO_DIR" || return 1
  printf '%s▶ Stopping %s…%s\n' "$BOLD" "$APP_NAME" "$RESET"
  local s p win pids stopped=0
  for s in $SERVICES; do
    p="$(_svc_port "$s")"; win="$(_svc_window "$s")"
    pids="$(lsof -ti "tcp:$p" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill $pids 2>/dev/null || true
      printf '  stopped %s on :%s\n' "$(_svc_label "$s")" "$p"
      stopped=1
    fi
    if window_exists "$win"; then
      tmux kill-window -t "$TMUX_SESSION:$win" 2>/dev/null || true
      printf '  closed tab %s:%s\n' "$TMUX_SESSION" "$win"
    fi
  done
  [[ "$stopped" == "0" ]] && printf '  %snothing was listening%s\n' "$DIM" "$RESET"
  printf '%s✓ Stopped.%s The shared session stays up if other apps are using it.\n' "$GREEN" "$RESET"
}

# Restart whatever is actually up, rather than a hardcoded default.
#
# This used to be `do_stop; do_start dev`, and do_stop kills all three - so a
# restart with the worker running stopped it and brought back only :4321. That
# is the worst mode to drop silently: the site still loads, so nothing looks
# wrong, but it is ungated with no /admin and no photos, which reads as those
# features being broken rather than absent.
#
# An explicit argument still wins, and restarting from nothing starts dev.
do_restart() {
  local want="${1:-}" s
  if [[ -z "$want" ]]; then
    for s in $SERVICES; do
      port_listening "$(_svc_port "$s")" && want="$want $s"
    done
    want="${want# }"
    [[ -z "$want" ]] && want="dev"
  fi
  do_stop
  sleep 1
  for s in $want; do do_start "$s"; done
}

# The pair worth running together: hot reload for iterating, the real runtime
# for the gate, /admin and photos. Preview is deliberately not included - it
# serves the same built output as worker with less of the runtime around it, so
# running both only competes for the same build.
do_all() {
  do_start dev
  printf '\n'
  do_start worker
}

# `dev worker` seeds automatically; this is for re-fetching after someone adds a
# photo through the real /admin, or with --force after clearing local state.
do_images() {
  cd "$REPO_DIR" || return 1
  printf '%s▶ Announcement photos → local R2 bucket%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run --silent dev:images -- "$@"
}

do_logs() {
  local s win=""
  for s in $SERVICES; do
    if window_exists "$(_svc_window "$s")"; then win="$(_svc_window "$s")"; break; fi
  done
  if [[ -z "$win" ]]; then
    printf '%sNothing running - start it first.%s\n' "$YELLOW" "$RESET"; return 0
  fi
  _open_dev_window "$win"
  printf 'Focused %s:%s.\n' "$TMUX_SESSION" "$win"
}

# Every gate in the repo. Foreground on purpose: you want to read the output.
#
# Nothing else runs these. There is no CI workflow for them - Workers Builds
# runs `npm run build` and nothing more - so this command IS the gate, and a
# check missing from here is a check that never runs.
do_check() {
  cd "$REPO_DIR" || return 1
  local failed=0
  printf '%s▶ build%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run build   || { printf '%s  build failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ astro check%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check   || { printf '%s  type check failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ contrast gate%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:contrast || { printf '%s  contrast gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ font wiring%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:fonts || { printf '%s  font gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ frontmatter round trip%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:frontmatter || { printf '%s  frontmatter gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ Access token verification%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:access || { printf '%s  Access gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ image upload%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:images || { printf '%s  image gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ crop geometry%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:crop || { printf '%s  crop gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ committed secrets%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:secrets || { printf '%s  secret gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ class names vs Tailwind utilities%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:classnames || { printf '%s  class name gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ calendar feed parsing%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:ical || { printf '%s  ical gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ domain references%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:domain || { printf '%s  domain gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ Instagram post list%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:instagram || { printf '%s  Instagram gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n'
  if [[ "$failed" == "0" ]]; then
    printf '%s✓ All thirteen green.%s\n' "$GREEN" "$RESET"
  else
    printf '%s✗ Something failed above.%s\n' "$RED" "$RESET"
  fi
  return "$failed"
}

do_open() {
  local s p
  for s in $SERVICES; do
    p="$(_svc_port "$s")"
    if port_listening "$p"; then
      printf 'Opening http://localhost:%s\n' "$p"
      open "http://localhost:$p" 2>/dev/null || true
      return 0
    fi
  done
  printf '%sNothing running - start it first.%s\n' "$YELLOW" "$RESET"
}

# ── Ghostty tab title (menu-only) ─────────────────────────────────────────────
# See impres-architect/shared-references/bootstrap/dev-control.template.sh for
# the full rationale (why a title glyph, not a Ghostty tab color/badge; why
# menu-only, not a background watcher) and the bash-3.2 read -t gotcha this
# works around. Ported as-is, just walking $SERVICES instead of fixed ports.
TAB_TITLE_REFRESH_SECS="${TAB_TITLE_REFRESH_SECS:-3}"

_tab_state_glyph() {
  local s up=0 down=0
  for s in $SERVICES; do
    port_listening "$(_svc_port "$s")" && up=$((up+1)) || down=$((down+1))
  done
  if   [[ "$down" -eq 0 ]]; then printf '🟢'   # everything up
  elif [[ "$up"   -eq 0 ]]; then printf '⚫'   # everything down
  else                            printf '🟡'   # partial - usually means something crashed
  fi
}

_set_tab_title()   { printf '\033]0;%s %s\007' "$(_tab_state_glyph)" "$APP_SHORT"; }
_reset_tab_title() { printf '\033]0;%s\007' "$APP_SHORT"; }

# ── Interactive menu ──────────────────────────────────────────────────────────
menu() {
  local rc
  while true; do
    print_status
    _set_tab_title
    printf '%s│%s\n' "$CYAN" "$RESET"
    printf '%s│%s  [s] start dev   [p] preview     [w] worker\n' "$CYAN" "$RESET"
    printf '%s│%s  [a] dev+worker  [x] stop all    [r] restart\n' "$CYAN" "$RESET"
    printf '%s│%s  [c] checks      [o] open        [i] photos\n' "$CYAN" "$RESET"
    printf '%s│%s  [l] logs        [q] quit\n' "$CYAN" "$RESET"
    printf '%s└%s ' "$CYAN" "$RESET"
    SECONDS=0
    read -r -t "$TAB_TITLE_REFRESH_SECS" choice
    rc=$?
    if [[ $rc -ne 0 ]]; then
      if [[ $SECONDS -lt 1 ]]; then
        # Real EOF (Ctrl-D, or stdin closed), not a refresh tick - see the
        # fleet controller for why elapsed time, not exit code, is what
        # actually distinguishes the two on bash 3.2.
        _reset_tab_title
        break
      fi
      continue   # timed out waiting for input - loop back and refresh the title
    fi
    case "$(_lc "$choice")" in
      s|start)     do_start dev;     _pause ;;
      p|preview)   do_start preview; _pause ;;
      w|worker)    do_start worker;  _pause ;;
      x|stop)      do_stop;          _pause ;;
      r|restart)   do_restart;       _pause ;;
      a|all)       do_all;           _pause ;;
      l|logs)      do_logs;          _pause ;;
      c|check)     do_check;         _pause ;;
      o|open)      do_open;          _pause ;;
      i|images)    do_images;        _pause ;;
      q|quit|exit) _reset_tab_title; printf 'Leaving any running servers up. Bye.\n'; break ;;
      "")          ;;
      *) printf '%sUnknown option: %s%s\n' "$YELLOW" "$choice" "$RESET"; sleep 1 ;;
    esac
  done
}

case "$(_lc "${1:-}")" in
  "")             menu ;;
  start)          do_start "${2:-dev}" ;;
  dev)            do_start dev ;;
  preview)        do_start preview ;;
  worker)         do_start worker ;;
  stop)           do_stop ;;
  restart)        do_restart "${2:-}" ;;
  all)            do_all ;;
  status)         print_status ;;
  logs)           do_logs ;;
  check|checks)   do_check ;;
  open)           do_open ;;
  images|photos)  shift; do_images "$@" ;;
  -h|--help|help)
    printf 'Usage: dev [start|all|dev|preview|worker|stop|restart|status|logs|check|open|images]\n\n'
    printf '  dev       astro dev      :%s  hot reload\n' "$DEV_PORT"
    printf '  preview   astro preview  :%s  built output\n' "$PREVIEW_PORT"
    printf '  worker    wrangler dev   :%s  real Workers runtime, the gate, /admin, photos\n' "$WORKER_PORT"
    printf '  check                        every gate in the repo (nothing else runs them)\n'
    printf '  all                          dev + worker together\n'
    printf '  restart                      restarts whatever is currently up\n'
    printf '  images                       refill the local photo bucket (--force to re-fetch)\n\n'
    printf '  `worker` checks .dev.vars and seeds photos before it starts, so /admin\n'
    printf '  and announcement images work. See docs/DEVELOPMENT.md.\n'
    ;;
  *) printf 'Unknown action: %s\nTry: dev --help\n' "$1"; exit 2 ;;
esac
