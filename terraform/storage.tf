# Cloudflare R2 - photos attached to announcements through /admin.
#
# Generated 2026-09-03 by cf-terraforming 0.29.0, provider 5.24.0.
# A RECORD, NOT LIVE INFRASTRUCTURE. See README.md before running anything.
# Resource labels are cf-terraforming's; comments carry the meaning.

# Served through the Worker at /images/<hash>.<ext>, so there is no public
# bucket and no second hostname. Free tier is 10GB.
#
# The BINDING that reaches this bucket lives in wrangler.jsonc, not here, and
# must stay there: wrangler deploy replaces a Worker's bindings with whatever
# the config declares, so a Terraform-managed binding would be wiped. The bucket
# must also exist BEFORE the code declaring the binding ships - a missing bucket
# fails the whole build, not just photo uploads. That is F29.

resource "cloudflare_r2_bucket" "terraform_managed_resource_eb3bbf021359a4399c0ddef6bc09e3c4_0" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  name       = "blackshear-pta-images"
}

