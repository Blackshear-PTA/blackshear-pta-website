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

## Setup

### 1. Cloudflare Access in front of `/admin`

This is what makes it *your board* and not the internet.

1. Cloudflare dashboard -> **Zero Trust** -> **Access** -> **Applications**
2. **Add an application** -> **Self-hosted**
3. Name it `Blackshear PTA admin`
4. Application domain: `blackshearpta.org`, path `admin`
5. Session duration: 24 hours is reasonable
6. Add a policy: **Allow**, and pick one of
   - **Emails** with each board member's address listed, or
   - **Emails ending in** `@blackshearpta.org` once Workspace is live (B4)
7. Identity provider: **One-time PIN** works today with no configuration and
   emails a code. Swap it for **Google** once Workspace exists - the swap is a
   dashboard change and needs nothing in this repo.
8. Save, then open the application and copy its **Application Audience (AUD)
   tag**.

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
| Saved, but the site looks unchanged | Give it a minute. Check the build in Workers & Pages -> `blackshear-pta` -> Builds. |

## Adding more than announcements later

The API is deliberately narrow: it edits one directory of markdown files. The
pieces that would be reused for pages or homepage copy - Access verification,
the GitHub client, the frontmatter round trip - are already separate modules in
`src/worker/`. Widening it means another route and another form, not a rewrite.

Resist widening it to *arbitrary* files. "Edit any file in the repo behind a
web form" is a much larger security surface than "edit posts", for a group whose
membership turns over every year.
