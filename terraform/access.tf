# Cloudflare Access - the lock on /admin.
#
# Generated 2026-09-03 by cf-terraforming 0.29.0, provider 5.24.0, and edited by
# hand on 2026-10-15 when Google Workspace sign-in replaced one-time PIN (B6 in
# ../TASKS.md). A RECORD, NOT LIVE INFRASTRUCTURE. See README.md before running
# anything.
#
# Two IDs below are placeholders, used three times: the new identity
# provider's and the new policy's. The API token this repository uses cannot
# read Access, so they were not copied by hand. The dashboard shows both, and a
# fresh cf-terraforming run fills them in.
#
# Resource labels are cf-terraforming's, deliberately. They are ugly, and
# renaming them by hand would mean the next regeneration produced a diff nobody
# could read. Comments carry the meaning instead. The two resources added by
# hand have readable labels; a regeneration will rename them.
#
# ---------------------------------------------------------------------------
# THE CLIENT SECRET IS NOT IN THIS FILE, AND MUST NOT BE.
#
# The Google provider's client secret is redacted below. It lives in the
# password manager. The client ID is not a secret: Google puts it in every
# sign-in redirect.
#
# The allowlist IS in this file now. Until 2026-10-15 it named people,
# personal Gmail addresses included, so it was redacted (F35 in ../TASKS.md).
# It now names PTA role addresses, which ../docs/ACCOUNTS.md already lists.
# ---------------------------------------------------------------------------

resource "cloudflare_zero_trust_access_application" "terraform_managed_resource_bf5e78a9-7622-4319-ba0f-e16271354cbb_0" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"

  # Only the Google Workspace provider below. One-time PIN was removed from the
  # application on 2026-10-15, along with the old policy (Jon).
  allowed_idps = ["GOOGLE_WORKSPACE_IDP_ID - see this file's header"]

  # Scoped to the /admin path, not the whole zone. Leaving the path off would
  # put every parent behind a login screen. See the warning in
  # ../docs/ADMIN.md.
  domain = "blackshearpta.org/admin"

  # cf-terraforming also emitted `self_hosted_domains = ["blackshearpta.org/admin"]`
  # here. Removed: it is the legacy form of `destinations` below and the schema
  # rejects both together. Fourth defect in the generated Access output.

  # "Apply instant authentication". With exactly one login method, Access skips
  # its own login page and sends people straight to Google's account picker.
  # Verified live 2026-10-15: the login page carries
  # data-auto-redirect-to-identity="true" and data-idp="Google Workspace", and
  # redirects to accounts.google.com with hd=blackshearpta.org and
  # prompt=select_account.
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
    id = "BOARD_GOOGLE_WORKSPACE_POLICY_ID - see this file's header"
  }]
}

# The board allowlist, as a standalone reusable policy: named role addresses,
# signing in with Google only.
#
# It replaced "Blackshear PTA Website - Board Access (Legacy)" on 2026-10-15,
# which named three people and used one-time PIN; that policy is deleted.
#
# ../docs/TERRAFORM.md recommends defining an app-specific policy INLINE in the
# application, to avoid the two-ways-to-say-it problem above. That
# recommendation stands for anything built new - but it is not what the live
# account does, and this file records what is, not what was recommended.
resource "cloudflare_zero_trust_access_policy" "board_google_workspace" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  name       = "Blackshear PTA Website - Board (Google Workspace)"
  decision   = "allow"

  # Role addresses rather than "emails ending in @blackshearpta.org": the
  # domain would admit every PTA account, the break-glass one included. Roles
  # pass to the next volunteer, so this list rarely changes, and it bounds the
  # Zero Trust seat count to the people named. ../docs/ADMIN.md §1.5.
  include = [
    { email = { email = "communications@blackshearpta.org" } },
    { email = { email = "president@blackshearpta.org" } },
    { email = { email = "vp@blackshearpta.org" } },
    { email = { email = "secretary@blackshearpta.org" } },
    { email = { email = "fundraising@blackshearpta.org" } },
  ]

  # Only a Google Workspace sign-in satisfies this policy, so re-adding one-time
  # PIN in an emergency cannot quietly let these addresses in by emailed code.
  require = [
    { login_method = { id = "GOOGLE_WORKSPACE_IDP_ID - see this file's header" } },
  ]

  exclude = []
}

# Google Workspace sign-in (B6, 2026-10-15). The OAuth client is
# "Cloudflare Access - /admin" in the Google Cloud project blackshear-pta-access,
# under the PTA's Google organization, with an Internal audience: only
# blackshearpta.org accounts can sign in at all. Setup steps are in
# ../docs/ADMIN.md, section 1, step 0.
#
# Keep this resource OUT of any real state file. The provider marks
# config.client_secret Sensitive, which means redacted in plan output and
# PLAINTEXT in state. See "State and secrets" in ../docs/TERRAFORM.md.
#
# Set in the dashboard but not written here, because the schema's field names
# for them were not checked: Google prompt = Select account; PKCE off; SCIM off.
resource "cloudflare_zero_trust_access_identity_provider" "google_workspace" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  type       = "google-apps"
  name       = "Blackshear PTA Google Workspace"

  config = {
    apps_domain   = "blackshearpta.org"
    client_id     = "339102785000-uohqnj81moue3rhhi923lo61eqmd7o8f.apps.googleusercontent.com"
    client_secret = "REDACTED - in the password manager, never in this repository"
  }
}

# One-time PIN (emailed codes) was the only sign-in method from 2026-09-02 to
# 2026-10-15, and was removed then (Jon), so it is no longer recorded here. To
# bring it back in an emergency, see "Who owns the sign-in, and the emergency
# fallback" in ../docs/ADMIN.md. Its absence on a fresh account surfaced as
# three unrelated-looking bugs; that is F30.

# The built-in Cloudflare-account provider. This is the fallback F30 describes:
# with no identity provider configured, Access makes people sign in with a
# Cloudflare account, which no board member has.
#
# It is harmless as things stand - the application's allowed_idps lists only
# the Google Workspace provider above - but it is still here, and selecting it
# by accident would lock the board out of /admin.
resource "cloudflare_zero_trust_access_identity_provider" "terraform_managed_resource_17f19266-193f-47dd-a172-ace863e5e0c4_0" {
  account_id = "eb3bbf021359a4399c0ddef6bc09e3c4"
  type       = "cloudflare"

  # `name` added by hand. cf-terraforming emitted it empty, and `terraform
  # validate` rejects that because the v5 schema marks name Required. The API
  # is the reason: it returns an empty string. So the live state cannot be
  # expressed in the schema, and this resource does not round-trip. See F36 in
  # ../TASKS.md.
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
