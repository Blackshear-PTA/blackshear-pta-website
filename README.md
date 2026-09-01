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

**`worker` is not optional when you touch `public/_headers`, or add a
`public/_redirects`.** Those are Workers static-asset features; `astro dev` and
`astro preview` ignore both entirely, so a broken redirect or a missing
`noindex` looks perfectly fine locally and only shows up once deployed. There is
no `_redirects` file today - the `/ -> /preview/` one existed only for the design
vote and went away when Civic Letterpress A was chosen.

Node is pinned in `.node-version` (Astro 7 needs >= 22.12). In a terminal your
`fnm` `use-on-cd` hook handles that on `cd`. The controller cannot rely on it,
because tmux runs commands without an interactive shell, so every launch goes
through `fnm exec`.

## Deploys

Every push to `main` triggers a Cloudflare Workers build, which deploys to
`blackshearpta.org`. Pushes to any other branch build a preview at
`<branch>-blackshear-pta.blackshearpta.workers.dev`.

### Skipping builds that cannot change the site

Some paths in this repo are documentation or source material and are never read
by `astro build`, so a commit touching only those rebuilds and redeploys byte
-identical output. Two ways to avoid that:

**1. Build watch paths (set once, applies automatically).** In the Cloudflare
dashboard under the Worker's build settings there are include/exclude path
patterns. Excluding the list below means a docs-only push is skipped entirely.

**2. `[skip ci]` in the commit message (per commit).** Cloudflare honours the
usual skip tokens. Useful for a one-off when the watch paths do not cover it.

### Paths that cannot affect the built site

Verified by tracing every image and module import: nothing under `src/` reaches
outside it, so the root `assets/` folder is reference material only.

```
docs/**            architecture and decisions
assets/**          brand originals and the Weebly salvage - NOT src/assets
.claude/**         local dev-server launch config
TASKS.md
README.md
dev-control.sh
dev.config
```

**`src/assets/**` is a build input and must NOT be excluded** - the committee
photos and the backdrop are imported from there and processed at build time.
The two folders are one character apart, which is the mistake to avoid.

### Is it worth it?

Honestly, barely, on cost. This site builds in well under a minute and nowhere
near any free-tier ceiling. The real benefit is not publishing a new Worker
version that is identical to the one before it, which makes the deploy history
mean something.

## Domain watch

```bash
npm run check:domain
```

Checks all three registrations - `blackshearpta.org` plus the `.com` and `.net`
that redirect to it - against the registries' RDAP APIs, and exits non-zero if
any is close to expiry, already lapsed, or in a suspended state.

Run it by hand when you want to know. There is deliberately no scheduled job:
an automated nag about a renewal somebody is already chasing is noise, and a
recurring alert nobody can action is how alerts get ignored.

It is a smoke alarm, not a sprinkler. If a domain does lapse, nothing here buys
it back - see F23 in `TASKS.md`.
