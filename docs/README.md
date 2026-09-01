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
| 5 | [PRE-LAUNCH-GATE.md](PRE-LAUNCH-GATE.md) | The shared password in front of the site, and how to remove it at launch |
| 6 | [CALENDAR.md](CALENDAR.md) | How Google Calendar reaches the site, and why it is baked rather than fetched |

[`../TASKS.md`](../TASKS.md) is the live task board: current status, open
decisions, and numbered findings that other documents cite as `F12`, `D3` and so
on. It is updated every working session. **Read it before planning anything.**

## Documentation that lives next to the thing it describes

Some notes are more useful sitting beside the files they are about than
collected here:

| Where | What |
|---|---|
| [`../assets/brand/README.md`](../assets/brand/README.md) | Logo files, the sampled brand palette, and its full contrast table |
| [`../src/assets/photos/README.md`](../src/assets/photos/README.md) | Every photo: what it shows, where it is used, and its crop quirks |
| `src/themes/registry.ts` | How to add or retire a theme, in the file you would add it to |
| `src/lib/ical.ts` | Exactly which parts of the iCalendar spec are supported, and which are not |
| `wrangler.jsonc` | Which lines are temporary and must come out at launch |

## The habit worth keeping

Comments in this codebase explain **why**, not what. That is deliberate. This is
a volunteer project with a board that turns over annually, and the person
touching a file next will not have been in the conversation that produced it.

If you change something for a reason that is not obvious from the code, write
the reason down. If you *considered* an approach and rejected it, that is often
worth more than the code you kept: it stops the next person spending an
afternoon rediscovering why it does not work.
