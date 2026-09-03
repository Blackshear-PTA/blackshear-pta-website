# DNS for blackshearpta.org - the real zone. 12 records.
#
# Generated 2026-09-03 by cf-terraforming 0.29.0, provider 5.24.0.
# A RECORD, NOT LIVE INFRASTRUCTURE. See README.md before running anything.
# Resource labels are cf-terraforming's; comments carry the meaning.
#
# THIS SUPERSEDES Appendix A in ../TASKS.md, which snapshotted the zone on
# 2026-08-28 before the site was live. Two things have changed since, and the
# difference matters:
#
#   - The two GoDaddy parking A records are GONE, replaced by the two proxied
#     AAAA records at 100:: below.
#   - The `www` CNAME is GONE, replaced the same way.
#
# What is unchanged, and is the load-bearing part: the five Google MX records,
# SPF, google-site-verification and _dmarc. Those are what B2/B3 (the Workspace
# for Nonprofits application) depends on. Do not let anything touch them - and
# in particular do not enable Cloudflare Email Routing while that application
# is open, because it overwrites MX. That is C7, blocked for this reason.
#
# ---------------------------------------------------------------------------
# ORDER OF RECORDS BELOW: two GoDaddy leftovers, five MX, three TXT, two AAAA.
# ---------------------------------------------------------------------------

# GODADDY LEFTOVERS. Neither is used by this site.
#
# `_domainconnect` is GoDaddy's automatic-DNS-setup endpoint. `pay` points at
# GoDaddy's commerce paylinks - a live payments subdomain nobody here set up,
# and worth asking the board about before assuming it is dead. Both predate the
# Cloudflare migration and came across in the 2026-08-28 import.
resource "cloudflare_dns_record" "terraform_managed_resource_8ec9fac8f136397fd8491956289a049e_0" {
  content = "_domainconnect.gd.domaincontrol.com"
  name    = "_domainconnect.blackshearpta.org"
  proxied = false
  tags    = []
  ttl     = 1
  type    = "CNAME"
  zone_id = "da49f29eb0a8de139c3129a80995045f"
  settings = {
    flatten_cname = false
  }
}

resource "cloudflare_dns_record" "terraform_managed_resource_1a2c807f8ccae12e5162699faf8be6a8_1" {
  content = "paylinks.commerce.godaddy.com"
  name    = "pay.blackshearpta.org"
  proxied = false
  tags    = []
  ttl     = 1
  type    = "CNAME"
  zone_id = "da49f29eb0a8de139c3129a80995045f"
  settings = {
    flatten_cname = false
  }
}

# GOOGLE MAIL. Five MX records, priorities 1/5/5/10/10.
# Leftovers from a Workspace attempt about a year ago (F8) that also left the
# google-site-verification record - which is why the domain is already verified
# with Google and B2 does not have to redo that step.
resource "cloudflare_dns_record" "terraform_managed_resource_9c3218181f51d9a727ef4fad8389251c_2" {
  content  = "alt4.aspmx.l.google.com"
  name     = "blackshearpta.org"
  priority = 10
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "MX"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_e7faeffa5c3f38b699eb25aa09c77e5d_3" {
  content  = "alt3.aspmx.l.google.com"
  name     = "blackshearpta.org"
  priority = 10
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "MX"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_990cea06531f672e00dc7bf6eb748a29_4" {
  content  = "alt2.aspmx.l.google.com"
  name     = "blackshearpta.org"
  priority = 5
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "MX"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_328d3d054b0cf27928fb9d54725e3519_5" {
  content  = "alt1.aspmx.l.google.com"
  name     = "blackshearpta.org"
  priority = 5
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "MX"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_d46e6f56b38c332ce3d2881ff7cb6776_6" {
  content  = "aspmx.l.google.com"
  name     = "blackshearpta.org"
  priority = 1
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "MX"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

# MAIL AUTHENTICATION. SPF uses GoDaddy's _spfm merge format and DMARC reports
# go to onsecureserver.net - both GoDaddy-managed, both from the same era (F2).
resource "cloudflare_dns_record" "terraform_managed_resource_30f8cb541737d45c421e0a6dc7ed9427_7" {
  content  = "\"v=spf1 include:dc-aa8e722993._spfm.blackshearpta.org ~all\""
  name     = "blackshearpta.org"
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "TXT"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_9852d286f919177735b4515ec496ad07_8" {
  content  = "\"google-site-verification=j2oZCILLgqJoY-w2X-_l1g3z3_pxHQ6-vgXFLWWVzoE\""
  name     = "blackshearpta.org"
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "TXT"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_4675f49573545f64c829b214d4a83d2c_9" {
  content  = "\"v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;\""
  name     = "_dmarc.blackshearpta.org"
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "TXT"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

# ---------------------------------------------------------------------------
# WORKER-MANAGED. DO NOT IMPORT THESE UNDER OPTION 2.
#
# 100:: is Cloudflare's placeholder address for a proxied record. These two
# correspond exactly to the two Worker custom domains in workers.tf (apex and
# www), so the custom domain created them and owns them. Importing them into
# Terraform would put Terraform and the Worker custom domain in a fight over
# the same records - remove or recreate the custom domain and the state breaks.
#
# Recorded here because this file is a record of what exists, not a plan.
# ---------------------------------------------------------------------------
resource "cloudflare_dns_record" "terraform_managed_resource_3fd3d97a91326f97d3df37c7de6b52b5_10" {
  content  = "100::"
  name     = "blackshearpta.org"
  proxied  = true
  tags     = []
  ttl      = 1
  type     = "AAAA"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_4523488c5237f36ffb7e11b83be0aa7e_11" {
  content  = "100::"
  name     = "www.blackshearpta.org"
  proxied  = true
  tags     = []
  ttl      = 1
  type     = "AAAA"
  zone_id  = "da49f29eb0a8de139c3129a80995045f"
  settings = {}
}

