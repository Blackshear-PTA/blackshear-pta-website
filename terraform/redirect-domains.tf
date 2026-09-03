# blackshearpta.com and blackshearpta.net - the redirect domains.
#
# Generated 2026-09-03 by cf-terraforming 0.29.0, provider 5.24.0.
# A RECORD, NOT LIVE INFRASTRUCTURE. See README.md before running anything.
# Resource labels are cf-terraforming's; comments carry the meaning.
#
# These are SEPARATE CLOUDFLARE ZONES, which is easy to miss - the PTA owns
# three domains and each is its own zone with its own ID. A read-only token
# scoped to blackshearpta.org alone cannot see any of this, and fails in a way
# that looks like success. See F34 in ../TASKS.md.
#
# How the redirect works: a proxied placeholder AAAA record at 100:: catches
# the request at Cloudflare's edge, and the dynamic-redirect ruleset rewrites
# it to blackshearpta.org. There is no origin server behind either domain. A
# 522 on one of these means Cloudflare found no matching rule and tried to
# reach the placeholder address for real.
#
# ---------------------------------------------------------------------------
# STATUS CODE 302, DELIBERATELY, AND STILL CORRECT AS OF 2026-09-03.
#
# They flip to 301 at cutover and not before - that is A22. A 301 is cached by
# browsers and intermediaries and is effectively unrecallable, so it is not a
# change to make while the site is still pre-launch.
#
# This is the single change where Terraform would be clearly better than a
# dashboard edit: a one-line reviewed diff instead of a setting nobody can
# verify afterwards. It is one of the three triggers in ../docs/TERRAFORM.md.
# ---------------------------------------------------------------------------

# --- blackshearpta.com : placeholder records ---
resource "cloudflare_dns_record" "terraform_managed_resource_4d0b39819575a7412d68be049b41e754_0" {
  content  = "100::"
  name     = "blackshearpta.com"
  proxied  = true
  tags     = []
  ttl      = 1
  type     = "AAAA"
  zone_id  = "61d95a119dde8a90d1b7e5f78cd8a68d"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_8cfb0c466122013d661a231b7d0bd76b_1" {
  content  = "100::"
  name     = "www.blackshearpta.com"
  proxied  = true
  tags     = []
  ttl      = 1
  type     = "AAAA"
  zone_id  = "61d95a119dde8a90d1b7e5f78cd8a68d"
  settings = {}
}

# --- blackshearpta.com : the redirect rule ---
resource "cloudflare_ruleset" "terraform_managed_resource_aa852bef95c14a9da0547fb20f79bfba_0" {
  kind    = "zone"
  name    = "default"
  phase   = "http_request_dynamic_redirect"
  zone_id = "61d95a119dde8a90d1b7e5f78cd8a68d"
  rules = [{
    action = "redirect"
    action_parameters = {
      from_value = {
        preserve_query_string = false
        status_code           = 302
        target_url = {
          expression = "concat(\"https://blackshearpta.org\", http.request.uri)"
        }
      }
    }
    description  = "Redirect to blackshearpta.org"
    enabled      = true
    expression   = "true"
    id           = null
    last_updated = "2026-08-31T16:45:17.000643Z"
    ref          = "ad31b652f71c4deba3bef5a1d941273f"
    version      = "1"
  }]
}

# --- blackshearpta.net : placeholder records ---
resource "cloudflare_dns_record" "terraform_managed_resource_c74ec72e2b4ca993d388e71474458107_0" {
  content  = "100::"
  name     = "blackshearpta.net"
  proxied  = true
  tags     = []
  ttl      = 1
  type     = "AAAA"
  zone_id  = "6c37129976ec42de3b35ef9510b17b9a"
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_3c07c2dc342556533885caac99b08afd_1" {
  content  = "100::"
  name     = "www.blackshearpta.net"
  proxied  = true
  tags     = []
  ttl      = 1
  type     = "AAAA"
  zone_id  = "6c37129976ec42de3b35ef9510b17b9a"
  settings = {}
}

# --- blackshearpta.net : the redirect rule ---
resource "cloudflare_ruleset" "terraform_managed_resource_72d1286e62424e4a9ed46783be75af8d_0" {
  kind    = "zone"
  name    = "default"
  phase   = "http_request_dynamic_redirect"
  zone_id = "6c37129976ec42de3b35ef9510b17b9a"
  rules = [{
    action = "redirect"
    action_parameters = {
      from_value = {
        preserve_query_string = false
        status_code           = 302
        target_url = {
          expression = "concat(\"https://blackshearpta.org\", http.request.uri)"
        }
      }
    }
    description  = "Redirect to blackshearpta.org"
    enabled      = true
    expression   = "true"
    id           = null
    last_updated = "2026-08-31T16:32:55.101918Z"
    ref          = "9b0abdfa1ee64dac902b538cd5dbf1dd"
    version      = "1"
  }]
}

