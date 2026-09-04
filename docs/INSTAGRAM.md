# Instagram posts on `/gallery`

Posts from [@blackshearpta](https://www.instagram.com/blackshearpta/) are
embedded on `/gallery`. There are **two ways to choose which ones**, and the
difference matters because one of them needs a Meta app and the other needs
nothing at all.

| | By hand | Automatic |
|---|---|---|
| Setup | none | a Meta app and a token (below) |
| Which posts | whichever you paste | the 12 most recent |
| Updates | when someone edits the file | nightly, on its own |
| Ongoing upkeep | none | reissue the token if the job stops for 60 days |

**Both use the same file**, `src/content/instagram.yaml`. The automatic job just
writes it for you. Nothing is lost by starting by hand and switching later, or
by turning the job off and going back to hand-editing.

## By hand — no setup at all

Embedding a post needs no app, no token, and no account link. Instagram renders
any **public** post from its address:

1. Open the post on instagram.com.
2. Copy the address from the browser bar — `https://www.instagram.com/p/ABC123/`.
3. Add a `- url:` line under `posts:` in `src/content/instagram.yaml`.

The build checks the shape of each address and fails with a plain-English
message if one is not a post permalink, so a wrong paste cannot reach the site
as a silently broken embed.

Three to six is about right. Each one loads an iframe from instagram.com, so a
long list is slow on a phone — worth knowing before setting the automatic mode
to twelve.

## Automatic — what the token is actually for

The distinction that decides whether you need any of this:

- **Displaying** a post needs nothing. Instagram's embed renders any public post
  from its URL, which is what the by-hand mode above does.
- **Finding out which posts are the most recent** needs an authenticated API
  call. There is no way to ask Instagram "what did this account post lately?"
  without one.

So the Meta app buys exactly one thing: *discovery*. If you are happy choosing
the posts yourself, stop reading here — nothing below is needed, and the nightly
job will notice the token is missing, do nothing, and pass.

### How it works

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

### What you need to do

Only for automatic mode. The whole of this is on Meta's side and cannot be
scripted from here, and it is roughly ten minutes.

#### 1. Make the account a Business or Creator account

Instagram app → Settings → Account type and tools → **Switch to professional
account**. Free, reversible, and it does not change how the account looks to
followers.

A personal account cannot be read by any API at all, so this step is not
optional.

#### 2. Create a Meta app

1. <https://developers.facebook.com/apps> → **Create app**
2. Use case: **Other** → type **Business**
3. Add the **Instagram** product → **API setup with Instagram login**
4. Under **Add account**, connect the `blackshearpta` account
5. Generate a token with the **`instagram_business_basic`** permission

This is the "Instagram API with Instagram Login" flow. It deliberately does
**not** need a linked Facebook Page or Business Manager — that is the older
route and it is considerably more setup.

#### 3. Put the token in a repository secret

GitHub → the repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**

- Name: `IG_ACCESS_TOKEN`
- Value: the long-lived token from step 2

**Do not put it anywhere else.** Not in `.dev.vars`, not in a comment, not in a
message to anyone. The repository is public.

#### 4. Run it once by hand

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

## Turning automatic mode off

Delete the `IG_ACCESS_TOKEN` secret. The job then finds nothing to do, passes
quietly, and stops touching the file — which goes back to being an ordinary
content file you edit by hand. The page never cared where the list came from.

To stop the job running at all, delete
`.github/workflows/refresh-instagram.yml`, or comment out its `schedule:` block
to keep it available from the Actions tab.

Set `posts: []` and the embeds disappear entirely, leaving the photo grid and
the follow link.

## Cost

Nothing. GitHub Actions minutes are unlimited on a public repository, the
Instagram endpoint is free at this volume (one call a day against a limit in the
hundreds per hour), and a Cloudflare build only happens on the days the posts
actually changed.
