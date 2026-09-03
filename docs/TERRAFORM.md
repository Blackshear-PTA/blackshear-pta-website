# Terraform for the Cloudflare account

**Investigation, not a decision.** Nothing here has been applied, no Cloudflare
setting was touched, and no state file exists. This document exists so the
choice can be made once, with the reasoning written down, instead of
rediscovered by whoever inherits the account.

## The recommendation, up front

**Generate the Terraform config and commit it. Do not adopt state yet.**

`cf-terraforming` can read the live account and write out `.tf` files describing
what is in it, without Terraform ever managing anything. That gets the thing
actually worth having - a reviewable, diffable record of the dashboard
configuration, in the repo, next to the docs that explain it - for none of the
cost that makes Terraform a bad fit for a volunteer project: no state file to
lose, no API token to store and hand over, no second system that can revert
somebody's dashboard change.

Then adopt state for **four resources only**, and only when one of the triggers
in [Option 2](#option-2---adopt-the-four-that-matter) actually fires.

If you read nothing else, read [The boundary](#the-boundary). It is the part
that can break the live site.

## What was checked, and what was not

| | |
|---|---|
| Provider | `cloudflare/cloudflare` **v5.24.0**, published 2026-08-24 |
| Import tool | `cf-terraforming` **v0.29.0**, released 2026-09-02 |
| Terraform | 1.15.5 locally. Import blocks need =1.5, S3-native locking needs =1.11 |
| Checked on | 2026-09-03 |

**The live account was not inspected.** There are no Cloudflare credentials on
this machine and this was a read-only investigation, so every claim about *what
exists* comes from [`../TASKS.md`](../TASKS.md) and [`docs/`](README.md), and
every claim about *what the provider supports* is verified against v5.24.0's own
generated documentation.

That distinction matters in one specific place. [Appendix A][appendix] snapshots
the DNS records as they were on 2026-08-28, and they are **not** what is in the
zone today: two of those A records pointed at GoDaddy parking, and attaching the
Worker to the apex as a custom domain will have replaced them. C5 also counts
three CNAMEs where the snapshot lists one. So the first step of any adoption is
running the inventory, not trusting the snapshot.

[appendix]: ../TASKS.md#appendix-a--dns-snapshot-2026-08-28

## The inventory

Everything configured by hand, what the provider offers for it, and whether it
is worth managing.

| What | Created by | Provider resource | Import | Verdict |
|---|---|---|---|---|
| Zone `blackshearpta.org` | dashboard | `cloudflare_zone` | ✅ | ❌ **Leave it.** See [why not the zone](#why-not-the-zone) |
| 13 DNS records | zone import | `cloudflare_dns_record` | ✅ | ✅ **Yes** - highest value of anything here |
| Redirect Rules, `.com`/`.net` | dashboard | `cloudflare_ruleset`, phase `http_request_dynamic_redirect` | ✅ | ✅ **Yes** |
| Access application `/admin` | dashboard | `cloudflare_zero_trust_access_application` | ✅ | ✅ **Yes** - worst thing to lose |
| Access policy, email allowlist | dashboard | `cloudflare_zero_trust_access_policy`, or inline | ✅ | ✅ **Yes**, inline. See [one policy, two ways](#one-policy-two-ways) |
| R2 bucket `blackshear-pta-images` | `wrangler` CLI | `cloudflare_r2_bucket` | ✅ | ⚠️ **Optional**, with `prevent_destroy` |
| One-time PIN identity provider | dashboard | `cloudflare_zero_trust_access_identity_provider` | ✅ | ⚠️ **Yes today, caution at B6.** See [state and secrets](#state-and-secrets) |
| Custom domains on the Worker | dashboard | `cloudflare_workers_custom_domain` | ✅ | ⚠️ **Possible**, and the one real boundary case |
| Web Analytics | auto, with the zone | `cloudflare_web_analytics_site` | ✅ | ❌ **Leave it.** Zero configuration, nothing to protect, and it re-enables with a toggle |
| Workers Builds Git integration | dashboard | **none** | - | 🚫 **Not possible.** See [what Terraform cannot reach](#what-terraform-cannot-reach) |
| Build watch paths | dashboard | **none** | - | 🚫 **Not possible** - part of Builds |
| Four Worker secrets | `wrangler` / dashboard | `cloudflare_workers_script.bindings` | - | 🚫 **Never.** See [The boundary](#the-boundary) |

Every resource in the "yes" rows supports `terraform import`. That was worth
verifying rather than assuming: `cloudflare_registrar_domain` - which is what
the GoDaddy transfer (C9) would eventually produce - explicitly **does not**,
so a future transferred domain cannot be adopted the same way.

## The boundary

> **Terraform may own account-level resources. Wrangler owns the Worker: its
> script, its version, its bindings, its secrets, and its routes.**

This is where the investigation started and it is where it ended: nothing found
moves the line. What did change is *which failure the line protects against*,
and that is worth stating precisely, because the two have different fixes.

### Secrets are not the collision

The premise going in was that Terraform and Workers Builds would overwrite each
other's secrets on alternating deploys. That specific fear is unfounded.
Wrangler's configuration reference is explicit:

> Wrangler will not delete your secrets (encrypted environment variables) unless
> you run `wrangler secret delete <key>`

and the secrets reference says the same thing about a deploy that does not
mention them: "Secrets not included in the file are preserved from the previous
version." A `wrangler deploy` triggered by Workers Builds will not drop
`SITE_PASSWORD` or `GITHUB_TOKEN` because they are absent from `wrangler.jsonc`.
They are absent by design and that is fine.

**The collision runs the other way.** If Terraform owned
`cloudflare_workers_script`, its `bindings` list would be authoritative for the
*whole* binding set - and in v5.24.0 that list includes `secret_text` as one of
its binding types. Terraform would then plan to remove every secret it does not
know about, on every apply, forever. The direction of the hazard is
Terraform → Worker, not Worker → Terraform.

So the conclusion is unchanged and the guardrail is unchanged. But if you are
ever debugging a missing secret, wrangler is not the suspect.

### The collisions that are real

Two of these are live in `wrangler.jsonc` today:

| Field | Declared in | Also settable by | What happens |
|---|---|---|---|
| `r2_buckets` → `IMAGES` | `wrangler.jsonc` | `workers_script.bindings` | Duplicate ownership of the binding whose absence took the whole build red once already ([F29](../TASKS.md#f29)) |
| `assets.binding` → `ASSETS` | `wrangler.jsonc` | `workers_script.bindings` | Same shape. Losing it breaks the pre-launch gate |
| `observability.enabled` | `wrangler.jsonc` | `cloudflare_worker.observability` | Both would set it. It converges to the same value, so nothing flaps - which is worse, because the duplicate ownership is invisible until the values disagree |

That last row is the argument against the tempting middle position. v5 splits
the Worker into `cloudflare_worker` (the container and its settings),
`cloudflare_worker_version` (code and bindings) and
`cloudflare_workers_deployment`. Cloudflare's own infrastructure-as-code guidance
encourages picking and choosing:

> Notice how you do not have to manage all of these resources in Terraform.

But `cloudflare_worker` - the one that looks harmless, the one with no code in
it - carries `observability`, which `wrangler.jsonc` already sets. There is no
slice of the Worker that Terraform can hold without overlapping something
wrangler already declares. So hold none of it.

There is also independent evidence that this is a bad road: provider issue
[#6793][6793], "Cannot migrate/import `cloudflare_workers_script` due to drift",
is still open.

[6793]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/6793

### Custom domains: the one genuine boundary case

`cloudflare_workers_custom_domain` attaches a hostname to a Worker. That sounds
like Worker territory, but Cloudflare documents this exact split:

> If you change your routes in the dashboard, Wrangler will override them in the
> next deploy with the routes you have set in your Wrangler configuration file.
> To manage routes via the Cloudflare dashboard only, remove any `route` and
> `routes` keys from your Wrangler configuration file.

`wrangler.jsonc` has no `routes` key. The custom domains are therefore already
outside wrangler's authority, deliberately, and Terraform could take them
without conflict. This is a supported pattern, not a workaround.

**It is also a trap with a one-line fuse.** The day somebody adds `routes` to
`wrangler.jsonc` - plausibly at cutover, when the temporary gate lines come out
and the file gets tidied - wrangler starts overriding on every deploy and
Terraform starts reverting on every apply. The site flaps between them.

If you adopt custom domains, `wrangler.jsonc` needs a comment saying why there is
no `routes` key, in the same voice as the `TEMPORARY` markers already there.
Without that comment, do not adopt them: the risk is not worth two lines of HCL.

### What Terraform cannot reach

**Workers Builds' Git integration is dashboard-only.** There is no resource for
it in v5.24.0 - the 259 resources include nothing for Builds - and provider issue
[#6924][6924] ("Creating a Worker via Terraform does not connect Git repository")
has been open since 2026-03-16, last touched 2026-08-19. Build watch paths (U9)
are part of the same configuration and are equally out of reach.

This is the single most consequential piece of the deploy pipeline, it took a
docs-only build to discover it was unset, and Terraform cannot help. Worth
knowing before anyone concludes that adopting Terraform means the setup is
captured.

[6924]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/6924

## Why not the zone

`cloudflare_zone` imports cleanly and would work. Three reasons not to:

1. **`terraform destroy` deletes the zone**, and with it the DNS that makes the
   domain resolve at all. Every other resource here fails small. This one fails
   total, from one mistyped command, in a repo where the next maintainer may
   never have run Terraform before. `prevent_destroy` mitigates it; not having
   the resource mitigates it better.
2. **The token scope is enormous.** The generated docs list 37 accepted
   permissions for this resource, including `Zone Write`, `Workers Scripts
   Write`, `Trust and Safety Write` and `Zaraz Admin` - effectively account
   administration, sitting in a credential that has to survive board turnover.
3. **You do not need it.** DNS records take the zone ID as an input. Put it in a
   variable and manage all 13 records with `DNS Read` + `DNS Write` and nothing
   else. The zone object itself is created once and never changes.

The same logic retires Web Analytics: it was enabled automatically when the zone
was added (U4), it has no configuration anyone chose, and if it ever vanished the
fix is one toggle. Managing it buys a diff nobody will read.

## One policy, two ways

A quirk worth knowing before writing the Access config. The application resource
has a `policies` list whose items can "reference existing policies or create new
policies exclusive to the application" - and `cloudflare_zero_trust_access_policy`
also exists as a standalone account-level resource.

So Terraform offers two ways to express one board allowlist, and using both is a
double-management problem *inside* Terraform, with no Cloudflare involved.

**Define it inline in the application.** The policy is specific to `/admin`, it
is not reused, and inline keeps the allowlist and the thing it protects in one
readable block. Skipping the standalone resource also sidesteps [#7355][7355].

[7355]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/7355

## The options

### Option 1 - Snapshot, do not adopt *(recommended now)*

Run `cf-terraforming generate` against the account, commit the output under
`terraform/`, and add a README saying it is a record and not live
infrastructure. Never run `apply`.

- **Cost:** one afternoon, one temporary read-only API token that is deleted
  afterwards, and a `terraform/` directory that will drift silently.
- **Buys:** a complete, reviewable record of the Access application, its
  allowlist, the redirect rules and every DNS record. That is the actual handoff
  risk. [`docs/ADMIN.md`](ADMIN.md) already documents the *clicks*; this
  documents the *result*, which is what you need when Cloudflare loses the
  application again.
- **Adds no failure modes.** No state, no stored credential, nothing that can
  revert a dashboard change.

The drift is the honest weakness: a committed snapshot nobody regenerates becomes
confidently wrong, which is worse than absent. Mitigate it the way
[Appendix A][appendix] is mitigated - date the file, and say in it that it is a
snapshot. F27's lesson applies directly: decisions can expire without anything
failing.

### Option 2 - Adopt the four that matter

Move to real state for exactly these:

```
cloudflare_zero_trust_access_application   # the /admin app, policy inline
cloudflare_zero_trust_access_identity_provider  # one-time PIN
cloudflare_dns_record                      # all of them except the Worker's own
cloudflare_ruleset                         # the .com/.net dynamic redirects
```

Roughly 17 resources. Add `cloudflare_r2_bucket` with `prevent_destroy` if you
want the bucket's existence guaranteed rather than remembered.

**Do not do this on a schedule. Do it when one of these fires:**

- A second person needs to change Cloudflare configuration, and D2 (credential
  sharing) has been resolved. Two people clicking the same dashboard with one
  shared login is the problem Terraform actually solves here.
- Cloudflare loses the Access application a second time. Once is bad luck; twice
  means recreating it from a file is worth the machinery.
- A22 arrives - flipping the redirects 302 → 301 at cutover. That is a one-line
  diff in a reviewed PR versus a dashboard edit nobody can verify afterwards,
  and it is the single change where Terraform is unambiguously better.

**The DNS exclusion is load-bearing.** A Worker custom domain creates and manages
its own DNS record. Importing that record into Terraform means two systems own
it, and removing or recreating the custom domain will fight the state. Import the
mail and verification records - MX, SPF, DMARC, `google-site-verification` - and
leave whatever the Worker created alone. Those mail records are also the
load-bearing ones for B2/B3, which is most of the value.

### Option 3 - Adopt everything

Not recommended, and the reasons are all above: the zone's destroy blast radius,
the Worker's binding collisions, Builds being unreachable anyway, and Web
Analytics having nothing to manage. "Everything in Terraform" would still leave
the Git integration and the build watch paths in the dashboard, so it does not
even deliver the completeness that would justify it.

## State and secrets

Only relevant under Option 2. Option 1 has no state.

**Today, none of the recommended resources put a real secret in state.** The
Access application, its policy, DNS records, rulesets and the R2 bucket are all
configuration. `cloudflare_web_analytics_site.site_token` is a public beacon
token and is not in the recommended set anyway.

**B6 changes that.** When Google SSO replaces one-time PIN, the identity provider
resource gains `config.client_secret`, which the schema marks `Sensitive`.
Sensitive means redacted in plan output - it is still **plaintext in the state
file**. At that point the state file becomes a credential store, and the hard
constraint from the brief ("no state file containing secrets anywhere in the
repo") stops being a formality.

Either keep the identity provider out of Terraform at B6 and let it stay a
documented dashboard step, or make sure remote state is in place first. The
former is simpler and there is exactly one of them.

### Where state would live

| Option | Cost | Verdict |
|---|---|---|
| **HCP Terraform free tier** | Free: 500 managed resources, unlimited users, locking and run history included. One more account to hand over | ✅ **Recommended if adopting.** 17 resources against a 500 ceiling, and the free tier was reaffirmed 2025-12-17 with legacy plans migrating by 2026-03-31 |
| **R2, via the `s3` backend** | Free, and Cloudflare documents the config. Needs an R2 S3 credential pair | ⚠️ Works, but see below |
| **Local state on one laptop** | Free | ❌ The state describing the account lives on one volunteer's machine and leaves with them. This is the failure this project is built to avoid |
| **State committed to the repo** | - | ❌ Public repo. Also no locking, and merge conflicts in JSON |

R2 works - `use_lockfile = true` needs conditional writes, and R2's S3 API
supports `If-None-Match` on `PutObject`, so state locking is real rather than
absent. Two things argue against it:

1. **Circular dependency.** The state that describes how to rebuild the
   Cloudflare account would live inside that account. If the account is what
   breaks, so is the recovery plan.
2. **It is a second credential**, with D2 unresolved. Cloudflare's own example
   puts the access key inline in the backend block, which is impossible here -
   they would have to be `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
   environment variables, which is one more undocumented thing that has to
   survive a handoff.

If R2 is chosen anyway: use a **separate bucket**, not `blackshear-pta-images`,
and pin the Terraform version. The `skip_s3_checksum` flag that makes non-AWS S3
backends work was broken for several releases in 2025 ([#37203][37203],
[#37432][37432], both fixed 2025-09-23), which is the kind of breakage that
strands a volunteer with no way forward.

[37203]: https://github.com/hashicorp/terraform/issues/37203
[37432]: https://github.com/hashicorp/terraform/issues/37432

### The API token

Under Option 2 the token is a permanent credential with write access to DNS and
to the thing guarding `/admin`. It should be scoped to the minimum the chosen
resources need, which the generated docs state per resource:

| Resource | Permissions |
|---|---|
| `cloudflare_dns_record` | `DNS Read`, `DNS Write` |
| `cloudflare_zero_trust_access_identity_provider` | `Access: Organizations, Identity Providers, and Groups` Read + Write |
| `cloudflare_r2_bucket` | `Workers R2 Storage Write` |
| `cloudflare_workers_custom_domain` | `Workers Scripts` Read + Write |
| `cloudflare_zero_trust_access_application` | Not listed in the docs - confirm at token creation |
| `cloudflare_ruleset` | Not listed in the docs - confirm at token creation |

Like the GitHub token in [D12](../TASKS.md#open-decisions), it should be owned by
the **PTA** account rather than a board member's, for the same reason. Unlike
that token, it is worth an expiry: a Cloudflare token with DNS write is a
materially bigger exposure than Contents-write on an already-public repo, and
Terraform failing loudly is not the silent staleness D12 is guarding against.

## Sharp edges in the current provider

v5 is generated from Cloudflare's OpenAPI spec and moves fast - 170 published
versions. These are open as of 2026-09-03 and touch the recommended set:

| Issue | Resource | Why it matters here |
|---|---|---|
| [#7355][7355] | `zero_trust_access_policy` | `app_count` returned to the schema in 5.23.0 after being removed in 5.7.0, which is the attribute behind a `Provider produced inconsistent result after apply` failure. **Filed 2026-09-02, unconfirmed against 5.24.0.** Avoided by defining the policy inline |
| [#6238][6238] | `dns_record` | Long TXT records get broken up and then drift on every plan. All three TXT records here are short, so probably clear - but TXT is what this zone has |
| [#6519][6519] | `dns_record` | `allow_overwrite` was removed in v5, so a `create` against an existing record errors instead of adopting it. Import, never create |
| [#7128][7128] | `ruleset` | Imported rulesets drift on every plan for `skip` actions and rate limits. Neither applies to dynamic redirects, but ruleset import has known rough edges |
| [#5743][5743] | `r2_bucket` | Force-deletion is *not* supported, which here is good news: the API will refuse to delete a bucket with photos in it. `prevent_destroy` is still worth having |

[6238]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/6238
[6519]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/6519
[7128]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/7128
[5743]: https://github.com/cloudflare/terraform-provider-cloudflare/issues/5743

Pin the provider version in either option. `~> 5.24` is not a pin; `= 5.24.0` is.

## Doing it

Option 1, end to end. Nothing here writes to Cloudflare.

```sh
brew install cloudflare/cloudflare/cf-terraforming
```

Create a **read-only** API token in the dashboard - `Zone Read`, `DNS Read`,
`Access: Apps and Policies Read`, `Account Settings Read`, `Workers R2 Storage
Read` - then:

```sh
export CLOUDFLARE_API_TOKEN="<paste the read-only token>"
export CLOUDFLARE_ACCOUNT_ID="<from the dashboard sidebar>"
export CLOUDFLARE_ZONE_ID="<from the zone overview>"
```

`cf-terraforming` needs an initialised Terraform directory with the provider
installed before it can generate anything:

```sh
mkdir -p terraform && cd terraform
```

Write a `versions.tf` pinning `cloudflare/cloudflare = 5.24.0`, then
`terraform init`, then generate per resource:

```sh
cf-terraforming generate --resource-type cloudflare_dns_record
cf-terraforming generate --resource-type cloudflare_ruleset
cf-terraforming generate --resource-type cloudflare_zero_trust_access_application
cf-terraforming generate --resource-type cloudflare_zero_trust_access_identity_provider
cf-terraforming generate --resource-type cloudflare_r2_bucket
cf-terraforming generate --resource-type cloudflare_workers_custom_domain
```

Read the output before committing it. The tool's own README warns that generated
resources "might need manual modifications" and that it is "not intended for use
in CI", and it has no idea which of these you decided not to manage.

**Delete the token when you are done.** Under Option 1 it has no ongoing job, and
a read-only token nobody needs is still a credential nobody is tracking.

`cf-terraforming import` emits the `import` blocks for Option 2, when and if.

## What this does not solve

Worth being blunt, because "it's in Terraform" invites the assumption that the
setup is captured. It is not:

- **Workers Builds and its watch paths stay in the dashboard.** No resource
  exists. This is most of the deploy pipeline.
- **The four Worker secrets stay in wrangler.** By design - see
  [The boundary](#the-boundary).
- **Nothing here backs up content.** Not the R2 photos, not the repo. Terraform
  describes the shape of the account, not what is in it.
- **It adds a second place configuration lives.** Under Option 2, a dashboard
  edit that Terraform does not know about gets reverted on the next apply, and
  the person who made the edit will not connect the two. That failure mode does
  not exist today. Option 1 exists precisely to avoid buying it.

## Read next

- [`ADMIN.md`](ADMIN.md) - the Access application and the four secrets, click by
  click. Still the operational source of truth for `/admin`
- [`DEPLOYS.md`](DEPLOYS.md) - Workers Builds, watch paths, and the domains
- [`../TASKS.md`](../TASKS.md) - [F29](../TASKS.md#f29) for the binding failure
  this boundary is drawn around, D2 for the credential question Option 2 waits
  on, and B6 for the one that changes the state calculus
