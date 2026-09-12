# Development

Astro 7, served from Cloudflare Workers. Static by default: every page is
prerendered and served straight off the assets binding EXCEPT the four that show
announcements, which render on demand against a D1 database. Tailwind v4 with
its default theme deliberately deleted. No component library.

Why each of those, and what was rejected: [PROJECT-BRIEF.md](PROJECT-BRIEF.md).

## Running it

Node **22.12+**, pinned in `.node-version`, so `fnm` or `nvm` picks it up when
you `cd` in.

```sh
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # build into ./dist (client/ static, server/ the Worker)
npm run check    # TypeScript + Astro diagnostics, strict
npm run preview  # serve ./dist locally (static pages only - no D1, no /admin)
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
npm run check:secrets   # no recognizable credential committed to a public repo
npm run check:domain    # registration status for all three domains
npm run check:d1        # the announcements database, against real SQLite
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
did not hold. It is honest about its limits: it cannot recognize a secret that
looks like an ordinary English word, which is exactly what leaked. A green run
means "no *recognizable* secret", not "no secret".

`check:ical` runs in CI before the calendar refresh, so a parser regression
keeps yesterday's good snapshot instead of committing a broken one.

`check:d1` replaces a guarantee the build used to give away for free. While
posts were markdown files, the content schema's Zod rules ran on every build and
`astro build` would not finish if one was malformed. Nothing rebuilds when a
post is published now, so a build-time check is a check that no longer runs -
and the failure moved from "red build nobody saw" to "live page". The rules
moved into the database (`migrations/0001_announcements.sql`) and this runs
them: the migrations, the single-pin index, both of the old `.refine()` rules,
the draft filter and the ordering, against real SQLite via `node:sqlite`. Not a
mock - the same engine D1 is built on, exercising the same migration files the
deploy applies.

## The `dev` controller

This repo has a `dev` controller matching the IMPRES fleet convention, so it
opens as a new tab in the same shared Ghostty/tmux window as the other apps.

```bash
dev              # interactive controller (status + menu)
dev start        # astro dev on :4321, hot reload
dev worker       # wrangler dev on :8787 - checks .dev.vars, seeds photos first
dev all          # dev + worker together
dev restart      # restarts whatever is currently up
dev images       # refill the local photo bucket (--force to re-fetch)
dev stop         # stops every mode and closes its tabs
dev check        # every gate in the repo, in the foreground
```

The three modes are independent: `dev start` brings up `astro dev` and nothing
else, which is why `dev status` normally shows the other two stopped. `dev all`
is the pair worth having open together — hot reload for iterating, the Workers
runtime for the gate, `/admin` and photos.

`dev stop` takes down all three, and `dev restart` therefore restarts **whatever
was up** rather than dropping back to `dev` alone. Losing the worker silently is
the failure worth avoiding: the site still loads on 4321, so nothing looks
wrong, but it is ungated with no `/admin` and no photos — which reads as those
features breaking rather than as a server not running.

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

**`preview` cannot serve the four announcement routes at all.** `astro preview`
serves files; `/`, `/announcements/`, `/announcements/<slug>/` and `/rss.xml`
are not files any more. Use `worker` for anything involving a post.

**Restart `worker` after `npm run build`.** The build removes and rewrites
`dist/`, and the running server does not survive having the directory it is
serving replaced underneath it: it starts answering 404 for pages that exist and
500 for pages that work. Nothing in the output says so, and it looks exactly
like the change you just made being broken. Same family as the "restart after a
branch switch" rule below.

If you are testing the password gate, copy `.dev.vars.example` to `.dev.vars`
and put the real password in it first, or the gate fails closed and lets nobody
through. See [PRE-LAUNCH-GATE.md](PRE-LAUNCH-GATE.md).

### Testing `/admin` and photos locally

Two parts of the site are edge infrastructure: `/admin/api/*` and `/images/*`
live in the Worker, so `astro dev` cannot serve either and both 404 on their
own. `astro dev` therefore **proxies those two paths to the worker on 8787**
(see `astro.config.mjs`), which means 4321 does everything — hot reload plus a
working editor and real photos — as long as `dev worker` is also up. `dev all`
starts both. With the worker down, those paths answer with a sentence saying so
rather than a generic 500.

That proxy is dev-only; a build never sees it. On the deployed site the Worker
handles both paths itself.

What the worker still needs set up, because the edge services behind it have no
local equivalent:

`dev worker` handles most of it: before launching it reads `.dev.vars`, tells
you which of the gate and `/admin` will not work and why, and seeds the local
photo bucket. `dev status` shows the same thing without starting anything. The
one thing it cannot invent is which address to sign you in as.

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

You do **not** need a GitHub token for this. Announcements never touch GitHub,
and the Instagram list loads without one because the repository is public. If
you have a stale `GITHUB_TOKEN` line in `.dev.vars`, delete it — an invalid
token is worse than none, and the editor will tell you so.

**Announcements are fully writable locally, and write nowhere else.** `wrangler
dev` binds a *local* D1 database under `.wrangler/state`, so creating, editing,
pinning and deleting posts on :8787 does not touch the live site. `dev worker`
applies the migrations before it starts, so the tables and the original five
posts are there on a fresh clone.

That is new, and it is most of what this migration bought. Local runs used to be
read-only, because a save was a real commit to the real repository — which made
the editor the one part of the site with no feedback loop shorter than a deploy
(F40). Your local posts drift from production from the first edit; that is
expected. To start over, delete `.wrangler/state` and run `dev worker` again.

**The Instagram list is still read-only locally**, because it is still a file in
the repository. `DEV_ALLOW_WRITES=true` in `.dev.vars` enables it, along with a
`GITHUB_TOKEN` that has **Contents: write**. The editor's banner says which of
the two states it is in.

**Photos.** `wrangler dev` binds a *local* R2 bucket, not the production one, so
it starts empty and every photo 404s. `dev worker` fills it automatically; the
manual form is `dev images`, or:

```bash
npm run dev:images
```

That copies the photos the current posts reference from the live site. It needs
no credentials — `/images/*` is routed ahead of the gate — and it records what
it has already fetched, so running it again does nothing. Add `--force` after
someone uploads a photo through the real `/admin`, or to re-fetch after clearing
`.wrangler/`.

### Running the gates

```bash
dev check
```

Fourteen of them: build, `astro check`, and the twelve `check:*` scripts. **Nothing
else runs these** — there is no CI workflow for them, and Cloudflare Workers
Builds only runs `npm run build` — so a gate missing from `do_check` in
`dev-control.sh` is a gate that never runs. Add new ones there.

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
                           BUILD-TIME ONLY - never import it from a route
src/data/events.json       calendar snapshot, generated - never edit by hand

migrations/                the announcements database: schema, then the import
                           of the five posts that used to be markdown files

src/styles/global.css      brand primitives plus the --pta-* token contract
src/themes/                one CSS token block per theme, plus registry.ts
src/layouts/BaseLayout     <head>, fonts, Open Graph, the theme attribute
src/layouts/PageLayout     shell for every standalone page
src/layouts/structures/    structural arrangements a theme renders through
src/components/sections/   Hero, QuickActions, News, GetInvolved, Committees...
src/lib/ical.ts            iCalendar reader; no dependencies, no platform APIs
src/lib/posts.mjs          every read and write of the announcements tables
src/lib/announcements.ts   what the four on-demand routes call
src/lib/markdown.mjs       post bodies to HTML, at request time
src/lib/grades.ts          grade slugs; here rather than in content.config.ts
                           so a route can import them without dragging the
                           build-time content loaders into the Worker
src/pages/[page].astro     renders anything in pages.yaml
src/worker.ts              the Worker: the pre-launch gate, then Astro

wrangler.jsonc             Cloudflare config. Two lines marked TEMPORARY
scripts/                   the gates, the calendar refresh, the image seeder
```

## Two rules that will bite you

**Tailwind's defaults are deliberately deleted.** `bg-blue-500`, `rounded-xl`,
`shadow-lg` and friends do not exist here and will **silently do nothing** -
they will not error, the utility simply is not generated. Use the tokens in
`src/styles/global.css`, or add one. PROJECT-BRIEF §3.3 has the reasoning; the
short version is that a design system you can bypass by accident is not one.

**Yellow is never text on white.** Lemon on white is 1.33:1 and fails WCAG AA
outright. It is a background and accent color only; yellow text needs a black
or blue ground. Full table in [`../assets/brand/README.md`](../assets/brand/README.md).

## Themes

A theme is a **token set and a structure**, paired in `src/themes/registry.ts`.
Pairing them is deliberate: it makes a token-only recolor impossible to ship by
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
