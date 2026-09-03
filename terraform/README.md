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

### 1. The token

A **read-only** Cloudflare API token. Dashboard -> profile icon -> **My
Profile** -> **API Tokens** -> **Create Token**.

Use the **"Read all resources"** template rather than building a custom token.
Two permissions this needs are not documented per-resource in the provider
(`cloudflare_ruleset` and the Access application), so hand-picking scopes means
discovering the gaps one 403 at a time. The template cannot write anything, so
the usual argument for least privilege is much weaker here.

Then, and this is the part that is easy to get wrong:

| Field | Value |
|---|---|
| Account Resources | Include -> the Blackshear PTA account |
| **Zone Resources** | Include -> **All zones from an account** |
| TTL | An end date. This is a throwaway |

> **All three zones, not just `blackshearpta.org`.** The PTA owns
> `blackshearpta.org`, `blackshearpta.com` and `blackshearpta.net`, and each is
> a **separate Cloudflare zone**. The `.com` and `.net` redirect rules live on
> their own zones, so a token scoped to `.org` alone produces a snapshot that
> looks successful and is quietly incomplete: DNS returns `403` for the other
> two, and - the nastier one - `cloudflare_ruleset` still emits a ruleset block
> for them with **no `rules` inside it**, because listing a ruleset and reading
> its contents are separately authorised. An empty ruleset is not an error and
> nothing warns you. Recorded as [F34](../TASKS.md#f34).

### 2. Storing it

**Not in this repository, and not in `.dev.vars`.** `.dev.vars` is wrangler's
local-secrets file and its contents are injected into the dev Worker's
environment; a Cloudflare API token has no business there. The repo is public
and a credential in this tree has been committed once already ([F28](../TASKS.md#f28)).

Use the macOS Keychain. Nothing lands on disk in plaintext, nothing lands in
shell history, and it survives new terminal sessions:

```sh
security add-generic-password -a "$USER" -s blackshear-pta-cf-token -U -A -w
```

The trailing `-w` with no value makes it prompt with hidden input. It asks
twice and both must match - a mismatch is the most likely reason this fails the
first time.

**What `-A` trades:** any process on the machine can then read that item
without a confirmation prompt. It is there so a non-interactive shell or a
script can use the token without hanging on a Keychain dialog. For a read-only
token on a short TTL that gets deleted afterwards, that is a reasonable trade.
Drop `-A` if you would rather approve each read by hand.

Read it back into the environment:

```sh
export CLOUDFLARE_API_TOKEN=$(security find-generic-password -s blackshear-pta-cf-token -w)
export CLOUDFLARE_ACCOUNT_ID=eb3bbf021359a4399c0ddef6bc09e3c4
```

Neither the account ID nor the zone IDs are secret; they appear in dashboard
URLs. Only the token is.

Confirm it works before generating anything:

```sh
curl -s https://api.cloudflare.com/client/v4/user/tokens/verify \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | python3 -m json.tool
```

> **`export TOKEN=...` typed directly at the prompt lands in
> `~/.zsh_history` in plaintext.** zsh does not ignore it by default. If that
> has happened: `sed -i '' '/CLOUDFLARE_API_TOKEN/d' ~/.zsh_history && exec zsh`.

### 3. Generating

```sh
brew install cloudflare/cloudflare/cf-terraforming
cp versions.tf.example versions.tf
terraform init
```

Account-scoped resources take `--account`; zone-scoped ones take `--zone` and
must be run **once per zone**:

```sh
# account-scoped
for r in r2_bucket zero_trust_access_application \
         zero_trust_access_identity_provider workers_custom_domain; do
  cf-terraforming generate --resource-type "cloudflare_$r" \
    --account "$CLOUDFLARE_ACCOUNT_ID"
done

# zone-scoped, per zone
cf-terraforming generate --resource-type cloudflare_dns_record --zone <zone_id>
cf-terraforming generate --resource-type cloudflare_ruleset    --zone <zone_id>
```

Zone IDs come from each zone's Overview page, or:

```sh
curl -s https://api.cloudflare.com/client/v4/zones \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | python3 -c 'import json,sys; [print(z["name"], z["id"]) for z in json.load(sys.stdin)["result"]]'
```

### 4. Reading the output before committing it

**Run `terraform validate` first.** On the 2026-09-03 generation it caught four
separate defects in the Access output that were invisible by reading it. One
command, touches nothing, and it is the difference between a snapshot and a
snapshot-shaped file. Then `terraform fmt`.

cf-terraforming's own README says generated resources "might need manual
modifications", and it has no idea which resources this project decided not to
manage. What needed fixing last time:

- **Strip board members' email addresses.** The Access policy's allowlist is
  personal data and this repository is public. The committed copy carries a
  placeholder and a pointer to the dashboard - [F35](../TASKS.md#f35).
- **Four validation defects in the Access output**, all documented inline in
  `access.tf` where they were fixed - missing `name`, a forbidden `scim_config`,
  `id` and `include` together, `self_hosted_domains` and `destinations`
  together. [F36](../TASKS.md#f36) has the table.
- **Strip deprecated attributes.** `cloudflare_workers_custom_domain` is emitted
  with `environment = "production"`, which the v5 schema marks deprecated.
- **Delete anything we chose not to manage**, per the table above. It will
  happily emit the zone.

### 5. Afterwards

**Delete the token in the dashboard, and remove the Keychain item.** A
read-only token nobody needs is still a credential nobody is tracking.

```sh
security delete-generic-password -s blackshear-pta-cf-token
```

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
