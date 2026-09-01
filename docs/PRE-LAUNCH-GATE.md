# The pre-launch gate

**Temporary.** Everything here gets deleted at launch; the last section says how.

The site sits behind one shared password until we go live. Anyone without it
gets `/under-construction/`: "we're still building, here's our current site,"
with a password field underneath. Once unlocked, a cookie keeps them in for 30
days.

## What it is and is not

It exists so a parent who finds the domain early does not mistake a half-built
site for the real one. That is the entire job.

**It is a speed bump, not a security boundary,** and it is not trying to be. A
password a dozen people share is not a secret. Treat everything behind it as
public, because effectively it is. Real access control, for `/admin` in Phase 2,
is Cloudflare Access with Google SSO, and that is a different mechanism for a
different purpose.

## The password

**It is not in this repository, and must not be.** The repo is public, so a
committed password is no password at all. It lives in a Cloudflare secret:

```sh
npx wrangler secret put SITE_PASSWORD
```

or: dashboard, Workers & Pages, `blackshear-pta`, Settings, Variables and
Secrets, Add, type Secret.

Secrets live on the Worker, so **branch previews inherit the same one**.

### It fails closed

Without the secret, nobody gets in, including us. That is deliberate. A site
that is ungated while everyone believes it is gated is worse than having no gate
at all, so if the two states are the failure modes available, that is the one to
fail into.

## How it works

`src/worker.ts` runs in front of the static assets.

- **`assets.run_worker_first` in `wrangler.jsonc` is load-bearing.** With static
  assets, Cloudflare serves a matching file *before* invoking JS unless that flag
  is set. Without it the Worker never runs for `/index.html` and the gate is
  purely decorative. It is the one line most likely to be "tidied up" later by
  someone who does not know that.
- **`/_astro/*` passes through ungated** so the gate page renders in-theme with
  real typefaces. Those files carry no page content. A gate that ships unstyled
  reads as a broken site, which is the opposite of the reassurance it exists to
  give.
- **The cookie holds a SHA-256 digest, not the password.** No reason to leave the
  plaintext in a cookie jar when a derived value verifies just as well.
- **`next` is validated on both sides.** A protocol-relative `//example.com` is a
  perfectly valid URL to a browser, so echoing it into a `Location` header
  unchecked turns the unlock endpoint into an open redirect.
- **The gate page is a real Astro page**, not HTML built inside the Worker, so it
  inherits the theme tokens instead of reimplementing them.

## Working on it locally

`npm run dev` and `npm run preview` are **ungated**: they never run the Worker.

To exercise the gate, copy `.dev.vars.example` to `.dev.vars`, put the real
password in it, and use the `worker` server on `:8787`.

```sh
cp .dev.vars.example .dev.vars
# edit it, then:
dev worker
```

`.dev.vars` is gitignored. Check that it still is before you put a real password
in it.

## Removing it at launch

Two deletions:

1. `src/worker.ts`
2. The three lines marked `TEMPORARY` in `wrangler.jsonc` (`main`,
   `assets.binding`, `assets.run_worker_first`)

Optionally also `src/pages/under-construction.astro` and `.dev.vars.example`,
which have no other purpose.

The site then goes back to serving static assets with no JS invoked at all,
which is both cheaper and simpler than what it does now. Tracked as part of A29
in [`../TASKS.md`](../TASKS.md).

**Removing the gate is not the same as launching.** The site-wide `noindex` is
separate and must come off at the same time, and not before Weebly is actually
retired. See [DEPLOYS.md](DEPLOYS.md).
