# The calendar

**Google Calendar is the source of truth.** The website reads it; it never
writes back. To add or change an event, use Google Calendar, never the site.

The calendar is `mm0p8e311cqe8fcv2tfsuk4u5c@group.calendar.google.com`, owned by
the PTA's `blackshearpta@gmail.com`.

## Why Google stays the source

The one master list should live wherever the board will actually keep it
updated, and for a rotating volunteer board that is the Google Calendar app
already on their phone. Asking someone to learn a second system to add a bake
sale is how a calendar goes stale, and F18 in [`../TASKS.md`](../TASKS.md) is the
evidence: the Weebly site went a year out of date because updating it was harder
than not updating it.

Two alternatives were considered and recorded as D10:

- **Site as source, pushing to Google** via the Calendar API. Needs a service
  account, OAuth, domain-wide delegation and token refresh, and it makes the
  site a *second* place events live, which is exactly the drift risk to avoid.
- **Site as source, publishing its own `.ics`.** Architecturally the cleanest,
  and worth revisiting once `/admin` exists, but volunteers would lose the
  Google Calendar phone app for editing.

What did change is that the site **stopped embedding** Google's iframe. That was
always a separate problem from where the data lives, and it was the real one:
unreadable on a phone, ignoring the site's typography, loading third-party
script to draw a list of dates.

## Baked, not fetched

The obvious build is a Worker route that fetches and parses the feed on request.
It was measured and rejected:

> The feed is **~300KB**, carrying every event back to 2020. Parsing costs
> **~8ms** against a **10ms CPU ceiling per request** on the Cloudflare free
> plan.

Caching makes an overrun rare rather than impossible, and "the calendar
occasionally 500s" is a bad failure for the one page a parent checks on the way
out of the door.

So the feed is parsed at build time into `src/data/events.json`, which **is
committed**. The site stays fully static and the calendar has no runtime failure
mode at all. If Google is down during a build, the previous snapshot is still
there and still correct.

The unplanned benefit turned out to be the best part: **calendar changes arrive
as reviewable diffs.** "Who moved the PTA meeting" is answerable from `git log`.

The cost is staleness, bounded by how often the refresh runs. School events are
scheduled weeks out, so a day is comfortably inside tolerance, and `/calendar`
prints its snapshot date so nobody has to guess.

## How the refresh works

```
Google Calendar
      |  public iCal feed
      v
scripts/refresh-events.mjs        (npm run refresh:events)
      |  parses via src/lib/ical.ts
      v
src/data/events.json              committed
      |
      v
src/pages/calendar.astro          rendered at build time
```

`.github/workflows/refresh-events.yml` runs this daily at 09:20 UTC and commits
the result **if and only if it changed**. That commit is what triggers
Cloudflare to rebuild, so refreshing the data and publishing it are one step.

The workflow runs `npm run check:ical` *before* the refresh, so a parser
regression keeps yesterday's good snapshot rather than committing a broken one.
The script also refuses to write an empty result, since a parse returning zero
events is far more likely to be a regression than a genuinely empty school year.

The snapshot's `generated` field is **day precision on purpose**. A full
timestamp would differ on every run, and the Action would commit noise; a date
means at most one commit a day.

> **The workflow commits directly to `main`.** Only `src/data/events.json`, and
> only on a real change. A daily pull request would be worse: someone would have
> to merge it every morning, and within a week they would stop. To turn it off,
> delete the workflow file, or comment out its `schedule:` block to leave it
> runnable by hand from the Actions tab.

## The iCalendar reader

`src/lib/ical.ts`. No dependencies and no platform APIs, so it runs identically
in Node, in a Worker, and in a test.

Hand-rolled rather than using a library, which was a real decision:

- **Google's Calendar API** would return occurrences already expanded and
  filtered, making the parser unnecessary, but it needs an API key. An
  undocumented credential is exactly what breaks in 2028 after three board
  handovers.
- **A full RRULE library** is a dependency and a bundle for rules this feed does
  not use.

The file lists precisely what it supports and what it does not. Anything it
cannot represent is **reported in `skipped`, never dropped silently**, so an
unhandled rule shows up as a number rather than as an event that mysteriously
never appears.

### Testing it

```sh
npm run check:ical
```

Fixture tests plus a live-feed check. The fixtures cover the cases that are easy
to get wrong and invisible when you do:

| Case | Why it matters |
|---|---|
| All-day events keep their date | The classic off-by-one; a holiday moving a day is the worst bug this page can have |
| TZID across DST, both directions | A fixed offset is right half the year |
| Monthly on the 31st in a 30-day month | RFC 5545 says skip; naive date maths invents an event in March |
| EXDATE actually removes something | A cancelled meeting that still shows is worse than no calendar |
| VTIMEZONE not read as events | Those blocks contain their own `DTSTART` and `RRULE`, and a careless split turns them into two events named after DST transitions |

### The bug worth knowing about

**All-day events render a day early if you format them in a timezone.**

The parser stores an all-day event as midnight UTC, correctly: it is a square on
a calendar, not an instant, and anchoring it to a zone makes it jump a day for
anyone reading from a different one. But formatting *that value* in
`America/Chicago` turns midnight UTC into 7pm the previous evening, and Labor
Day on Sept 7 displays as Sept 6.

`calendar.astro` therefore keeps **two sets of formatters** and picks by
`allDay`. It is invisible in code review and only shows up if you check a
rendered date against the source, so if you touch that file, check one.

Recorded as F26 in [`../TASKS.md`](../TASKS.md).

## When the calendar moves to Google Workspace

Change `CALENDAR_ID` in `scripts/refresh-events.mjs`. That is the whole
migration, and a calendar can also be *transferred* rather than recreated, in
which case the id does not change and nothing needs touching at all.
