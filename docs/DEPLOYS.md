# Deploys

Every push to `main` triggers a Cloudflare Workers build, which deploys to
`blackshearpta.org`. Pushes to any other branch build a preview at
`<branch>-blackshear-pta.blackshearpta.workers.dev`.

There is no GitHub Actions build step for the site. Cloudflare Workers Builds is
connected directly to the repository and runs `npm run build` then
`npx wrangler deploy` itself. The build token is held by Cloudflare, so there is
nothing to store in GitHub.

The one GitHub Action in this repo does something else entirely: it refreshes
the calendar snapshot daily. See [CALENDAR.md](CALENDAR.md).

## Skipping builds that cannot change the site

Some paths are documentation or source material and are never read by
`astro build`, so a commit touching only those rebuilds and redeploys
byte-identical output. Two ways to avoid that:

**1. Build watch paths.** Set once in the Cloudflare dashboard, applies
automatically thereafter. **Not yet configured** - a docs-only PR still
triggered a full build and deploy on 2026-09-01, which is how we know.

Exact steps:

1. Cloudflare dashboard -> **Workers & Pages** -> `blackshear-pta`
2. **Settings** -> **Build** -> **Build watch paths**
3. Leave **Include paths** as `*` (everything builds by default)
4. Add each line from the exclude list below as an **Exclude path**

Exclude paths use glob syntax and are matched against paths relative to the
repository root. A push whose every changed file matches an exclude path is
skipped entirely - no build, no new Worker version.

**2. `[skip ci]` in the commit message.** Cloudflare honours the usual skip
tokens. Useful for a one-off the watch paths do not cover.

### Paths that cannot affect the built site

Verified by tracing every image and module import: nothing under `src/` reaches
outside it, so the root `assets/` folder is reference material only.

```
docs/**            architecture and decisions
assets/**          brand originals and the Weebly salvage - NOT src/assets
.claude/**         local dev-server launch config
scripts/**         the check gates; run by hand and in CI, never by astro build
TASKS.md
README.md
dev-control.sh
dev.config
```

> **`src/assets/**` is a build input and must NOT be excluded.** The committee
> photos and the page backdrops are imported from there and processed at build
> time. The two folders are one character apart, which is the mistake to avoid.

### Is it worth it?

Honestly, barely, on cost. This site builds in well under a minute and nowhere
near any free-tier ceiling. The real benefit is not publishing a new Worker
version identical to the one before it, which is what makes the deploy history
mean something.

## Response headers

`public/_headers` is a Cloudflare Workers static-asset feature, invisible to
`astro dev` and `astro preview`. It currently sets:

| Header | Why |
|---|---|
| `X-Robots-Tag: noindex, nofollow` | **Site-wide, until launch.** Weebly is still canonical; two indexed copies of the same content is a ranking mess to unwind |
| `X-Content-Type-Options: nosniff` | Standard hardening |
| `Referrer-Policy: strict-origin-when-cross-origin` | Standard hardening |

The `noindex` exists in **two** places: this header, and a `<meta name="robots">`
in `BaseLayout.astro`. A meta tag covers anything reading the HTML but not the
response headers, and vice versa. **Both come out at launch, not before**, and
not until Weebly is actually retired.

## Domains

`blackshearpta.org` is the real one. `.com` and `.net` are held in the same
Cloudflare account and redirect to it via Redirect Rules, currently **302**
because they are deliberately reversible. They flip to 301 at cutover; a 301
gets cached by browsers and intermediaries and is effectively unrecallable.

Redirect Rules apply instantly. If one is not working it did not save, it is not
propagating: a 522 means Cloudflare found no rule and proxied to the placeholder
address.

### Domain watch

```bash
npm run check:domain
```

Checks all three registrations against the registries' RDAP APIs and exits
non-zero if any is close to expiry, already lapsed, or in a suspended state.
RDAP rather than WHOIS because it returns structured JSON instead of text that
differs per registrar.

It maps each TLD to its own registry (`.org` to PIR, `.com`/`.net` to Verisign),
so a 404 only reads as "dropped" when the right registry was actually asked.
An earlier version hardcoded the `.org` endpoint and would have reported a false
alarm in the one direction that matters.

Run it by hand when you want to know. **There is deliberately no scheduled job.**
An automated nag about a renewal somebody is already chasing is noise, and a
recurring alert nobody can action is how alerts get ignored.

It is a smoke alarm, not a sprinkler. If a domain does lapse, nothing here buys
it back. Registrar transfer status is tracked as C9 in [`../TASKS.md`](../TASKS.md).
