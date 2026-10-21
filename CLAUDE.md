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
| **Account** | `Blackshear PTA` (the PTA account; named `Blackshearpta@gmail.com's Account` until 2026-10-05) |
| **Account ID** | `eb3bbf021359a4399c0ddef6bc09e3c4` |

That ID is written into [`wrangler.jsonc`](wrangler.jsonc) as `account_id`, and
into `terraform/workers.tf`, `terraform/storage.tf`, `terraform/access.tf` and
`terraform/README.md`. **Do not remove it as redundant configuration.** It is
not redundant, and the reason is specific.

Wrangler prefers an API token in the environment over any OAuth session, and
the maintainer's machine also has a second, personal Cloudflare account. Until
2026-10-16 `~/.zshenv` there exported this project's `CLOUDFLARE_API_TOKEN` to
every shell, including the non-interactive ones tooling and agents spawn.
Put together: without a pinned `account_id`, the account a command lands in is
decided by whatever credential happens to be in the environment, not by what
the project intended — and a wrong-credential run *succeeds*, quietly, against
the wrong tenant.

With the ID pinned, that same run fails with an access error instead. A loud
failure is the whole point of the line. Every other project on the machine
should pin its own `account_id` the same way.

## The API token is loaded per command, never globally

The token is in the macOS Keychain (item `blackshear-pta-wrangler-token`), and
[`scripts/cf.sh`](scripts/cf.sh) is the only thing that reads it, for the one
command it wraps. **Any wrangler command that talks to Cloudflare goes through
it:**

```
npm run cf:whoami                                  # which account am I pointed at?
npm run cf -- wrangler d1 execute blackshear-pta --remote --command "SELECT 1"
npm run db:migrate:remote                          # already wrapped
npm run export:posts -- --remote                   # already wrapped
```

Local work (`npm run dev`, `dev worker`, `npm run check`, `db:migrate`) needs no
token. Deploys need none either; Workers Builds holds its own.

**Do not put the token back in `~/.zshenv`, `~/.zshrc` or any other shell
profile**, and do not `export` it in a terminal. That is exactly the exposure
this replaced. To store or rotate it, see the header of `scripts/cf.sh`.

Wrangler needs Node 22 (see [`.node-version`](.node-version)); under Node 20 it
refuses to run at all and the error says nothing about accounts.

## The task board has an inbox

The published task board (its URL is in Claude's memory, not in this public
repo) has an *Inbox* where Jon jots down task ideas between sessions. They are
stored in that artifact's database, collection `inbox`, not in TASKS.md. Read
and update them with the `ArtifactData` tool; the document shape is in the
header of [`scripts/task-board.mjs`](scripts/task-board.mjs).

- **Whenever you rebuild the board, check the inbox first**, and tell Jon if
  ideas are waiting.
- **When Jon asks you to triage it:** for each idea with `status: "new"`, add a
  task to TASKS.md, or a step to an existing task. Then update the idea to
  `status: "filed"` with `tasks: ["A45"]`, or to `status: "dropped"` with a
  `note` saying why (a duplicate, say). Rebuild and republish the board in the
  same turn. Never delete an idea: the record of what it became is the point.
- **Republish without passing `capabilities`**, so the page keeps its `db` and
  `user` grants. Passing `{}` would switch the inbox off.
