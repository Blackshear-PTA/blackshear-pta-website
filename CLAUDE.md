# CLAUDE.md

Start with [TASKS.md](TASKS.md). It is the working record for this project —
open tasks, decisions and the findings log — and most questions about *why*
something is the way it is are answered there rather than in the code. The
technical documentation is in [`docs/`](docs/), mapped by
[`docs/README.md`](docs/README.md).

## The Cloudflare account is pinned on purpose

This project deploys to **one** Cloudflare account and no other:

| | |
|---|---|
| **Account** | `Blackshearpta@gmail.com's Account` (the PTA account) |
| **Account ID** | `eb3bbf021359a4399c0ddef6bc09e3c4` |

That ID is written into [`wrangler.jsonc`](wrangler.jsonc) as `account_id`, and
into `terraform/workers.tf`, `terraform/storage.tf`, `terraform/access.tf` and
`terraform/README.md`. **Do not remove it as redundant configuration.** It is
not redundant, and the reason is specific.

`~/.zshenv` on the maintainer's machine exports a `CLOUDFLARE_API_TOKEN`.
`.zshenv` is read by *every* zsh invocation, including the non-interactive
shells that tooling and agents spawn, so that token is present in essentially
every terminal on that machine. Wrangler prefers an API token over any OAuth
session. There is also a second, personal Cloudflare account on that machine.
Put together: without a pinned `account_id`, the account a command lands in is
decided by whatever credential happens to be in the environment, not by what
the project intended — and a wrong-credential run *succeeds*, quietly, against
the wrong tenant.

With the ID pinned, that same run fails with an access error instead. A loud
failure is the whole point of the line.

**The fix belongs in project config, not in the shell.** Do not edit
`~/.zshenv` or remove that token to "solve" this — this project legitimately
depends on it. Every other project on the machine should pin its own
`account_id` the same way.

To confirm which account you are pointed at:

```
npx wrangler whoami
```

Wrangler needs Node 22 (see [`.node-version`](.node-version)); under Node 20 it
refuses to run at all and the error says nothing about accounts.
