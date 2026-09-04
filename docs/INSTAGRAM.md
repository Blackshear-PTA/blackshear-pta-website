# Instagram posts on `/gallery`

The twelve most recent posts from [@blackshearpta](https://www.instagram.com/blackshearpta/)
are embedded on `/gallery`, refreshed by a job that runs every night at about
4:40am Central.

**Nothing happens until the setup below is done.** Until then the gallery shows
the PTA's own photo grid and a link to Instagram, which is what it did before.

## How it works

`astro dev` and the deployed site are both static, so nothing can call Instagram
when a page loads — doing it in the browser would mean shipping an access token
to every visitor, which is the same as publishing it.

So the fetch happens on a schedule instead:

1. `.github/workflows/refresh-instagram.yml` runs nightly.
2. `scripts/refresh-instagram.mjs` asks Instagram for the latest twelve posts
   and writes their permalinks into `src/content/instagram.yaml`.
3. If that file changed, the job commits it — which is what triggers Cloudflare
   to rebuild and publish.

The page is therefore up to a day behind. For an account that posts every few
days, nobody notices.

**Permalinks, not images.** The API also returns image URLs, but they expire
after a few days, so a build a week later would render broken pictures. A
permalink is stable forever and Instagram's own embed renders the post from it.

## What you need to do

The whole of this is on Meta's side and cannot be scripted from here.

### 1. Make the account a Business or Creator account

Instagram app → Settings → Account type and tools → **Switch to professional
account**. Free, reversible, and it does not change how the account looks to
followers.

A personal account cannot be read by any API at all, so this step is not
optional.

### 2. Create a Meta app

1. <https://developers.facebook.com/apps> → **Create app**
2. Use case: **Other** → type **Business**
3. Add the **Instagram** product → **API setup with Instagram login**
4. Under **Add account**, connect the `blackshearpta` account
5. Generate a token with the **`instagram_business_basic`** permission

This is the "Instagram API with Instagram Login" flow. It deliberately does
**not** need a linked Facebook Page or Business Manager — that is the older
route and it is considerably more setup.

### 3. Put the token in a repository secret

GitHub → the repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**

- Name: `IG_ACCESS_TOKEN`
- Value: the long-lived token from step 2

**Do not put it anywhere else.** Not in `.dev.vars`, not in a comment, not in a
message to anyone. The repository is public.

### 4. Run it once by hand

GitHub → **Actions** → **Refresh Instagram** → **Run workflow**. It should
finish green and commit `src/content/instagram.yaml`. If it fails, the log says
why in plain language.

## Tokens expire, and this is the part that will bite

Long-lived Instagram tokens last **60 days**. The nightly job calls the refresh
endpoint on every run, which is enough to keep a token alive indefinitely *while
the job is running* — but the refreshed value cannot be written back into the
repository secret, because the token GitHub Actions gives a workflow is not
allowed to update secrets.

So in practice:

- If the job runs every night, the token stays valid.
- If it is disabled, or the repository goes quiet for 60 days, the token dies
  and must be reissued through step 2.

The job **fails loudly** in two cases rather than carrying on: when the fetch
errors, and when the token has under 14 days left. Both send an email to whoever
owns the repository. That is deliberate — the alternative is writing an empty
list and silently blanking the gallery, which nobody would notice for a month.

A stale gallery is much better than an empty one, so a failed run never
overwrites the existing file.

## Turning it off

Delete `.github/workflows/refresh-instagram.yml`, or comment out its `schedule:`
block to keep it runnable by hand.

`src/content/instagram.yaml` then just sits there as an ordinary content file and
can be edited by hand — the page does not care where the list came from. Set
`posts: []` and the embeds disappear, leaving the photo grid and the follow link.

## Cost

Nothing. GitHub Actions minutes are unlimited on a public repository, the
Instagram endpoint is free at this volume (one call a day against a limit in the
hundreds per hour), and a Cloudflare build only happens on the days the posts
actually changed.
