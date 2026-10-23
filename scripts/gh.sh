#!/bin/sh
# Run ONE gh command as the PTA's Communications account on GitHub.
#
#   npm run gh -- pr list
#   npm run gh -- pr create --base main --title "..." --body "..."
#   sh scripts/gh.sh api user --jq .login        # prints blackshear-communications
#
# WHY. The maintainer's machine is also used for work that is not the PTA's,
# and gh's active account stays the maintainer's personal one for that. This repository's
# GitHub work runs as the Communications role account instead, which is an
# owner of the Blackshear-PTA organization and passes on with the role. Since
# 2026-10-23 the maintainer's personal account is no longer in the organization,
# so a gh command without this wrapper is refused there.
#
# Pushes are covered separately, by this checkout's own git config:
#
#   git config --local credential.https://github.com.username blackshear-communications
#   git config --local user.name  blackshear-communications
#   git config --local user.email 338345163+blackshear-communications@users.noreply.github.com
#
# gh's credential helper then hands git the Communications account's token for
# this repository only, and commits carry GitHub's no-reply address rather than
# anyone's real one.
#
# One-time setup: add the account to gh, then make the personal one active
# again, since adding an account also switches to it:
#
#   gh auth login --hostname github.com --git-protocol https --web
#   gh auth switch --user jon-flowers
#
# The token is read for the length of the one command this wraps. Without the
# account in gh this stops, rather than quietly running as someone else.
set -eu

ACCOUNT=blackshear-communications

if [ $# -eq 0 ]; then
  echo "usage: sh scripts/gh.sh <gh arguments>   e.g. sh scripts/gh.sh pr list" >&2
  exit 2
fi

if ! token="$(gh auth token --hostname github.com --user "$ACCOUNT" 2>/dev/null)" || [ -z "$token" ]; then
  cat >&2 <<MSG
gh.sh: gh has no login for $ACCOUNT, so nothing was run.
Add it once, then switch gh back to your own account:
  gh auth login --hostname github.com --git-protocol https --web
  gh auth switch --user jon-flowers
MSG
  exit 1
fi

GH_TOKEN="$token"
export GH_TOKEN
unset token

exec gh "$@"
