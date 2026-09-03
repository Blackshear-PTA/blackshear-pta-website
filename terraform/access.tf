# Cloudflare Access - the lock on /admin.
#
# Generated 2026-09-03 by cf-terraforming 0.29.0, provider 5.24.0.
# A RECORD, NOT LIVE INFRASTRUCTURE. See README.md before running anything.
#
# Resource labels are cf-terraforming's, deliberately. They are ugly, and
# renaming them by hand would mean the next regeneration produced a diff nobody
# could read. Comments carry the meaning instead.
#
# ---------------------------------------------------------------------------
# THE BOARD ALLOWLIST IS NOT IN THIS FILE, AND MUST NOT BE.
#
# The live policy lists three board members by email address. This repository
# is public, so those addresses are redacted below and replaced with a
# placeholder. The real list is in the dashboard:
#
#   Zero Trust -> Access controls -> Applications -> Blackshear PTA Admin
#     -> Policies -> Blackshear PTA Website - Board Access (Legacy)
#
# If you are rebuilding this application from this file, the structure is the
# part that is hard to remember. Re-adding three addresses the board already
# knows is not. Recorded as F35 in ../TASKS.md.
# ---------------------------------------------------------------------------

resource "cloudflare_zero_trust_access_application" "terraform_managed_resource_bf5e78a9-7622-4319-ba0f-e16271354cbb_0" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"

  # Only the one-time PIN provider, by UUID. That is the second identity
  # provider defined below - NOT the "cloudflare" one.
  allowed_idps = ["f0d382ff-5cfa-4595-a99e-2488e15a422b"]

  # Scoped to the /admin path, not the whole zone. Leaving the path off would
  # put every parent behind a login screen and strand the pre-launch gate
  # behind it. See the warning in ../docs/ADMIN.md.
  domain = "blackshearpta.org/admin"

  # cf-terraforming also emitted `self_hosted_domains = ["blackshearpta.org/admin"]`
  # here. Removed: it is the legacy form of `destinations` below and the schema
  # rejects both together. Fourth defect in the generated Access output.

  # "Apply instant authentication". With exactly one login method this skips
  # the provider chooser, so a board member goes straight to "enter your email,
  # get a code". Verified live 2026-09-03: the login page shows an email field
  # and nothing else.
  auto_redirect_to_identity = true

  app_launcher_visible       = true
  enable_binding_cookie      = false
  http_only_cookie_attribute = false
  name                       = "Blackshear PTA Admin"
  options_preflight_bypass   = false
  session_duration           = "24h"
  tags                       = []
  type                       = "self_hosted"

  destinations = [{
    type = "public"
    uri  = "blackshearpta.org/admin"
  }]

  # A REFERENCE to the standalone policy below, not an inline definition.
  #
  # cf-terraforming emitted both at once - `id` alongside a full `include`
  # block - and the schema rejects that: "2 attributes specified when one (and
  # only one) of [policies[0].id, policies[0].include] is required". An Access
  # application either points at an existing policy or defines its own.
  #
  # The live policy is `reusable`, so a reference is the faithful shape. Third
  # of the three defects in cf-terraforming's Access output. See F36.
  policies = [{
    id = "fbd810c6-89b0-4fe5-9802-b1755451e642"
  }]
}

# The board allowlist, as a standalone reusable policy.
#
# ../docs/TERRAFORM.md recommends defining an app-specific policy INLINE in the
# application, to avoid exactly the two-ways-to-say-it problem above. That
# recommendation stands for anything built new - but it is not what the live
# account does, and this file records what is, not what was recommended.
resource "cloudflare_zero_trust_access_policy" "board_access_legacy" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  name       = "Blackshear PTA Website - Board Access (Legacy)"
  decision   = "allow"

  # REDACTED. Three board email addresses live here - see this file's header.
  #
  # An explicit list rather than "emails ending in @blackshearpta.org" is
  # deliberate: it bounds the Zero Trust seat count to people who were named,
  # so the 50-seat free tier cannot be drifted into. ../docs/ADMIN.md §1.5.
  include = [{
    email = {
      email = "REDACTED - see the dashboard, and the header of this file"
    }
  }]

  exclude = []
  require = []
}

# The one-time PIN provider. Board members get a code by email; nobody needs a
# Cloudflare account. Not on by default - its absence is F30, and it surfaced
# as three unrelated-looking bugs.
#
# When Google SSO arrives (B6), note that config.client_secret is marked
# Sensitive by the provider, which means redacted in plan output and PLAINTEXT
# in state. That is the point at which a snapshot stops being safe to hold this
# resource. See "State and secrets" in ../docs/TERRAFORM.md.
resource "cloudflare_zero_trust_access_identity_provider" "terraform_managed_resource_f0d382ff-5cfa-4595-a99e-2488e15a422b_1" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  type       = "onetimepin"

  # `name` added by hand. cf-terraforming emitted neither identity provider
  # with one, and `terraform validate` rejects that because the v5 schema marks
  # name Required. The API is the reason: it returns an empty string for both.
  #
  # So the live state cannot be expressed in the schema, and these two
  # resources do not round-trip. Harmless in a snapshot; it would be a
  # permanent diff or an apply error under Option 2. See F36 in ../TASKS.md.
  name   = ""
  config = {}

  # cf-terraforming also emitted a scim_config block here. Removed: the schema
  # forbids it on this type outright - "scim_config can not be set if type is
  # one of: onetimepin" - so the file did not validate with it. Second of the
  # two defects in the generated output, both caught by `terraform validate`.
  # See F36 in ../TASKS.md.
}

# The built-in Cloudflare-account provider. This is the fallback F30 describes:
# with no identity provider configured, Access makes people sign in with a
# Cloudflare account, which no board member has.
#
# It is harmless as things stand - the application's allowed_idps lists only
# the one-time PIN provider above - but it is still here, and selecting it by
# accident would lock the board out of /admin.
resource "cloudflare_zero_trust_access_identity_provider" "terraform_managed_resource_17f19266-193f-47dd-a172-ace863e5e0c4_0" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  type       = "cloudflare"

  # Empty by hand, for the same reason as above. See F36 in ../TASKS.md.
  name = ""
  config = {
    restrict_to_account_members = true
  }
  scim_config = {
    enabled                  = false
    group_member_deprovision = false
    seat_deprovision         = false
    user_deprovision         = false
  }
}
