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
