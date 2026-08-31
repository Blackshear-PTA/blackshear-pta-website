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
#   The third one matters more than it looks. `_headers` (the site-wide noindex)
#   and `_redirects` (/ -> /preview/ during the design vote) are Workers
#   static-asset features. `astro dev` and `astro preview` ignore both, so a
#   change to either LOOKS fine locally and only fails once deployed. If you are
#   touching those files, verify on :8787.
#
#   preview and worker build first, so they show you the real thing rather than
#   whatever was in dist/ from last time.
#
# USAGE
#   ./dev-control.sh              interactive controller
#   ./dev-control.sh start        one-shot actions (scriptable)
#   ./dev-control.sh preview | worker | stop | restart | status | logs | check | open
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
      worker)  note="real Workers runtime - _headers / _redirects" ;;
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
    printf '%s│%s  %-11s %s—%s\n' "$CYAN" "$RESET" "dev tabs" "$DIM" "$RESET"
  fi
  printf '%s└%s\n' "$CYAN" "$RESET"
}

_pause() { printf '\n%sPress Enter to continue…%s' "$DIM" "$RESET"; read -r _ || true; }

# ── tmux + Ghostty ────────────────────────────────────────────────────────────
# Lifted from the fleet controller on purpose. The whole point is that this repo
# lands in the same shared window as every other app, so the behaviour has to
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

do_restart() { do_stop; sleep 1; do_start "${1:-dev}"; }

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

# The three gates CI runs. Foreground on purpose: you want to read the output.
do_check() {
  cd "$REPO_DIR" || return 1
  local failed=0
  printf '%s▶ build%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run build   || { printf '%s  build failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ astro check%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check   || { printf '%s  type check failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n%s▶ contrast gate%s\n' "$BOLD" "$RESET"
  $NODE_RUNNER npm run check:contrast || { printf '%s  contrast gate failed%s\n' "$RED" "$RESET"; failed=1; }
  printf '\n'
  if [[ "$failed" == "0" ]]; then
    printf '%s✓ All three green.%s\n' "$GREEN" "$RESET"
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

# ── Interactive menu ──────────────────────────────────────────────────────────
menu() {
  while true; do
    print_status
    printf '%s│%s\n' "$CYAN" "$RESET"
    printf '%s│%s  [s] start dev   [p] preview     [w] worker\n' "$CYAN" "$RESET"
    printf '%s│%s  [x] stop all    [r] restart     [l] logs\n' "$CYAN" "$RESET"
    printf '%s│%s  [c] checks      [o] open        [q] quit\n' "$CYAN" "$RESET"
    printf '%s└%s ' "$CYAN" "$RESET"
    read -r choice || break
    case "$(_lc "$choice")" in
      s|start)     do_start dev;     _pause ;;
      p|preview)   do_start preview; _pause ;;
      w|worker)    do_start worker;  _pause ;;
      x|stop)      do_stop;          _pause ;;
      r|restart)   do_restart dev;   _pause ;;
      l|logs)      do_logs;          _pause ;;
      c|check)     do_check;         _pause ;;
      o|open)      do_open;          _pause ;;
      q|quit|exit) printf 'Leaving any running servers up. Bye.\n'; break ;;
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
  restart)        do_restart "${2:-dev}" ;;
  status)         print_status ;;
  logs)           do_logs ;;
  check|checks)   do_check ;;
  open)           do_open ;;
  -h|--help|help)
    printf 'Usage: dev [start|dev|preview|worker|stop|restart|status|logs|check|open]\n\n'
    printf '  dev       astro dev      :%s  hot reload\n' "$DEV_PORT"
    printf '  preview   astro preview  :%s  built output\n' "$PREVIEW_PORT"
    printf '  worker    wrangler dev   :%s  real Workers runtime (_headers, _redirects)\n' "$WORKER_PORT"
    ;;
  *) printf 'Unknown action: %s\nTry: dev --help\n' "$1"; exit 2 ;;
esac
