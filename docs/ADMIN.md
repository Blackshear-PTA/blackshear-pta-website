# The announcements editor (`/admin`)

A board member signs in with their PTA Google account and can post, edit and
delete announcements without touching git, GitHub or a text editor.

**Nothing about it works until the setup below is done.** It fails closed and
says which piece is missing, so you can work through this in any order and the
page will tell you what is left.

## Why it is built this way

Saving a post **makes a commit** to this repository. There is no database.

That sounds roundabout and it is the entire point:

- Git history is the audit log. `git log src/content/announcements/` says who
  posted what and when, permanently, with no extra work.
- `git revert` is the undo button, including for a delete.
- Developers and board members edit **the same files**. There is no second copy
  of the content and therefore no sync to get out of step.
- It costs nothing and there is nothing to back up.

The trade is that the live site updates about a minute after a save, not
instantly, because Cloudflare rebuilds it. For a PTA announcements page that is
a fine trade. The editor says so on screen rather than leaving someone
wondering whether the save worked.

## Setup checklist

Work top to bottom. Steps 1-3 are independent of Cloudflare Access and can be
done any time; 4 onwards is the Access work.

- [ ] **1.** Merge the PR that adds `/admin`. Until it is on `main` the path does
      not exist and Access would be protecting nothing.
- [ ] **2.** Rotate `SITE_PASSWORD` if it has ever been written down anywhere
      public.
- [ ] **3.** Set build watch paths ([DEPLOYS.md](DEPLOYS.md)).
- [ ] **4.** Check <https://www.cloudflarestatus.com> for open **Access**
      incidents before touching anything. A control-plane degradation makes
      toggles do nothing and can silently discard a created application.
- [ ] **5.** Create the Access application (section 1 below).
- [ ] **6.** **Reload the Applications list and confirm it is still there.**
      Cloudflare will let you complete the wizard during a degradation and then
      lose the result.
- [ ] **7.** Copy the **AUD tag** and note your **team domain**.
- [ ] **8.** Create the fine-grained GitHub token (section 2 below).
- [ ] **9.** Set the three Worker secrets (section 3 below).
- [ ] **10.** Create the photo bucket:
      `npx wrangler r2 bucket create blackshear-pta-images`
- [ ] **11.** Open `/admin`, sign in, and post something with a photo. Delete it
      afterwards.

If sign-in never arrives, check the status page again before assuming
misconfiguration - one-time PIN delivery has its own failure mode independent of
anything here.

## Setup

### 1. Cloudflare Access in front of `/admin`

This is what makes it *your board* and not the internet.

Zero Trust **Free covers 50 seats**, and a seat is consumed by someone who
*authenticates* - not by someone who visits the site. Only `/admin` sits behind
Access, so the count is board members who sign in to post, not parents reading
announcements.

**Verified against the dashboard flow on 2026-09-01.** Cloudflare moves this UI
regularly; if the wording below does not match, the shape of the task is the
same and the labels are close.

1. Cloudflare dashboard -> **Zero Trust** -> **Access controls** ->
   **Applications**
2. **Create new application** -> **Self-hosted and private**
3. **Add public hostname**
4. **Domain**: pick `blackshearpta.org` from the dropdown, path `admin`
5. **Access policies**: add one, action **Allow**, and for the rule choose
   **Include** -> **Emails**, listing each board member's address.

   > Prefer the explicit list over **Emails ending in** `@blackshearpta.org`,
   > even after Workspace lands. It bounds the seat count to people you named,
   > so the free-tier limit cannot be drifted into, and on one-time PIN it is
   > the difference between "the board" and "anyone who can receive mail at a
   > domain".

6. **Authentication**: leave **Accept all available identity providers** ON.

   > There is no "one-time PIN" checkbox to find, and looking for one is a
   > reliable way to lose ten minutes. One-time PIN is built into Access and
   > always available, so with no other provider configured, "accept all"
   > resolves to exactly it. Turning the toggle off makes the provider dropdown
   > selectable if you want to see it named.

   Also turn **Apply instant authentication** ON. With one login method it skips
   the "choose your provider" screen and goes straight to the PIN prompt.

7. **Session Duration**: 24 hours is reasonable
8. **Create**

> **Check the path before saving.** The application must be
> `blackshearpta.org` with path `admin`. Leave the path empty and Access
> protects the **whole site** - every parent gets a login screen, and the
> pre-launch gate sits unreachable behind it. `admin` covers `/admin` and
> everything under it, including the `/admin/api/*` calls the editor makes.

### When Google SSO arrives

Adding Google as a provider does not remove one-time PIN. With **Accept all
available identity providers** still on, someone on the allowlist could sign in
with an emailed PIN instead of Google - the allowlist still bounds who that is,
but that is the moment to turn the toggle off and select Google specifically.

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

### 2. A GitHub token for the write path

A **fine-grained** token, scoped to this one repository. Not a classic token.

1. GitHub -> your avatar -> **Settings** -> **Developer settings** ->
   **Personal access tokens** -> **Fine-grained tokens** -> **Generate new**
2. Resource owner: **Blackshear-PTA**
3. Repository access: **Only select repositories** -> `blackshear-pta-website`
4. Repository permissions: **Contents: Read and write**. Nothing else.
5. Set an expiry you will actually notice. When it expires the editor stops
   working and says so; the site itself is unaffected.

> Generate this from an account that will outlive one board term. A token on a
> departing parent's personal account is a thing that breaks in August.

### 3. Four Worker secrets

From the repository directory, so wrangler targets the right Worker:

```sh
npx wrangler secret put GITHUB_TOKEN            # the token from step 2
npx wrangler secret put CF_ACCESS_TEAM_DOMAIN   # e.g. blackshearpta.cloudflareaccess.com
npx wrangler secret put CF_ACCESS_AUD           # the AUD tag from step 1
```

`GITHUB_REPO` and `GITHUB_BRANCH` default to
`Blackshear-PTA/blackshear-pta-website` and `main`; set them only to override.

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

## Photos

**Every photo is shrunk in the browser before it is uploaded**, and that is
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

## Token lifetime

The GitHub token is deliberately set to **never expire**, and that is a
considered trade rather than an oversight.

An expiring token fails in the worst possible way for this project: it stops
working months later, `/admin` breaks, nobody remembers why, and the site starts
going stale - which is exactly the failure ([F18](../TASKS.md)) this editor exists
to prevent. The board turns over annually and there is no guarantee anyone will
be around who knows what a PAT is.

Against that, the exposure is narrow. The token is scoped to **Contents: write
on one already-public repository**. A leak would let someone commit to the PTA
website - no personal data, no money, and every change revertible in git.

Because nothing will ever force a rotation, the compensating control is that it
is written down:

| | |
|---|---|
| Owned by | the **PTA's** GitHub account, not a board member's personal one, so it survives turnover |
| Resource owner | the `Blackshear-PTA` organization |
| Scope | Contents: read and write, `blackshear-pta-website` only |
| Expiry | none |
| Revoke at | GitHub -> PTA account -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens |

**Revoke and reissue if** the PTA GitHub account's password is ever shared or
suspected compromised, or if unexplained commits appear in the repository
history. Reissuing is step 2 and step 3 of the setup above and takes a few
minutes; nothing else needs touching.

## Two locks, on purpose

`/admin` is **exempt from the pre-launch password gate** and has to be. Access
with a real identity provider is strictly stronger than a shared password, so
asking for both would be friction with no security value - and the editor would
otherwise stop working the day the gate is removed at cutover, which is exactly
when it starts mattering.

The Worker also **re-verifies the Access token itself** on every API call rather
than trusting that Access did its job. Two reasons:

1. It is the only trustworthy source of *who* is editing, which is what lands in
   the commit author.
2. An Access policy is dashboard configuration, and dashboard configuration gets
   edited, mis-scoped, or deleted by someone who does not realise it is the only
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
| Saved, but the site looks unchanged | Give it a minute. Check the build in Workers & Pages -> `blackshear-pta` -> Builds. |
| `Could not verify sign-in: Access certs fetch failed` | `CF_ACCESS_TEAM_DOMAIN` is wrong. It is the bare hostname, no `https://` and no trailing slash. |
| Signed in fine, but every call says `Not signed in.` | `CF_ACCESS_AUD` does not match this application's AUD tag. A token minted for a different Access app is refused on purpose. |
| `Your sign-in session expired` | The Access session lapsed. Reload; you will be asked to sign in again. |

## Seats and billing

Zero Trust Free includes 50 seats. A seat is consumed when someone
**authenticates**, so only board members who sign in to `/admin` count - never
site visitors, because only `/admin` is behind Access.

With an explicit email allowlist (step 1.5) the ceiling is the length of that
list, which is the simplest way to be certain the free tier is never exceeded.
Current usage is under **Zero Trust -> Settings -> Subscription**.

## Adding more than announcements later

The API is deliberately narrow: it edits one directory of markdown files. The
pieces that would be reused for pages or homepage copy - Access verification,
the GitHub client, the frontmatter round trip - are already separate modules in
`src/worker/`. Widening it means another route and another form, not a rewrite.

Resist widening it to *arbitrary* files. "Edit any file in the repo behind a
web form" is a much larger security surface than "edit posts", for a group whose
membership turns over every year.
