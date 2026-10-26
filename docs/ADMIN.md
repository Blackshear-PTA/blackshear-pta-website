# The announcements editor (`/admin`)

A board member signs in with their PTA Google account and can post, edit and
delete announcements without touching git, GitHub or a text editor.

**Nothing about it works until the setup below is done.** It fails closed and
says which piece is missing, so you can work through this in any order and the
page will tell you what is left.

## Why it is built this way

Saving a post writes a row to a **Cloudflare D1 database**, and the four pages
that show announcements are rendered when somebody asks for them. A save is
live immediately - there is no build, and nothing to wait for.

### What this replaced, and why

Until September 2026 a save **made a commit** to this repository: one markdown
file per post, written through the GitHub Contents API. That was a deliberate
choice with real advantages - git history was the audit log for free, `git
revert` was the undo button, and developers and board members edited the same
files with no second copy to get out of step.

It was given up because the costs turned out to be larger than the benefits,
all of them measured rather than predicted:

| Problem | Cause |
|---|---|
| Publishing took 60-90 seconds | every save was a commit, and every commit was a full site rebuild |
| **Local development could not write at all** | there was no local content store, so `/admin` on a dev server read and wrote the real repository |
| GitHub's 60/hour limit was hit while testing | one `/admin` page load spent about seven Contents API calls |
| Pinning cost two commits | two files changed and there is no multi-file write |
| A removed form field silently unpinned a post | the API writes **whole documents**, so a field the form stopped sending was written as false |

Finding F41 in [TASKS.md](../TASKS.md) has the full account, including what the
move cost.

### What replaced each thing that was lost

- **The audit log.** An `edits` table records every create, edit, pin, unpin and
  delete with the editor's verified email address and a timestamp. It is on the
  `/admin` page under **History**; you do not need git or a terminal to read it.
- **The undo button.** A delete keeps the entire post in that table, so it can
  be put back. See [Recovering a deleted post](#recovering-a-deleted-post).
- **Something to back up.** `npm run export:posts -- --remote` writes every post
  to `exports/` as markdown, in the same format the files used to have, plus the
  history as JSON. This is the one real new obligation: rows in a managed
  database are not backed up by every clone the way files in git were.

The Instagram list on `/gallery` followed later ([A52](../TASKS.md)). It is one
row in the same database (`migrations/0004`), a save shows on the next visit to
`/gallery`, its changes appear under **History**, and the export includes it. It
used to be `src/content/instagram.yaml`, saved as a commit through a GitHub
token; nothing in the editor talks to GitHub any more.

## Setup checklist

Work top to bottom. Steps 1-3 are independent of Cloudflare Access and can be
done any time; 4 onwards is the Access work.

- [ ] **1.** Merge the PR that adds `/admin`. Until it is on `main` the path does
      not exist and Access would be protecting nothing.
- [ ] **2.** Set build watch paths ([DEPLOYS.md](DEPLOYS.md)).
- [ ] **4.** Check <https://www.cloudflarestatus.com> for open **Access**
      incidents before touching anything. A control-plane degradation makes
      toggles do nothing and can silently discard a created application.
- [ ] **5.** Add **Google Workspace** as the identity provider (section 1, step 0).
      With no identity provider, the login page asks board members for a
      Cloudflare account.
- [ ] **6.** Create the Access application (section 1 below).
- [ ] **7.** **Reload the Applications list and confirm it is still there.**
      Cloudflare will let you complete the wizard during a degradation and then
      lose the result.
- [ ] **8.** Copy the **AUD tag** and note your **team domain**.
- [ ] **9.** *(Retired.)* This used to be a GitHub token for the Instagram
      list. Nothing needs one now (section 2 below).
- [ ] **10.** Set the two Access Worker secrets (section 3 below).
- [ ] **11.** Create the photo bucket:
      `npx wrangler r2 bucket create blackshear-pta-images`
- [ ] **12.** Create the announcements database and apply the migrations
      (section 5 below). **Before the first deploy** - a binding for a database
      that does not exist fails the whole Worker, not just announcements.
- [ ] **13.** Open `/admin`, sign in, and post something with a photo. Delete it
      afterwards, then check it is in **History** at the bottom of the page.

If sign-in fails, check the status page again before assuming
misconfiguration, then [When something goes wrong](#when-something-goes-wrong).

## Setup

### 1. Cloudflare Access in front of `/admin`

This is what makes it *your board* and not the internet.

Zero Trust **Free covers 50 seats**, and a seat is consumed by someone who
*authenticates* - not by someone who visits the site. Only `/admin` sits behind
Access, so the count is board members who sign in to post, not parents reading
announcements.

**Verified against the dashboard on 2026-09-01, and again on 2026-10-15 when
Google sign-in replaced the emailed code.** Cloudflare moves this UI
regularly; if the wording below does not match, the shape of the task is the
same and the labels are close.

0. **Add Google Workspace as the identity provider first.** It takes three
   places. Do all of them signed in as a super admin role account
   (`communications@`), never a personal one, so the result belongs to the role.

   **Google Cloud** (console.cloud.google.com)

   1. Create a project under the **blackshearpta.org organization**, not "No
      organization". Ours is `blackshear-pta-access`. No billing account.
   2. **APIs & Services**: enable **Admin SDK API**.
   3. **Google Auth Platform -> Branding**: app name `Blackshear PTA Admin`,
      support and contact email `communications@blackshearpta.org`,
      **Audience: Internal**. Internal is what limits sign-in to PTA accounts:
      nobody outside the organization can sign in at all. Add no scopes.
   4. **Clients -> Create client**, type **Web application**, with Authorized
      JavaScript origin `https://tight-cell-8e63.cloudflareaccess.com` and
      Authorized redirect URI
      `https://tight-cell-8e63.cloudflareaccess.com/cdn-cgi/access/callback`.
   5. **Copy the client secret straight away.** Google shows it once. It lives
      in the password manager and nowhere else.

   **Google Admin console** (admin.google.com)

   6. Security -> Access and data control -> API controls -> Settings ->
      Internal apps -> **Trust internal apps** -> Save. It can take up to 24
      hours to apply.

   **Cloudflare** (Zero Trust)

   7. **Integrations -> Identity providers -> Add new -> Google Workspace**:
      the Client ID as *App ID*, the client secret, and `blackshearpta.org` as
      the domain. Name it *Blackshear PTA Google Workspace*. Set **Google
      prompt** to *Select account*, so people choose their PTA account instead
      of whichever Google account the browser has open. Leave PKCE and SCIM off.
   8. **Open the link Cloudflare shows after saving**, as a super admin, and
      click **Allow**. That lets it read group membership, and **Test** fails
      until it is done.
   9. **Test.** It should show your identity and your groups.

   Do this before creating the application. With no identity provider at all,
   every confusing thing about the Authentication step downstream follows (F30).

1. Cloudflare dashboard -> **Zero Trust** -> **Access controls** ->
   **Applications**
2. **Create new application** -> **Self-hosted and private**
3. **Add public hostname**
4. **Domain**: pick `blackshearpta.org` from the dropdown, path `admin`
5. **Access policies**: add one, *Blackshear PTA Website - Board (Google
   Workspace)*, action **Allow**:
   - **Include** -> **Emails**, listing each role address that should post.
     Today: `communications@`, `president@`, `vp@`, `secretary@` and
     `fundraising@`.
   - **Require** -> **Login Methods** -> *Blackshear PTA Google Workspace*, so
     only a Google sign-in satisfies it.

   > Prefer the explicit list over **Emails ending in** `@blackshearpta.org`.
   > The domain would admit every PTA account, the break-glass account,
   > `hello@` and every committee address included. Role addresses pass to the
   > next volunteer with the role, so the list rarely changes, and it bounds
   > the seat count to the people you named.

6. **Authentication**: select the **Google Workspace** provider, and nothing
   else. Then turn **Apply instant authentication** ON: with one method, Access
   skips its own login page and sends people straight to Google's account
   picker.

   > If the provider list is empty, Access falls back to making people sign in
   > with a **Cloudflare account**, which no board member has. The login page
   > then offers only "Sign in with Cloudflare", and **Apply instant
   > authentication** is greyed out, because it needs exactly one login method
   > and zero is not one (F30).

7. **Session Duration**: 24 hours is reasonable
8. **Create**

> **Check the path before saving.** The application must be
> `blackshearpta.org` with path `admin`. Leave the path empty and Access
> protects the **whole site** - every parent gets a login screen. `admin`
> covers `/admin` and
> everything under it, including the `/admin/api/*` calls the editor makes.

Then collect the value the Worker needs: select the application ->
**Configure** -> **Additional settings** -> **Application Audience (AUD) Tag**.

Your **team domain** is `<team-name>.cloudflareaccess.com`. If you did not
choose the team name yourself, Cloudflare generated one and it is not obvious
where to read it back. The quickest way is to ask the site:

```sh
curl -sI https://blackshearpta.org/admin | grep -i '^location:'
```

The redirect goes to the Access login page, and its hostname **is** your team
domain. The same URL also carries this application's AUD tag as its `kid`
parameter, so it doubles as a cross-check that you copied the right one from the
dashboard. Neither value is sensitive - both are in every unauthenticated
redirect, which is why this works.

The Worker fetches its signing keys from
`https://<team-domain>/cdn-cgi/access/certs`, so the team domain has to be
exact: bare hostname, no scheme, no trailing slash.

### Who owns the sign-in, and the emergency fallback

**The Google sign-in client belongs to the PTA, not a person.** The project
`blackshear-pta-access` sits under the PTA's Google organization, so it survives
turnover, and any super admin can manage it. Google deletes an OAuth client
that goes unused for six months, and emails a warning 30 days before. If
`/admin` sits unused that long, sign-in fails with `Error 401: deleted_client`:
create a new client (step 0, steps 4-5) and paste it into the Cloudflare
provider (step 7).

**How it worked before.** Until 2026-10-15 the only method was one-time PIN, a
code emailed to an allowlisted address, which included personal Gmail
addresses. Google Workspace replaced it (B6 in [TASKS.md](../TASKS.md)), and the
old policy and one-time PIN were both removed, so those addresses no longer get
in.

**If Google sign-in ever breaks,** a Cloudflare Super Administrator can restore
access in minutes: Integrations -> Identity providers -> add **One-time PIN**;
on the application, select it and turn instant authentication off; attach a
small policy naming one admin address with **Require -> Login Methods ->
One-time PIN**. Remove all of it again afterwards.

### 2. A GitHub token (retired)

There used to be a step here creating a fine-grained GitHub token, so the editor
could save the Instagram list as a commit. The list is in the database now
([A52](../TASKS.md)) and nothing in the editor writes to the repository, so no
token is needed. If one is still set up, see *The old GitHub token* below for
what to delete.

### 3. Two Worker secrets

From the repository directory, so wrangler targets the right Worker:

```sh
npx wrangler secret put CF_ACCESS_TEAM_DOMAIN   # e.g. blackshearpta.cloudflareaccess.com
npx wrangler secret put CF_ACCESS_AUD           # the AUD tag from step 1
```

> **`wrangler secret put` fails with error 10215** when the Worker's newest
> version is not the deployed one, which happens after any branch preview
> build. Merge to `main` first, or use the dashboard: **Workers & Pages** ->
> `blackshear-pta` -> **Settings** -> **Variables and Secrets**.

### 4. A bucket for photos

```sh
npx wrangler r2 bucket create blackshear-pta-images
```

Two things will interrupt that, both of them normal:

**`[ERROR] ... Please enable R2 through the Cloudflare Dashboard. [code: 10042]`**
R2 has to be switched on for the account once before any bucket can exist, and
that is separate from creating buckets. Dashboard -> **Storage & databases** ->
**R2**, accept the terms, then re-run. Free tier is 10GB, 1M writes and 10M
reads a month with **no egress charge** - at roughly 400KB a photo that is about
25,000 photos, so this stays free.

**"Would you like Wrangler to add it on your behalf?" - say NO.**
Wrangler offers to write the binding into `wrangler.jsonc` for you and defaults
the name to a snake_case version of the bucket, `blackshear_pta_images`. The code
uses **`env.IMAGES`**, and the binding is already declared in this repo. Accepting
adds a second entry under a name nothing reads, in whatever branch happens to be
checked out. Ctrl-C once the bucket is created; that is the only part of the
command that matters here.

**Create the bucket before deploying the code that declares the binding.** Cloudflare
validates R2 bindings when a Worker version is uploaded, so a deploy referencing
a bucket that does not exist **fails the whole build** - not just photo uploads.
This is not a fail-closed-and-carry-on situation like the missing secrets are;
nothing deploys at all until the bucket is there.

The binding lives in `wrangler.jsonc` rather than being added through the
dashboard on purpose: `wrangler deploy` replaces the Worker's bindings with
whatever the config says, so a dashboard-only binding would be silently wiped by
the next deploy.

Free tier is 10GB, which at the sizes below is several thousand photos.

### 5. The announcements database

The posts themselves. Created once, already done for this project:

```sh
npx wrangler d1 create blackshear-pta
```

**Say NO** to "Would you like Wrangler to add it on your behalf?", for the same
reason as the bucket above: it defaults the binding to `blackshear_pta` and the
code reads **`env.DB`**, which is already declared in `wrangler.jsonc`.

Then create the tables and load what the migrations carry: the original five
posts, the Weekly Buzz and the Instagram list. Local and remote are tracked
separately, so both need doing, and the remote one waits for Jon's OK in chat
([DEPLOYS.md](DEPLOYS.md)):

```sh
npm run db:migrate                 # your machine
npm run db:migrate:remote          # the live database
```

`migrations/` holds the schema and the import, and wrangler records what it has
already applied - running either command twice is a no-op.

**Do this before deploying.** A D1 binding naming a database that does not exist
fails the whole Worker version, exactly like the R2 bucket above (F29). Free
tier is 5GB of storage and 5 million row reads a day, which this site will not
approach: the whole announcements table is a few kilobytes and a busy day is a
few hundred page views.

Two things live in that database:

- **`posts`** - one row per announcement. At most one may be pinned, and the
  database enforces that with a partial unique index rather than trusting the
  editor to get it right.
- **`edits`** - the history. Never deleted from.

## Using the editor

The list of posts is the page. Writing happens in a panel on top of it, so the
list is never lost and there is no question of where you are.

**The panel cannot be dismissed by clicking away from it.** That gesture is the
most common way people lose a half-written post and there is no upside to
supporting it, so only Cancel closes the panel - and Cancel asks first if there
is anything unsaved. Escape does the same thing as Cancel rather than nothing,
because a modal with no keyboard exit traps anyone not using a mouse.

Each row shows what matters at a glance: the date, the title, and labels for
pinned, draft, which grades it is aimed at, and how many photos it has. Editing
is an explicit **Edit** button rather than clicking the title, which previously
gave no clue it was clickable. **View** opens the live post in a new tab.

**Grades** default to "everyone at the school", which is the common case and
therefore costs nobody a decision. Untick it to pick specific grades; they show
as a label on the post and are there for filtering and targeted notifications
later.

**Saving publishes, immediately.** Reload the announcements page and the change
is there. There is nothing to wait for and no separate publish step.

**Pinning is on the row's `⋯` menu, not in the editor panel.** At most one post
is pinned at a time, which makes it a decision about the list rather than about
one post - and the database refuses to hold two pinned posts, so pinning one
always unpins the other in the same operation. Saving a post never changes its
pin.

### Recovering a deleted post

The whole post is kept in the history, so nothing is really gone. It cannot be
restored from the editor - putting back a post somebody deliberately removed
should involve a conversation - but it takes one command:

```sh
npx wrangler d1 execute blackshear-pta --remote \
  --command "SELECT detail FROM edits WHERE action = 'delete' ORDER BY at DESC LIMIT 5"
```

That prints the deleted posts as JSON, most recent first. Hand the one you want
to whoever looks after the website; every field is there.

`npm run export:posts -- --remote` is the other half of this: it writes every
current post to `exports/` as markdown. **Run it occasionally.** A database is
not backed up by the fact that somebody has a copy of the repository, which is
how the old markdown files were protected without anyone thinking about it.

## Photos

Drag photos onto the box, or click it to choose. Several at once is fine.

**Every photo is cropped before it is uploaded, and you approve the crop.**
Photos are shown as a wide rectangle across the site, so a portrait shot of one
child becomes a band across their middle unless somebody aims it. The crop step
shows the exact frame, lets you drag and zoom, and asks for the description at
the same time. Nothing is uploaded until you confirm it.

A post can hold **several photos**. One is the **cover**, which is what appears
on the homepage and in lists; the rest form a gallery on the post's own page.
With a single photo there is nothing to choose and it becomes the cover
automatically.

**Every photo is also shrunk in the browser before it is uploaded**, and that is
doing more work than it looks like:

- **It removes the location.** A phone photo carries GPS coordinates in its EXIF
  data. Re-encoding through a canvas drops all of it. Publishing the exact spot
  a picture of children was taken is not something this site should do by
  accident, and nothing downstream would have caught it.
- **It makes the page usable on a phone.** A phone photo is 3-5MB. Astro's
  build-time image pipeline cannot help, because the file arrives long after the
  build - so whatever is uploaded is what every parent downloads. Measured: a
  4032x3024 photo goes from 2.8MB to about 410KB, an 85% reduction, with the
  longest edge capped at 1600px. Small images are left alone rather than
  upscaled.
- Portrait photos stay portrait. EXIF is also what records that a phone was held
  vertically, so the orientation is applied before the data is discarded.

**A description is required.** The form asks for one as soon as a photo is
attached, the API refuses a save without it, and the content schema fails the
build if a file ever gets one without the other. A photo with no description is
unusable to anyone using a screen reader, and this is the one accessibility
requirement a well-meaning volunteer is most likely to skip.

Photos are stored by content hash and served from `/images/<hash>.<ext>` through
the Worker, so there is no second hostname and no public bucket to configure.
The same photo uploaded twice is stored once.

## The old GitHub token

Until the Instagram list moved into the database ([A52](../TASKS.md)), the
editor saved it as a commit through a GitHub token set never to expire ([D12](../TASKS.md#open-decisions)):
an expiring one would have broken `/admin` months later with nobody left who
knew why. **Both halves were deleted on 2026-10-24**, since a credential nothing
uses is only exposure. Kept here in case a copy turns up somewhere:

- the `GITHUB_TOKEN` secret on the Worker: Cloudflare dashboard -> **Workers &
  Pages** -> `blackshear-pta` -> **Settings** -> **Variables and Secrets**;
- the token itself, as described here:

| | |
|---|---|
| Owned by | the PTA's **admin account** on GitHub since 2026-10-23 (the PTA's own account before that), not a board member's personal one, so it survives turnover |
| Resource owner | the `Blackshear-PTA` organization |
| Scope | Contents: read and write, `blackshear-pta-website` only |
| Expiry | none |
| Name | `blackshear-pta-instagram` |
| Revoke at | GitHub, signed in as the admin account -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens |

## Two locks, on purpose

`/admin` is **exempt from the pre-launch password gate** and has to be. Access
with a real identity provider is strictly stronger than a shared password, so
asking for both would be friction with no security value - and the editor would
otherwise stop working the day the gate is removed at cutover, which is exactly
when it starts mattering.

The Worker also **re-verifies the Access token itself** on every API call rather
than trusting that Access did its job. Two reasons:

1. It is the only trustworthy source of *who* is editing, which is what lands in
   the `edits` table - the history is only worth having if the name on it came
   from somewhere the browser cannot choose.
2. An Access policy is dashboard configuration, and dashboard configuration gets
   edited, mis-scoped, or deleted by someone who does not realize it is the only
   thing in front of a write endpoint. If that happens, this fails closed.

`scripts/check-access.mjs` mints real RS256 tokens against a throwaway keypair
and checks that expired tokens, wrong-audience tokens, wrong-issuer tokens,
`alg: none`, HS256 algorithm confusion, unknown signing keys and tampered
payloads are all refused.

## When something goes wrong

| On screen | Means |
|---|---|
| `Missing Worker secret(s): ...` | Step 3 is incomplete. It names which. |
| `Not signed in.` | No valid Access token. Usually an expired session; reload. |
| `That post was changed by someone else.` | Two people edited the same post. Reload and redo. |
| `GitHub write failed: 401` | The token is expired or was revoked. Reissue it. |
| `GitHub write failed: 403` | The token lacks **Contents: write**, or is not scoped to this repo. |
| `Photo storage is not set up yet` | The R2 bucket does not exist. Section 4 above. |
| `That file does not look like an image` | The bytes are not a JPEG, PNG or WebP whatever the file is named. |
| `Describe the photo so screen readers can read it out` | A photo is attached with no description. Required. |
| Saved, but the site looks unchanged | Reload it - there is no build to wait for any more. If it is still stale, the page was cached by the browser. |
| `Could not verify sign-in: Access certs fetch failed` | `CF_ACCESS_TEAM_DOMAIN` is wrong. It is the bare hostname, no `https://` and no trailing slash. |
| Signed in fine, but every call says `Not signed in.` | `CF_ACCESS_AUD` does not match this application's AUD tag. A token minted for a different Access app is refused on purpose. |
| `Your sign-in session expired` | The Access session lapsed. Reload; you will be asked to sign in again. |
| Login page offers only "Sign in with Cloudflare" | No identity provider is configured. Section 1, step 0. |
| `Not signed in.` on **localhost** | Expected. Access is enforced at Cloudflare's edge and does not exist locally. See "Running it locally" below. |
| `The Instagram list has not been moved into the database yet` | Migration 0004 has not been applied to this database. `npm run db:migrate:remote` (live) or `npm run db:migrate` (local). Until then `/gallery` shows the photos without the Instagram block. |
| Photos 404 on **localhost** | `wrangler dev` uses an empty local bucket. `npm run dev:images` fills it. |
| `The announcements database is not connected.` | The D1 binding is missing, or the migrations have never been applied. Section 5. |
| Google says access is blocked, or that the app can only be used within its organization | A personal Google account was chosen. Sign in again and pick the `@blackshearpta.org` account. See below. |
| Cloudflare says the account does not have access | A PTA account that is not in the policy. Add it under Access controls -> Policies, if it should post. |
| Google says the app is blocked by the administrator | **Trust internal apps** is off, or not yet applied. Section 1, step 0, step 6. |
| Google shows `Error 401: deleted_client` | The sign-in client was deleted after six months unused. See "Who owns the sign-in" above. |

## Running it locally

For anyone changing the editor rather than using it. Full version in
[DEVELOPMENT.md](DEVELOPMENT.md#testing-admin-and-photos-locally).

The editor needs two things that only exist at Cloudflare's edge, so on a dev
server neither is present. That is not a fault to debug:

- **Access** never attaches a token to a localhost request, so every
  `/admin/api/*` call answers `401 Not signed in.`
- **R2** is bound to a *local*, empty bucket, so every photo 404s.

Add one line to `.dev.vars` — the address you want to be signed in as, which
should be the one you use in production so the editor behaves the same way:

```
DEV_ADMIN_EMAIL=you@example.com
```

Then:

```bash
dev worker
```

That checks `.dev.vars`, says which pieces will not work and why, **sets up the
local announcements database**, seeds the local photo bucket, and starts the
Workers runtime on :8787. `http://localhost:8787/admin` then opens the real
editor. No GitHub token is needed; nothing in the editor talks to GitHub. If
`.dev.vars` still has a `GITHUB_TOKEN` line, delete it.

`DEV_ADMIN_EMAIL` is honoured **only** on a loopback hostname, so it is inert in
production; the hostname is the control, not the variable. `npm run
check:access` tests exactly that, including the lookalike hostnames a loose
check would wrongly accept.

**Writing works locally, and writes nowhere but this machine.** `wrangler dev`
binds a *local* D1 database under `.wrangler/state`, so you can create, edit,
pin and delete as much as you like: none of it reaches the live site. That is
new. It used to be impossible - a save from localhost was a real commit to the
real repository, so local runs had to be read-only, and the editor was the one
part of the site with no feedback loop shorter than a deploy (F40).

Two things follow:

- Your local posts are **yours**, and start as a copy of the original five from
  `migrations/0002`. They will drift from the live site. That is fine and
  expected; `npm run db:migrate` never overwrites what is already there.
- To start over, delete `.wrangler/state` and run `dev worker` again.

The **Instagram list** is in the same local database, so the same holds for it:
change it freely, and `/gallery` on :8787 shows the change on the next load.

## The one confusing thing a board member will hit

**Being signed in to the wrong Google account.** Most board members have a
personal Google account open in the same browser as their PTA one. The sign-in
shows Google's account picker every time, but choosing the personal account
gets an error from Google, and choosing a PTA account that is not on the list
gets a refusal from Cloudflare. Neither says "you picked the wrong account" in
so many words.

When someone says the editor is broken, check in this order:

1. Did they choose their `@blackshearpta.org` account in Google's picker?
2. Is that address in the policy? Zero Trust -> Access controls -> Policies ->
   *Blackshear PTA Website - Board (Google Workspace)*. Add it if they should be
   able to post.
3. Have they signed in to that PTA account before, and set up 2-Step
   Verification? A brand-new account has to do that first.
4. Only then look at [cloudflarestatus.com](https://www.cloudflarestatus.com)
   or Google Workspace's status page.

## Seats and billing

Zero Trust Free includes 50 seats. A seat is consumed when someone
**authenticates**, so only board members who sign in to `/admin` count - never
site visitors, because only `/admin` is behind Access.

With an explicit email allowlist (step 1.5) the ceiling is the length of that
list, which is the simplest way to be certain the free tier is never exceeded.
And because the Google client's audience is Internal, nobody outside the PTA's
Google organization can sign in at all.
Current usage is under **Zero Trust -> Settings -> Subscription**.

## Adding more than announcements later

The API is deliberately narrow: it edits one directory of markdown files. The
pieces that would be reused for pages or homepage copy - Access verification,
the GitHub client, the frontmatter round trip - are already separate modules in
`src/worker/`. Widening it means another route and another form, not a rewrite.

Resist widening it to *arbitrary* files. "Edit any file in the repo behind a
web form" is a much larger security surface than "edit posts", for a group whose
membership turns over every year.
