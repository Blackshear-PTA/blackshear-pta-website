#!/bin/sh
# Run ONE command with the PTA's Cloudflare API token in its environment.
#
#   npm run cf -- wrangler d1 execute blackshear-pta --remote --command "SELECT 1"
#   npm run cf:whoami
#   sh scripts/cf.sh npx wrangler secret put GITHUB_TOKEN
#
# WHY. Until 2026-10-16 the token was exported from ~/.zshenv on the
# maintainer's machine, so every shell there carried a PTA credential: other
# projects, unrelated work, and every agent session. It now lives in the macOS
# Keychain and is read here, for the length of the one command this wraps, and
# nowhere else. Do not put it back in a shell profile.
#
# One-time setup, and also how a rotated token goes in (-U replaces the item;
# the trailing -w with no value prompts twice, with hidden input):
#
#   security add-generic-password -a "$USER" -s blackshear-pta-wrangler-token -U -w
#
# Not the same item as blackshear-pta-cf-token in terraform/README.md, which is
# the short-lived read-only token for cf-terraforming.
#
# Without that item - anyone else's machine, or CI - the command runs with
# whatever login wrangler already has (`npx wrangler login`). Either way the
# account comes from wrangler.jsonc, where it is pinned, so a credential for
# another account fails loudly instead of landing somewhere else.
set -eu

SERVICE=blackshear-pta-wrangler-token

if [ $# -eq 0 ]; then
  echo "usage: sh scripts/cf.sh <command> [args...]   e.g. sh scripts/cf.sh npx wrangler whoami" >&2
  exit 2
fi

if command -v security >/dev/null 2>&1 &&
  token="$(security find-generic-password -s "$SERVICE" -w 2>/dev/null)"; then
  # Replaces any token inherited from the environment: the Keychain item is the
  # one this project is meant to use.
  CLOUDFLARE_API_TOKEN="$token"
  export CLOUDFLARE_API_TOKEN
  unset token
else
  cat >&2 <<MSG
cf.sh: no Keychain item "$SERVICE", so wrangler will use its own login.
To use the PTA's API token instead, add it once (hidden prompt):
  security add-generic-password -a "\$USER" -s $SERVICE -U -w
MSG
fi

# So the account comes from wrangler.jsonc alone.
unset CLOUDFLARE_ACCOUNT_ID

exec "$@"
