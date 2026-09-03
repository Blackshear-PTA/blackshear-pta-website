# Worker custom domains - what puts blackshear-pta on the real hostnames.
#
# Generated 2026-09-03 by cf-terraforming 0.29.0, provider 5.24.0.
# A RECORD, NOT LIVE INFRASTRUCTURE. See README.md before running anything.
# Resource labels are cf-terraforming's; comments carry the meaning.

# SAFE TO RECORD HERE ONLY BECAUSE wrangler.jsonc HAS NO `routes` KEY.
#
# Cloudflare's guidance: "To manage routes via the Cloudflare dashboard only,
# remove any route and routes keys from your Wrangler configuration file."
# That is the split in force today. The day somebody adds `routes` to
# wrangler.jsonc - plausibly at cutover, tidying the TEMPORARY lines - wrangler
# starts overriding these on every deploy and the two fight.
#
# cf-terraforming also emits `environment = "production"` here, which the v5
# schema marks deprecated. Stripped.

resource "cloudflare_workers_custom_domain" "terraform_managed_resource_1a432964e9dbd56587217593f63b34e4c126b6af_0" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  hostname   = "blackshearpta.org"
  service    = "blackshear-pta"
  zone_id    = "da49f29eb0a8de139c3129a80995045f"
  zone_name  = "blackshearpta.org"
}

resource "cloudflare_workers_custom_domain" "terraform_managed_resource_69ab1098cf9ff121fc2521853e9fe2a8891b32c8_1" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  hostname   = "www.blackshearpta.org"
  service    = "blackshear-pta"
  zone_id    = "da49f29eb0a8de139c3129a80995045f"
  zone_name  = "blackshearpta.org"
}

