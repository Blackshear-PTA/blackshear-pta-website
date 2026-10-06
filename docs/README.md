# Developer documentation

Technical documentation for the Blackshear PTA website. The
[top-level README](../README.md) is written for board members and volunteers and
explains the site in plain terms; start there if you want the shape of the thing
before the details.

## Read in this order

| # | Document | Read it when |
|---|---|---|
| 1 | [PROJECT-BRIEF.md](PROJECT-BRIEF.md) | **First, always.** Architecture and every locked decision *with its reasoning*. Most "why on earth is it done this way" questions are answered here |
| 2 | [DEVELOPMENT.md](DEVELOPMENT.md) | Getting it running locally, project layout, and the two conventions that will bite you if nobody tells you |
| 3 | [EDITING-CONTENT.md](EDITING-CONTENT.md) | Changing words, adding a page, adding a photo |
| 4 | [DEPLOYS.md](DEPLOYS.md) | How a push becomes a live site, build settings, domain monitoring |
| 5 | [CALENDAR.md](CALENDAR.md) | How Google Calendar reaches the site, and why it is baked rather than fetched |
| 6 | [ADMIN.md](ADMIN.md) | The `/admin` announcements editor: how it works, and the Cloudflare Access and GitHub token setup it needs |
| 7 | [TERRAFORM.md](TERRAFORM.md) | Whether the hand-clicked Cloudflare setup should move into Terraform, what can and cannot be imported, and the boundary that keeps Terraform away from the Worker |

[`../TASKS.md`](../TASKS.md) is the live task board: current status, open
decisions, and numbered findings that other documents cite as `F12`, `D3` and so
on. It is updated every working session. **Read it before planning anything.**

For reading rather than editing, `npm run tasks:board` renders it as one HTML page at
`.task-board/index.html`: what is urgent, the Workspace rollout, every task
filterable by owner and status, and the findings log. It is a view, not a second
copy. It holds nothing of its own, so regenerate it after editing TASKS.md.

[`BOARD-AGENDA.md`](BOARD-AGENDA.md) is the talking points for the next exec board meeting.
The task board shows it as a second *Board meeting* tab. Replace it before each meeting,
moving the old one into [`archive/`](archive/) with a date-prefixed name; the board shows
that folder as its *Archive* tab, newest first.

[`ACCOUNTS.md`](ACCOUNTS.md) is the map of every service the PTA runs, who controls each one, and what is changing.
The task board shows it as the *Systems & accounts* tab. Keep it current as access changes.

## Documentation that lives next to the thing it describes

Some notes are more useful sitting beside the files they are about than
collected here:

| Where | What |
|---|---|
| [`../assets/brand/README.md`](../assets/brand/README.md) | Logo files, the sampled brand palette, and its full contrast table |
| [`../src/assets/photos/README.md`](../src/assets/photos/README.md) | Every photo: what it shows, where it is used, and its crop quirks |
| `src/themes/registry.ts` | How to add or retire a theme, in the file you would add it to |
| `src/lib/ical.ts` | Exactly which parts of the iCalendar spec are supported, and which are not |
| `src/worker/frontmatter.mjs` | The narrow YAML subset `/admin` writes, and why it is hand-rolled |
| `wrangler.jsonc` | Which lines are temporary and must come out at launch |

## The habit worth keeping

Comments in this codebase explain **why**, not what. That is deliberate. This is
a volunteer project with a board that turns over annually, and the person
touching a file next will not have been in the conversation that produced it.

If you change something for a reason that is not obvious from the code, write
the reason down. If you *considered* an approach and rejected it, that is often
worth more than the code you kept: it stops the next person spending an
afternoon rediscovering why it does not work.
