/**
 * Exercises src/lib/ical.ts against fixtures and, if reachable, the real feed.
 * Run with `npm run check:ical`. Exits non-zero on failure, so it can gate a
 * build the same way check-contrast.mjs does.
 *
 * These are the cases that are easy to get wrong and invisible when you do:
 * an all-day event shifting a day across timezones, a monthly rule landing on
 * the 31st of a 30-day month, EXDATE not actually removing anything, a
 * VTIMEZONE block being read as two events named after DST transitions, a
 * moved occurrence showing on both its old date and its new one, and a repeat
 * drifting an hour when the clocks change (F63 in TASKS.md).
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// The parser is TypeScript with no runtime deps, so esbuild (already present
// via vite) can hand back plain JS without a build step of its own.
const compiled = execFileSync(
  join(root, 'node_modules/.bin/esbuild'),
  [join(root, 'src/lib/ical.ts'), '--format=esm', '--target=es2022'],
  { encoding: 'utf8' },
);
const { parseCalendar } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  const label = ok ? '  ok  ' : ' FAIL ';
  console.log(`${label} ${name}`);
  if (!ok) console.log(`         expected ${JSON.stringify(expected)}\n         got      ${JSON.stringify(actual)}`);
};

const ics = (body) =>
  ['BEGIN:VCALENDAR', 'X-WR-TIMEZONE:America/Chicago', body, 'END:VCALENDAR'].join('\r\n');

const WINDOW = [new Date('2026-01-01T00:00:00Z'), new Date('2027-12-31T00:00:00Z')];
const run = (body, win = WINDOW) => parseCalendar(ics(body), win[0], win[1]);
const days = (r) => r.events.map((e) => e.start.toISOString().slice(0, 10));
const starts = (r) => r.events.map((e) => e.start.toISOString());
/** The date as a Chicago wall calendar shows it, for timed events. */
const localDays = (r) => r.events.map((e) => e.start.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }));

console.log('iCal parser\n');

// An all-day event must land on its calendar square regardless of the reader's
// timezone. Anchoring it to a zone is how "Sept 3" becomes "Sept 2" for
// somebody, which is the single most user-visible bug this file can have.
check('all-day keeps its date',
  days(run('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:Holiday\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nEND:VEVENT')),
  ['2026-09-03']);

check('all-day flagged as all-day',
  run('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:H\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nEND:VEVENT').events[0].allDay,
  true);

// 12:00Z is 07:00 in Chicago during daylight time. If this comes back as
// anything else the display will be hours off.
check('UTC time preserved as an instant',
  run('BEGIN:VEVENT\r\nUID:b\r\nSUMMARY:Meeting\r\nDTSTART:20260910T120000Z\r\nDTEND:20260910T130000Z\r\nEND:VEVENT')
    .events[0].start.toISOString(),
  '2026-09-10T12:00:00.000Z');

// TZID means local wall-clock in that zone. 18:30 Chicago in September is CDT
// (UTC-5), so 23:30Z.
check('TZID converted to the right instant (CDT)',
  run('BEGIN:VEVENT\r\nUID:c\r\nSUMMARY:PTA\r\nDTSTART;TZID=America/Chicago:20260910T183000\r\nDTEND;TZID=America/Chicago:20260910T193000\r\nEND:VEVENT')
    .events[0].start.toISOString(),
  '2026-09-10T23:30:00.000Z');

// Same wall clock in January is CST (UTC-6), so 00:30Z the next day. This is
// the case a fixed offset gets wrong.
check('TZID respects DST (CST in January)',
  run('BEGIN:VEVENT\r\nUID:d\r\nSUMMARY:PTA\r\nDTSTART;TZID=America/Chicago:20270113T183000\r\nDTEND;TZID=America/Chicago:20270113T193000\r\nEND:VEVENT')
    .events[0].start.toISOString(),
  '2027-01-14T00:30:00.000Z');

check('weekly by day',
  days(run('BEGIN:VEVENT\r\nUID:e\r\nSUMMARY:W\r\nDTSTART;VALUE=DATE:20260907\r\nDTEND;VALUE=DATE:20260908\r\nRRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3\r\nEND:VEVENT')),
  ['2026-09-07', '2026-09-14', '2026-09-21']);

// The real feed's PTA meeting rule.
check('monthly 4th Wednesday',
  days(run('BEGIN:VEVENT\r\nUID:f\r\nSUMMARY:PTA\r\nDTSTART;VALUE=DATE:20260923\r\nDTEND;VALUE=DATE:20260924\r\nRRULE:FREQ=MONTHLY;BYDAY=4WE;COUNT=3\r\nEND:VEVENT')),
  ['2026-09-23', '2026-10-28', '2026-11-25']);

// RFC 5545 says skip, not roll forward. Naive date maths turns Feb 31 into
// March 3 and invents an event nobody scheduled.
check('monthly on the 31st skips short months',
  days(run('BEGIN:VEVENT\r\nUID:g\r\nSUMMARY:M\r\nDTSTART;VALUE=DATE:20260131\r\nDTEND;VALUE=DATE:20260201\r\nRRULE:FREQ=MONTHLY;BYMONTHDAY=31;COUNT=4\r\nEND:VEVENT')),
  ['2026-01-31', '2026-03-31', '2026-05-31', '2026-07-31']);

check('yearly',
  days(run('BEGIN:VEVENT\r\nUID:h\r\nSUMMARY:Y\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nRRULE:FREQ=YEARLY;COUNT=2\r\nEND:VEVENT')),
  ['2026-09-03', '2027-09-03']);

check('UNTIL stops the series',
  days(run('BEGIN:VEVENT\r\nUID:i\r\nSUMMARY:U\r\nDTSTART;VALUE=DATE:20260907\r\nDTEND;VALUE=DATE:20260908\r\nRRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260921\r\nEND:VEVENT')),
  ['2026-09-07', '2026-09-14', '2026-09-21']);

check('EXDATE removes an occurrence',
  days(run('BEGIN:VEVENT\r\nUID:j\r\nSUMMARY:E\r\nDTSTART;VALUE=DATE:20260907\r\nDTEND;VALUE=DATE:20260908\r\nRRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3\r\nEXDATE;VALUE=DATE:20260914\r\nEND:VEVENT')),
  ['2026-09-07', '2026-09-21']);

check('STATUS:CANCELLED is dropped',
  run('BEGIN:VEVENT\r\nUID:k\r\nSUMMARY:X\r\nSTATUS:CANCELLED\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nEND:VEVENT').events.length,
  0);

// --- repeats in local time, and edited occurrences (F63) --------------------
// Modelled on the real feed's "Tea with Tiona": 7:40am on the 4th Thursday,
// with some months moved. Google writes an edited occurrence as its own VEVENT
// whose RECURRENCE-ID names the slot it replaces, in local time with a TZID.
const tea = (rule) => [
  'BEGIN:VEVENT', 'UID:tea', 'SUMMARY:Tea',
  'DTSTART;TZID=America/Chicago:20261022T074000', 'DTEND;TZID=America/Chicago:20261022T084000',
  `RRULE:FREQ=MONTHLY;BYDAY=4TH;${rule}`, 'END:VEVENT',
];
const teaMoved = (from, to, extra = []) => [
  'BEGIN:VEVENT', 'UID:tea', 'SUMMARY:Tea', ...extra,
  `DTSTART;TZID=America/Chicago:${to}T074000`, `DTEND;TZID=America/Chicago:${to}T084000`,
  `RECURRENCE-ID;TZID=America/Chicago:${from}T074000`, 'END:VEVENT',
];

// 7:40am is 12:40Z in October (CDT) but 13:40Z after the clocks go back on
// Nov 1. Holding the UTC time fixed instead shows every winter one at 6:40.
check('a repeat keeps its local time across DST',
  starts(run(tea('COUNT=3').join('\r\n'))),
  ['2026-10-22T12:40:00.000Z', '2026-11-26T13:40:00.000Z', '2026-12-24T13:40:00.000Z']);

// The bug that was reported: Oct 22 moved to Oct 29 showed on both days. The
// edited copy comes first, as it does in the real feed.
check('a moved occurrence shows once, on its new date',
  starts(run([...teaMoved('20261022', '20261029'), ...tea('COUNT=3')].join('\r\n'))),
  ['2026-10-29T12:40:00.000Z', '2026-11-26T13:40:00.000Z', '2026-12-24T13:40:00.000Z']);

check('a moved occurrence in winter shows once',
  starts(run([...tea('COUNT=3'), ...teaMoved('20261126', '20261119')].join('\r\n'))),
  ['2026-10-22T12:40:00.000Z', '2026-11-19T13:40:00.000Z', '2026-12-24T13:40:00.000Z']);

check('a canceled occurrence is removed',
  starts(run([...tea('COUNT=3'), ...teaMoved('20261126', '20261126', ['STATUS:CANCELLED'])].join('\r\n'))),
  ['2026-10-22T12:40:00.000Z', '2026-12-24T13:40:00.000Z']);

check('EXDATE removes a winter occurrence of a zoned repeat',
  starts(run([...tea('COUNT=3').slice(0, -1), 'EXDATE;TZID=America/Chicago:20261126T074000', 'END:VEVENT'].join('\r\n'))),
  ['2026-10-22T12:40:00.000Z', '2026-12-24T13:40:00.000Z']);

check('a moved all-day occurrence shows once',
  days(run([
    'BEGIN:VEVENT', 'UID:s', 'SUMMARY:S', 'DTSTART;VALUE=DATE:20260907', 'DTEND;VALUE=DATE:20260908',
    'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:s', 'SUMMARY:S', 'DTSTART;VALUE=DATE:20260915', 'DTEND;VALUE=DATE:20260916',
    'RECURRENCE-ID;VALUE=DATE:20260914', 'END:VEVENT',
  ].join('\r\n'))),
  ['2026-09-07', '2026-09-15', '2026-09-21']);

// Moved to before the window: the edited copy is out of range, but the slot
// it left is in range and must still be cleared.
check('an occurrence moved out of the window still clears its slot',
  days(run([
    'BEGIN:VEVENT', 'UID:w', 'SUMMARY:W', 'DTSTART;VALUE=DATE:20260907', 'DTEND;VALUE=DATE:20260908',
    'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:w', 'SUMMARY:W', 'DTSTART;VALUE=DATE:20260909', 'DTEND;VALUE=DATE:20260910',
    'RECURRENCE-ID;VALUE=DATE:20260914', 'END:VEVENT',
  ].join('\r\n'), [new Date('2026-09-10T00:00:00Z'), WINDOW[1]])),
  ['2026-09-21']);

// 7pm on a Tuesday is already Wednesday in UTC. Matching BYDAY against the UTC
// date put this meeting on Mondays.
check('an evening repeat stays on its weekday',
  localDays(run('BEGIN:VEVENT\r\nUID:v\r\nSUMMARY:V\r\nDTSTART;TZID=America/Chicago:20260908T190000\r\nDTEND;TZID=America/Chicago:20260908T200000\r\nRRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=2\r\nEND:VEVENT')),
  ['2026-09-08', '2026-09-15']);

// A VTIMEZONE has BEGIN:STANDARD / BEGIN:DAYLIGHT children carrying DTSTART and
// RRULE. Splitting the file carelessly turns those into events.
check('VTIMEZONE is not read as events',
  run(['BEGIN:VTIMEZONE', 'TZID:America/Chicago',
       'BEGIN:DAYLIGHT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'TZNAME:CDT', 'END:DAYLIGHT',
       'BEGIN:STANDARD', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'TZNAME:CST', 'END:STANDARD',
       'END:VTIMEZONE',
       'BEGIN:VEVENT', 'UID:l', 'SUMMARY:Real', 'DTSTART;VALUE=DATE:20260903', 'DTEND;VALUE=DATE:20260904', 'END:VEVENT',
      ].join('\r\n')).events.map((e) => e.title),
  ['Real']);

// A SUMMARY folded across lines must come back whole.
check('folded lines are rejoined',
  run('BEGIN:VEVENT\r\nUID:m\r\nSUMMARY:A very long event title that wrapped\r\n  across two lines\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nEND:VEVENT')
    .events[0].title,
  'A very long event title that wrapped across two lines');

check('escaped commas and newlines decoded',
  run('BEGIN:VEVENT\r\nUID:n\r\nSUMMARY:Bake sale\\, cafeteria\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nEND:VEVENT')
    .events[0].title,
  'Bake sale, cafeteria');

check('events outside the window are excluded',
  run('BEGIN:VEVENT\r\nUID:o\r\nSUMMARY:Old\r\nDTSTART;VALUE=DATE:20200903\r\nDTEND;VALUE=DATE:20200904\r\nEND:VEVENT').events.length,
  0);

check('results are sorted soonest first',
  days(run([
    'BEGIN:VEVENT', 'UID:p', 'SUMMARY:Later', 'DTSTART;VALUE=DATE:20261201', 'DTEND;VALUE=DATE:20261202', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:q', 'SUMMARY:Sooner', 'DTSTART;VALUE=DATE:20260901', 'DTEND;VALUE=DATE:20260902', 'END:VEVENT',
  ].join('\r\n'))),
  ['2026-09-01', '2026-12-01']);

// A rule we cannot represent must be reported, never dropped in silence.
check('unsupported rule parts are reported',
  run('BEGIN:VEVENT\r\nUID:r\r\nSUMMARY:Odd\r\nDTSTART;VALUE=DATE:20260903\r\nDTEND;VALUE=DATE:20260904\r\nRRULE:FREQ=MONTHLY;BYSETPOS=-1;BYDAY=FR\r\nEND:VEVENT')
    .skipped.length > 0,
  true);

// --- the real feed, if we can reach it -------------------------------------
const LIVE = process.env.BLACKSHEAR_ICS
  ?? 'https://calendar.google.com/calendar/ical/mm0p8e311cqe8fcv2tfsuk4u5c%40group.calendar.google.com/public/basic.ics';

console.log('\nlive feed');
try {
  const response = await fetch(LIVE, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.text();
  const now = new Date();
  const to = new Date(now.getTime() + 365 * 86_400_000);

  const started = performance.now();
  const { events, skipped } = parseCalendar(body, now, to);
  const ms = performance.now() - started;

  console.log(`  feed          ${(body.length / 1024).toFixed(0)}KB`);
  console.log(`  parsed in     ${ms.toFixed(1)}ms`);
  console.log(`  upcoming      ${events.length} events in the next 12 months`);
  console.log(`  skipped       ${skipped.length}`);
  for (const s of skipped.slice(0, 5)) console.log(`                - ${s.summary}: ${s.reason}`);

  const bad = events.filter((e) => e.end < e.start || Number.isNaN(e.start.getTime()));
  check('every event has a sane start and end', bad.length, 0);
  check('every event has a title', events.filter((e) => !e.title).length, 0);
  check('nothing before now leaked through', events.filter((e) => e.start < now).length, 0);
  check('ids are unique', new Set(events.map((e) => e.id)).size, events.length);

  console.log('\n  next 8:');
  for (const e of events.slice(0, 8)) {
    const when = e.allDay
      ? e.start.toISOString().slice(0, 10)
      : e.start.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
    console.log(`    ${when.padEnd(26)} ${e.title}`);
  }
} catch (error) {
  // Offline is not a build failure; the fixtures above are the real gate.
  console.log(`  skipped: ${error.message}`);
}

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} FAILING`}`);
process.exit(failures === 0 ? 0 : 1);
