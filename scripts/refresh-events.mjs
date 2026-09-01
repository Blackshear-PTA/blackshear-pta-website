/**
 * Refreshes src/data/events.json from the PTA's Google Calendar.
 *
 * Run with `npm run refresh:events`. A GitHub Action runs it daily and commits
 * the result, which is what keeps /calendar current between pushes.
 *
 * WHY A COMMITTED SNAPSHOT rather than fetching live.
 *
 * The obvious design is a Worker route that fetches and parses the feed on
 * request. It was measured and rejected: the feed is ~300KB covering every
 * event back to 2020, and parsing it takes ~8ms, against a 10ms CPU ceiling per
 * request on the Cloudflare free plan. Caching makes that rare rather than
 * impossible, and "the calendar occasionally 500s" is a bad failure for the one
 * page parents check before leaving the house.
 *
 * Baking it at build time removes the failure mode entirely. The site stays
 * fully static, the calendar cannot break at runtime, and if Google is down
 * during a build the previous snapshot is still committed and still correct.
 *
 * The side benefit turned out to be the best part: calendar changes arrive as
 * reviewable diffs. "Who moved the PTA meeting" is answerable from git log.
 *
 * The cost is staleness, bounded by how often the Action runs. School events
 * are scheduled weeks out, so a day is comfortably inside tolerance, and
 * /calendar shows the snapshot date so nobody has to guess.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const OUT = join(root, 'src/data/events.json');

/**
 * The PTA's Google Calendar, taken from the embed on the Weebly page. Public,
 * so this is not a secret and belongs in the repo where it can be found.
 *
 * WHEN THE CALENDAR MOVES TO GOOGLE WORKSPACE: change this one line. A calendar
 * can also be transferred rather than recreated, in which case the id does not
 * change at all and nothing here needs touching.
 */
const CALENDAR_ID = 'mm0p8e311cqe8fcv2tfsuk4u5c@group.calendar.google.com';
const FEED = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

/** How far ahead to bake. Longer costs bytes; nobody plans a bake sale in 2028. */
const MONTHS_AHEAD = 12;

const compiled = execFileSync(
  join(root, 'node_modules/.bin/esbuild'),
  [join(root, 'src/lib/ical.ts'), '--format=esm', '--target=es2022'],
  { encoding: 'utf8' },
);
const { parseCalendar } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

const response = await fetch(process.env.BLACKSHEAR_ICS ?? FEED, {
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok) {
  console.error(`Feed returned HTTP ${response.status}. Leaving the existing snapshot alone.`);
  process.exit(1);
}

const from = new Date();
// Start of today, not this instant, so an event already under way still shows.
from.setUTCHours(0, 0, 0, 0);
const to = new Date(from);
to.setUTCMonth(to.getUTCMonth() + MONTHS_AHEAD);

const { events, skipped } = parseCalendar(await response.text(), from, to);

if (events.length === 0) {
  // An empty parse is far more likely to be a parser or feed regression than a
  // genuinely empty school year, and overwriting a good snapshot with nothing
  // would quietly blank the page.
  console.error('Parsed zero events. Refusing to overwrite the snapshot.');
  process.exit(1);
}

const snapshot = {
  source: CALENDAR_ID,
  /**
   * Day precision, deliberately. A full timestamp would differ on every run and
   * the Action would commit noise hourly if anyone ever tightened the schedule;
   * a date means at most one commit a day, which is the cadence we actually
   * want. It is also what /calendar shows as "updated", so it needs to be true
   * rather than merely stable.
   */
  generated: from.toISOString().slice(0, 10),
  window: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
  events: events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    allDay: e.allDay,
    ...(e.location ? { location: e.location } : {}),
    ...(e.description ? { description: e.description } : {}),
  })),
};

const serialised = `${JSON.stringify(snapshot, null, 2)}\n`;
const unchanged = existsSync(OUT) && readFileSync(OUT, 'utf8') === serialised;

if (unchanged) {
  console.log(`No change. ${events.length} events, ${skipped.length} skipped.`);
} else {
  writeFileSync(OUT, serialised);
  console.log(`Wrote ${events.length} events to src/data/events.json.`);
}

if (skipped.length) {
  console.warn(`\n${skipped.length} entries could not be represented:`);
  for (const s of skipped) console.warn(`  - ${s.summary}: ${s.reason}`);
}
