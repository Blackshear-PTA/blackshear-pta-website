# A record of the Cloudflare account, not live infrastructure

> **Nothing in this directory is applied, and it must not be.**
> There is no state file, no backend, and no `versions.tf`. Read
> [the hazard](#the-hazard-running-apply-here) before you change that.

These files describe what is configured in the Cloudflare account, generated
from the live account by `cf-terraforming`. They exist so that whoever inherits
this site can read what the dashboard contains without having the dashboard
open, and can rebuild it if Cloudflare loses something.

This is **Option 1** in [`../docs/TERRAFORM.md`](../docs/TERRAFORM.md), which
explains why a snapshot rather than real Terraform management, what the
alternative would cost, and the three triggers that would change the answer.
Read that first if you are wondering whether to promote this to real state.

## The hazard: running `apply` here

There is no state file. To Terraform, that means **none of these resources
exist**, so `terraform apply` would not adopt them - it would try to *create* a
second copy of every one. In practice: duplicate DNS records, a second Access
application in front of `/admin`, and a redirect ruleset fighting the real one.

Three things stand in the way, deliberately:

1. **No `versions.tf`.** Without a `required_providers` block, Terraform
   resolves the bare name `cloudflare` to `hashicorp/cloudflare`, which does not
   exist, so `terraform init` fails. `versions.tf.example` is the file to copy,
   and `.gitignore` keeps the copy out of the repo.
2. **No state and no backend**, so there is nothing to plan against.
3. **This paragraph**, which is the only one of the three that explains itself.

If you do promote this to real management, the route is `import` blocks - never
`apply` against an empty state. `cf-terraforming import` generates them.

## What is in here, and what deliberately is not

Managed-in-snapshot and left out are different decisions, both reasoned in
[`../docs/TERRAFORM.md`](../docs/TERRAFORM.md):

| Left out | Why |
|---|---|
| `cloudflare_zone` | `terraform destroy` on it deletes the DNS that makes the domain resolve. DNS records only need the zone *ID*, so nothing is lost by omitting it |
| `cloudflare_web_analytics_site` | Enabled automatically with the zone. No configuration anyone chose, and one toggle to restore |
| The Worker, its bindings and its secrets | `wrangler.jsonc` owns these. Two systems managing one Worker is [F29](../TASKS.md#f29) waiting to happen - see **The boundary** in the doc |
| Workers Builds and its watch paths | Not in the provider at all. Provider issue #6924. This is the biggest gap and no snapshot closes it |

**So this is not a complete picture of the account.** The deploy pipeline is
absent because Terraform cannot see it. Do not read a green diff here as "the
account matches."

## Regenerating it

Requires `cf-terraforming` and a **read-only** Cloudflare API token. The
walkthrough is in [`../docs/TERRAFORM.md`](../docs/TERRAFORM.md#doing-it);
briefly:

```sh
brew install cloudflare/cloudflare/cf-terraforming
cp versions.tf.example versions.tf
terraform init
```

With `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_ZONE_ID`
exported:

```sh
cf-terraforming generate --resource-type cloudflare_dns_record
cf-terraforming generate --resource-type cloudflare_ruleset
cf-terraforming generate --resource-type cloudflare_zero_trust_access_application
cf-terraforming generate --resource-type cloudflare_zero_trust_access_identity_provider
cf-terraforming generate --resource-type cloudflare_r2_bucket
cf-terraforming generate --resource-type cloudflare_workers_custom_domain
```

Read the output before committing it. cf-terraforming's own README says
generated resources "might need manual modifications", and it has no idea which
resources this project decided not to manage - it will happily emit the zone.

**Delete the token afterwards.** A read-only token nobody needs is still a
credential nobody is tracking.

## This file goes stale silently

A snapshot nobody regenerates becomes confidently wrong, which is worse than
having none. That is the honest weakness of Option 1 and there is no clever fix
for it - only the habit of dating it.

Each generated file carries the date it was produced. **F27 in
[`../TASKS.md`](../TASKS.md) is the precedent worth remembering: a decision
stopped being correct and nothing failed.** If the date below is old, treat
everything here as a historical record of what the account looked like then,
not a description of what it is now.

| | |
|---|---|
| Generated from account | `blackshearpta@gmail.com` |
| Zone | `blackshearpta.org` |
| Provider version | `cloudflare/cloudflare` 5.24.0 |
| Last generated | *see the header of each `.tf` file* |
