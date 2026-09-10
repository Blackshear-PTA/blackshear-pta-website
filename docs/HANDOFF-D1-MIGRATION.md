# Kickoff: move announcements from git to D1

Paste this to the agent taking the job. Delete this file once the migration
lands — it is a handoff note, not documentation.

---

## What you are inheriting

The **Blackshear Elementary PTA** website (Austin ISD, East Austin). Astro 7
static output on Cloudflare Workers static assets, with a hand-written Worker at
`src/worker.ts`. Repo is **public**. Built and maintained by an unpaid volunteer
parent, and it has to stay maintainable by a non-technical volunteer after the
board turns over each year.

**Read `TASKS.md` first** — it is the live task board and the findings log. The
findings (F1…F40) are hard-won and several will save you a day.

Standing constraints, all non-negotiable:

- **Zero budget.** Free tiers only.
- **Maintainable by a non-technical volunteer.**
- **Works on mobile and desktop.**
- **Must not look AI-generated.**

## The job

Move announcements out of markdown-files-in-git and into **Cloudflare D1**, and
switch the announcement routes to render **on demand** so publishing is instant.

Both halves are needed. Moving content to D1 while keeping static generation
gains nothing on publish latency — the delay is the rebuild, not the storage.

Everything else stays as it is: the eight `pages.yaml` pages, `/calendar`,
`/gallery`, `/sponsors` and the rest remain statically generated, and photos
stay in R2.

## Why — the evidence, not a vibe

`/admin` currently saves a post by committing a markdown file through the GitHub
Contents API. That was a deliberate choice with real upside (see "Why it is
built this way" in `docs/ADMIN.md`), and the owner has now decided the costs
outweigh it. Concretely, from one working session:

| Problem | Cause |
|---|---|
| Publish takes 60–90s | every save is a commit, which triggers a full rebuild |
| **Local dev cannot write at all** | there is no local content store; `/admin` reads and writes the real repo |
| GitHub's 60/hr unauthenticated limit was hit during testing | one `/admin` page load spends ~7 Contents API calls |
| Pinning costs two commits | two files change, and there is no multi-file write |
| A removed form field silently set `pinned: false` | the API writes **whole documents**, so an omitted field is written as false |
| The events snapshot was typed from its own contents | data lives in a file in the repo, so TypeScript infers the type from today's data (see `SerializedEvent` in `src/lib/ical.ts`) |

The owner has explicitly **dismissed the portability concern** — the GitHub org
and the Cloudflare account both belong to the PTA, not to an individual, so
vendor lock-in is an accepted trade. Do not re-litigate it.

## What exists now

**Reads** — five places, all of which must keep working:

```
src/lib/announcements.ts              getAnnouncements(), formatDate(), postPath(),
                                      coverImage(), imageUrl(), excerpt()
src/pages/announcements/index.astro   the list
src/pages/announcements/[slug].astro  the post page (getStaticPaths)
src/pages/rss.xml.ts                  the feed
src/components/sections/Announcements.astro   the homepage block
```

**Writes** — `src/worker/admin.ts`, routes: `session`, `posts` (GET/PUT),
`posts/{slug}` (GET/DELETE), `images` (POST), `instagram` (GET/PUT).
The editor UI is `src/pages/admin/index.astro` (~2500 lines, all vanilla — no framework).

**The schema to port**, from `src/content.config.ts`:

```
title      string, required, ≤140 chars
date       date, required — drives ordering and the RSS pubDate
href       string, optional — a "read more" destination
linkLabel  string, optional — that button's words
images     array of { key, alt } — key is an R2 object key
cover      string, optional — must be one of images[].key
grades     array of enum: pre-k-3 pre-k-4 kinder 1 2 3 4 5
pinned     boolean, default false
draft      boolean, default false
body       markdown
```

Two validation rules are enforced by `.refine()` today and **must survive**:
every image needs non-empty `alt`, and `cover` must be one of this post's
images. They are also checked server-side in `validate()` in `admin.ts`.

## What to build

1. **A D1 database and schema.** `posts` plus whatever you need for `images` and
   `grades` — a JSON column is defensible at this size (five posts, a handful of
   images each); join tables are also fine. Say which you chose and why.

2. **The single-pin invariant, in the database.** At most one post pinned.
   Today the client does read-modify-write on two files and hopes. A partial
   unique index or a transaction makes it impossible to get wrong.

3. **A migration that imports the five existing markdown files** and is safe to
   re-run. Keep `src/content/announcements/*.md` in the repo, untouched, until
   the new path is proven — then remove them in a separate commit.

4. **On-demand rendering for the announcement routes only.** Add
   `@astrojs/cloudflare`, keep `output: 'static'`, and opt the announcement
   routes out of prerendering. `wrangler.jsonc` currently points `main` at the
   hand-written gate Worker; reconcile that with the adapter's entry rather than
   deleting the gate — see the gotchas.

5. **Rewrite the write path** in `admin.ts` against D1. This is where the
   whole-document footgun goes away: prefer field-level updates.

6. **An audit trail.** `git log src/content/announcements/` is currently the
   record of who changed what, and it disappears with this migration.
   `docs/ADMIN.md` promises it in writing. Replace it — an `edits` table with
   the editor's verified email, the action and a timestamp is enough. The email
   comes from the Access JWT (`src/worker/access.ts`).

7. **An export script.** `npm run export:posts` writing JSON or markdown to
   disk. Cheap insurance and it makes the migration reversible.

8. **Docs.** `docs/ADMIN.md` describes the git-commit design at length and will
   be wrong. `docs/DEVELOPMENT.md`, `docs/EDITING-CONTENT.md` and
   `docs/DEPLOYS.md` all reference it. Update `TASKS.md` with a finding
   explaining the switch.

## Gotchas that will bite you

Every one of these cost real time to find.

- **URLs must not change.** Posts live at `/announcements/<slug>/` where the
  slug is the filename minus `.md` (`YYYY-MM-DD-title-words`). `postPath()`
  derives it. Some are already linked from elsewhere. Keep the slug as a stored
  column rather than regenerating it from the title.

- **Astro's scoped CSS never reaches `document.createElement` elements.** Astro
  appends a `data-astro-cid-*` attribute to selectors *and* to elements in the
  template; script-built elements never get it, so the rule silently does not
  match. `/admin` builds every table row in script, and this was found twice —
  the whole posts table and then the photo editor were unstyled. There is now a
  `<style is:global>` block in `src/pages/admin/index.astro` hand-scoped to
  `:is(.admin, .sheet)`. **If you add script-built UI, put its CSS there.**

- **`dialog:modal { margin: auto }` in `src/styles/global.css` is load-bearing.**
  Tailwind's preflight resets `margin: 0` on everything, which drops every modal
  into the top-left corner. Do not remove it.

- **`/admin` is exempt from the pre-launch gate and must stay exempt.** See the
  router in `src/worker.ts`. The gate is temporary (TASKS.md A29) and `/admin`
  has to keep working the day it is deleted.

- **Local dev:** `astro dev` on :4321 proxies `/admin/api/*` and `/images/*` to
  the Worker on :8787 (see `astro.config.mjs`). `dev all` starts both.
  **Restart the dev server after a branch switch or pull** — Vite silently drops
  the proxy and you get 404 HTML from the API with no error anywhere.

- **Local sign-in** is `DEV_ADMIN_EMAIL` in `.dev.vars`, honoured only on a
  loopback hostname (`devIdentity()` in `src/worker/access.ts`). Local runs are
  read-only unless `DEV_ALLOW_WRITES=true`. **Once this migration lands, local
  writes should hit a local D1 and that read-only guard can probably go** — it
  exists only because saves currently hit the real repository.

- **Thirteen checks (build, `astro check`, and eleven `check:*` scripts), and nothing else runs them.** `dev check` is the only
  runner; there is no CI workflow for them and Workers Builds only runs
  `npm run build`. A gate missing from `do_check` in `dev-control.sh` is a gate
  that never runs. Add one for the D1 layer.

- **`npm run check:secrets` scans tracked files.** It has caught a real
  committed password once and a placeholder in documentation twice. Never put
  the site password or a token in the repo.

- Node is pinned in `.node-version`; use `fnm exec --` in non-interactive
  shells.

## What must not regress

- **Draft posts must not appear anywhere** — not the list, the homepage block,
  the RSS feed, or their own page. That last one was a real leak: a draft was
  filtered from every list and still had a page built at its own URL.
- **Both `.refine()` rules** above.
- **Photos** — R2 and the `/images/<hash>.<ext>` route are unchanged. Do not
  touch `src/worker/images.ts`.
- **The RSS feed** stays at `/rss.xml`.
- **Ordering** — pinned first, then newest by date.
- **The editor's behaviour**: dialogs do not dismiss on outside click, delete is
  confirmed in-page and centred, the formatting toolbar writes plain markdown.

## Working rules

- **Never merge a PR.** Carry work to an open PR and stop. `gh pr merge`,
  `git worktree remove`, `git push --force` and `git reset --hard` are in the
  owner's `deny` list and cannot be overridden.
- Branch from the current remote head of `main`, never a stale local one.
- **Report honestly.** If a gate is red or part of the scope is unfinished, say
  so in the PR body and in your reply.
- Verify claims by measuring, not by reasoning about the CSS. The preview pane in
  this environment frequently reports a 0×0 viewport and fails to decode images
  or composite screenshots — if a number looks impossible, check the harness
  before believing it.

## Definition of done

- A post saved in `/admin` is live **without a rebuild**.
- Local `/admin` can create, edit, pin and delete against a local D1.
- The five existing posts are in D1 with unchanged URLs, images and grades.
- Drafts appear nowhere.
- Who-changed-what is recoverable.
- `dev check` green, including a new gate for the D1 layer.
- Docs updated; a finding in `TASKS.md` explaining the switch and what it cost.

## Ask the owner for

- `npx wrangler d1 create <name>` — he runs Wrangler himself.
- Confirmation of whether the markdown files should be deleted in the same PR or
  a follow-up. Default to a follow-up.
