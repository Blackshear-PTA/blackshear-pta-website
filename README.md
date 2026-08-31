# Blackshear PTA website

Website for the Blackshear Elementary Fine Arts Academy PTA (Austin ISD).
Astro, static-rendered, served from Cloudflare Workers static assets.

**Status: scaffold.** The build works end to end, but there is no real content
and only one placeholder theme. Every string in `src/content/home.yaml` is a
`TODO`.

## Running it

Requires **Node 22.12+** - pinned in `.node-version`, so `fnm`/`nvm` will pick
it up automatically when you `cd` in.

```sh
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # static build into ./dist
npm run check    # TypeScript + Astro diagnostics (strict)
npm run preview  # serve ./dist locally
```

Astro 7 runs `dev` as a background daemon: `npm run astro -- dev stop` to stop
it, `dev status` / `dev logs` to inspect it.

Deploying (needs a Cloudflare login, not yet set up):

```sh
npm run cf:dev     # serve ./dist through the Workers runtime
npm run cf:deploy  # build + wrangler deploy
```

## Layout

```
docs/PROJECT-BRIEF.md      architecture and locked decisions - read this first
TASKS.md                   current status and the task board
assets/brand/              logos + the sampled palette and its contrast table
assets/from-weebly/        salvaged from the old site

src/content/home.yaml      ALL homepage copy, in one place
src/content.config.ts      the schema that copy is validated against
src/styles/global.css      brand tokens + the --pta-* theme contract
src/themes/                one CSS token block per theme, plus registry.ts
src/layouts/structures/    structural arrangements a theme can render through
src/components/sections/   Hero, QuickActions, News, GetInvolved, Committees, Footer
wrangler.jsonc             Cloudflare Workers config (static assets, no Worker script)
```

## Two rules worth knowing before you edit anything

**Tailwind's defaults are deliberately deleted.** `bg-blue-500`, `rounded-xl`,
`shadow-lg` and friends do not exist in this project and will silently do
nothing. Use the brand tokens in `src/styles/global.css`, or add a token there.
See `PROJECT-BRIEF.md` §3.3 for why.

**Yellow is never text on white.** Lemon on white is 1.33:1 and fails WCAG AA
outright. It is a background and accent color; yellow text needs a black or
blue ground. `assets/brand/README.md` has the full contrast table.

Everything else - why Workers and not Pages, why sessions go in D1, why there is
no component library - is in [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md).

## Local development

This repo has a `dev` controller matching the IMPRES fleet convention, so it
opens as a new tab in the same shared Ghostty/tmux window as the other apps.

```bash
dev              # interactive controller (status + menu)
dev start        # astro dev on :4321, hot reload
dev worker       # wrangler dev on :8787
dev stop         # stops every mode and closes its tabs
dev check        # build + astro check + contrast gate, in the foreground
```

`dev` finds the controller by walking up from your current directory, so it
works from anywhere inside the repo. `dev blackshear-web` from outside does not
work: that shortcut only scans `$IMPRES_DEV_ROOT`, and this repo lives outside it.

### Which server to use

| Mode | Port | Use it for |
|---|---|---|
| `dev` | 4321 | Almost everything. Hot reload. |
| `preview` | 4322 | The built static output, no HMR. |
| `worker` | 8787 | The real Cloudflare Workers runtime. |

**`worker` is not optional when you touch `public/_headers` or
`public/_redirects`.** Those are Workers static-asset features; `astro dev` and
`astro preview` ignore both entirely, so a broken redirect or a missing
`noindex` looks perfectly fine locally and only shows up once deployed.

Node is pinned in `.node-version` (Astro 7 needs >= 22.12). In a terminal your
`fnm` `use-on-cd` hook handles that on `cd`. The controller cannot rely on it,
because tmux runs commands without an interactive shell, so every launch goes
through `fnm exec`.

### Domain watch

```bash
npm run check:domain
```

Checks all three registrations - `blackshearpta.org` plus the `.com` and `.net`
that redirect to it - against the registries' RDAP APIs, and exits non-zero if
any is close to expiry, already lapsed, or in a suspended state. `.github/workflows/domain-watch.yml`
runs it four times a day and opens a single GitHub issue when it fails, updating
that same issue rather than filing new ones, and closing it once the registry
looks healthy again.

It is a smoke alarm, not a sprinkler. If the domain does lapse, nothing here
buys it back - see F23 in `TASKS.md`.
