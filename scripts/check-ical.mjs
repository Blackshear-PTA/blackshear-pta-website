/**
 * Exercises src/lib/ical.ts against fixtures and, if reachable, the real feed.
 * Run with `npm run check:ical`. Exits non-zero on failure, so it can gate a
 * build the same way check-contrast.mjs does.
 *
 * These are the cases that are easy to get wrong and invisible when you do:
 * an all-day event shifting a day across timezones, a monthly rule landing on
 * the 31st of a 30-day month, EXDATE not actually removing anything, and a
 * VTIMEZONE block being read as two events named after DST transitions.
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
