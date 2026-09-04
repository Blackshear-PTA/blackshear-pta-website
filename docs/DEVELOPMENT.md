# Development

Astro 7, static output, served from Cloudflare Workers static assets. Tailwind
v4 with its default theme deliberately deleted. No component library.

Why each of those, and what was rejected: [PROJECT-BRIEF.md](PROJECT-BRIEF.md).

## Running it

Node **22.12+**, pinned in `.node-version`, so `fnm` or `nvm` picks it up when
you `cd` in.

```sh
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # static build into ./dist
npm run check    # TypeScript + Astro diagnostics, strict
npm run preview  # serve ./dist locally
```

Astro 7 runs `dev` as a background daemon. `npm run astro -- dev stop` stops it;
`dev status` and `dev logs` inspect it.

### The gates

All exit non-zero on failure, all runnable by hand:

```sh
npm run check           # types and Astro diagnostics
npm run check:contrast  # WCAG AA across every theme
npm run check:fonts     # typeface wiring agrees across three files
npm run check:frontmatter # what /admin writes is what Astro reads back
npm run check:access    # Access token verification refuses every forgery
npm run check:ical      # the iCalendar reader, fixtures plus the live feed
npm run check:crop      # what you see in the crop frame is what gets stored
npm run check:images    # only real images reach the bucket, on their bytes
npm run check:secrets   # no recognisable credential committed to a public repo
npm run check:domain    # registration status for all three domains
```

`check:contrast` is a **hard gate, not a preference**. This is a public-facing
site attached to a school district; a theme that cannot clear AA gets cut
regardless of how good it looks. It parses the `:root` block in `global.css`,
layers each `[data-theme]` block on top so inherited tokens are checked rather
than silently skipped, and covers text pairings plus scrim-over-photo cases.

`check:fonts` exists because three files have to agree about typefaces and the
page still renders when they do not, which is what makes that class of bug
expensive. It has already bitten twice here: once when a family was in the Astro
config with no `<Font>` rendered, so `--font-*` was undefined, the whole `var()`
chain went invalid, and every theme quietly rendered in the browser default
while looking perfectly plausible; again when `theme.fonts` was added and could
drift from the CSS. Preloading a face the page never paints is wasted bytes on a
phone; missing one brings back the layout shift the preload exists to remove.
Neither shows up in a screenshot.

`check:images` covers the upload endpoint, which Cloudflare Access makes
unreachable from a test over HTTP, so it exercises `storeImage` directly. The
case that earns it: a `Content-Type` header is a string the client picked, so a
script renamed to `.jpg` has to be refused on its leading bytes rather than its
label - otherwise it is stored and later served back with an image content type.

`check:crop` covers the photo cropper's arithmetic. The cropper promises that
what you see in the frame is what gets published, and that promise is entirely
that arithmetic - the kind that looks right and is off by a scale factor. It is
tested as a pure function rather than through the browser on purpose: the DOM
version was only measurable while the preview pane happened to be laying out,
and produced three rounds of numbers that turned out to be about the pane rather
than the code.

`check:secrets` exists because this repo is public, three documents already
said the password must never be committed, and it was committed anyway (F28) -
in the note explaining how to clean up a different mistake involving it. Prose
did not hold. It is honest about its limits: it cannot recognise a secret that
looks like an ordinary English word, which is exactly what leaked. A green run
means "no *recognisable* secret", not "no secret".

`check:ical` runs in CI before the calendar refresh, so a parser regression
keeps yesterday's good snapshot instead of committing a broken one.

## The `dev` controller

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
works from anywhere inside the repo. `dev blackshear-web` from outside does
*not* work: that shortcut only scans `$IMPRES_DEV_ROOT`, and this repo lives
outside it.

Node is pinned in `.node-version`. In a terminal your `fnm` `use-on-cd` hook
handles that on `cd`. The controller cannot rely on it, because tmux runs
commands without an interactive shell, so every launch goes through `fnm exec`.

### Which server to use

| Mode | Port | Use it for |
|---|---|---|
| `dev` | 4321 | Almost everything. Hot reload |
| `preview` | 4322 | The built static output, no HMR |
| `worker` | 8787 | The real Cloudflare Workers runtime |

**`worker` is not optional when you touch `public/_headers` or `src/worker.ts`.**
Those only exist in the Workers runtime. `astro dev` and `astro preview` know
nothing about either, so on 4321 and 4322 **the site is ungated** and a change
to those files looks perfectly fine locally and only fails once deployed.

If you are testing the password gate, copy `.dev.vars.example` to `.dev.vars`
and put the real password in it first, or the gate fails closed and lets nobody
through. See [PRE-LAUNCH-GATE.md](PRE-LAUNCH-GATE.md).

### Testing `/admin` and photos locally

Two parts of the site are edge infrastructure, so on 4321 and 4322 they do not
exist at all, and on 8787 they start out empty. Neither is broken when that
happens; both need one setup step.

**Sign-in.** Cloudflare Access runs at Cloudflare's edge, so no Access token is
ever attached to a localhost request and `/admin/api/*` answers `401 Not signed
in.` Put one line in `.dev.vars`:

```
DEV_ADMIN_EMAIL=you@example.com
```

That is honoured **only** when the request arrives on `localhost`, `127.0.0.1`
or `[::1]`, so it cannot open anything in production even if it were set there
by mistake — the hostname is the lock, not the variable. See `devIdentity()` in
`src/worker/access.ts`, and `npm run check:access` for the tests holding it to
that.

You do **not** need a GitHub token for this. The repository is public, so a
read-only local session lists and opens the real posts unauthenticated. If you
have a stale `GITHUB_TOKEN` line in `.dev.vars`, delete it — an invalid token is
worse than none, and the editor will tell you so.

**Local runs are read-only.** There is no local copy of the content: `/admin`
reads and writes through the GitHub API, so a save from localhost is a real
commit to the real repository. Writing therefore needs saying twice:

- a real fine-grained `GITHUB_TOKEN` with **Contents: write**
- `GITHUB_BRANCH` pointed at a scratch branch, so a test post lands somewhere
  harmless rather than on the live site
- `DEV_ALLOW_WRITES=true`

The editor shows a banner naming the repository and branch a save would land
on — quiet accent for read-only, red for live.

**Photos.** `wrangler dev` binds a *local* R2 bucket, not the production one, so
it starts empty and every photo 404s. Fill it:

```bash
npm run dev:images
```

That copies the photos the current posts reference from the live site. It needs
no credentials — `/images/*` is routed ahead of the gate — and the local bucket
persists in `.wrangler/`, so this is once per checkout, not once per run.

## Layout

```
README.md                  plain-English overview, for board members
TASKS.md                   the live task board - read this before planning
docs/                      you are here

assets/brand/              logos, sampled palette, contrast table
assets/from-weebly/        salvaged from the old site. NOT a build input

src/content/home.yaml      all homepage copy
src/content/site.yaml      nav, identity, social - the chrome on every page
src/content/pages.yaml     every standalone page; a top-level key IS a URL
src/content.config.ts      the schema all of the above is validated against
src/data/events.json       calendar snapshot, generated - never edit by hand

src/styles/global.css      brand primitives plus the --pta-* token contract
src/themes/                one CSS token block per theme, plus registry.ts
src/layouts/BaseLayout     <head>, fonts, Open Graph, the theme attribute
src/layouts/PageLayout     shell for every standalone page
src/layouts/structures/    structural arrangements a theme renders through
src/components/sections/   Hero, QuickActions, News, GetInvolved, Committees...
src/lib/ical.ts            iCalendar reader; no dependencies, no platform APIs
src/pages/[page].astro     renders anything in pages.yaml
src/worker.ts              TEMPORARY - the pre-launch password gate

wrangler.jsonc             Cloudflare config. Three lines marked TEMPORARY
scripts/                   the gates, the calendar refresh, the image seeder
```

## Two rules that will bite you

**Tailwind's defaults are deliberately deleted.** `bg-blue-500`, `rounded-xl`,
`shadow-lg` and friends do not exist here and will **silently do nothing** -
they will not error, the utility simply is not generated. Use the tokens in
`src/styles/global.css`, or add one. PROJECT-BRIEF §3.3 has the reasoning; the
short version is that a design system you can bypass by accident is not one.

**Yellow is never text on white.** Lemon on white is 1.33:1 and fails WCAG AA
outright. It is a background and accent colour only; yellow text needs a black
or blue ground. Full table in [`../assets/brand/README.md`](../assets/brand/README.md).

## Themes

A theme is a **token set and a structure**, paired in `src/themes/registry.ts`.
Pairing them is deliberate: it makes a token-only recolour impossible to ship by
accident, which is the failure mode where several "different designs" turn out
to be one template in several palettes.

Civic Letterpress A is the site's design. Two others are held in reserve and
still render at `/preview`. Adding, changing or retiring one is documented at
the top of `registry.ts`, in the file you would be editing.

Two exports are kept deliberately apart:

- `siteThemeId` is what every real page renders in. Changing it re-skins the
  live site.
- `defaultThemeId` is only which panel `/preview` opens on.

They name the same theme today. Separating them means pointing the preview at a
reserve for a second opinion cannot silently re-skin the homepage.

## Generated files

`worker-configuration.d.ts` is generated from `wrangler.jsonc` by
`wrangler types` and is **gitignored**: 15,000 lines of vendored runtime types
that would dominate every future diff. `npm run check` regenerates it first, so
it is self-healing and you should never need to think about it.

`src/data/events.json` is generated by `npm run refresh:events`. It *is*
committed, on purpose, so calendar changes show up as reviewable diffs. See
[CALENDAR.md](CALENDAR.md).
