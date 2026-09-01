/**
 * A small iCalendar (RFC 5545) reader, scoped to what a school calendar needs.
 *
 * WHY HAND-ROLLED. The obvious alternatives were both worse here. Google's
 * Calendar API returns occurrences already expanded and filtered, which would
 * make this file unnecessary - but it needs an API key, and a credential nobody
 * documents is exactly what breaks in 2028 after three board handovers. A full
 * RRULE library is a dependency and a bundle for rules this feed does not use.
 * What the Blackshear feed actually contains is narrow (see SUPPORTED below),
 * so this handles that and is honest about the rest.
 *
 * NO DEPENDENCIES AND NO PLATFORM APIS. Pure functions over strings and Dates,
 * so it runs identically in the Worker, at build time, and in a test.
 *
 * SUPPORTED, because it is what the feed uses:
 *   DTSTART/DTEND as VALUE=DATE (all-day), UTC (trailing Z), and TZID=
 *   RRULE  FREQ=DAILY|WEEKLY|MONTHLY|YEARLY with INTERVAL, COUNT, UNTIL,
 *          BYDAY (including ordinals like 2SU and 4WE), BYMONTH, BYMONTHDAY
 *   EXDATE          cancelled occurrences
 *   RECURRENCE-ID   a single occurrence moved or edited
 *   STATUS:CANCELLED
 *
 * NOT SUPPORTED, deliberately: BYSETPOS, BYWEEKNO, BYYEARDAY, WKST, and
 * VTIMEZONE definitions for zones other than the calendar's own. None appear in
 * this feed. `parseCalendar` reports anything it had to skip in `skipped`
 * rather than dropping it quietly, so a rule we do not handle shows up as a
 * number rather than as an event that silently never appears.
 */

export interface CalendarEvent {
  /** Stable per occurrence: UID, plus the start for expanded repeats. */
  id: string;
  title: string;
  /** UTC instant of the start. */
  start: Date;
  /** UTC instant of the end. Always after `start`. */
  end: Date;
  /** All-day events have no meaningful time and must not be shown one. */
  allDay: boolean;
  location?: string;
  description?: string;
}

export interface ParseResult {
  events: CalendarEvent[];
  /** Rules or events this parser could not represent. Surfaced, never hidden. */
  skipped: { reason: string; summary: string }[];
}

/** Guards a malformed or hostile RRULE from spinning forever. */
const MAX_OCCURRENCES = 400;

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/** Prefilter pair. Declared once: rebuilding a regex per event is most of the
 *  cost the prefilter exists to avoid. */
const QUICK_START = /^DTSTART[^:\r\n]*:(\d{8})/m;
const RECURS = /^(?:RRULE|RDATE)[;:]/m;

/**
 * RFC 5545 folds long lines by inserting CRLF followed by one space or tab.
 * Unfolding has to happen before anything else, or a long SUMMARY arrives
 * truncated at exactly the point it wrapped.
 */
function unfold(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

/** TEXT values escape these. A literal `\n` in a description is a real newline. */
function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

interface Line {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseLine(line: string): Line | null {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name = '', ...paramParts] = head.split(';');
  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value };
}

/**
 * Local wall-clock time in a named zone to a UTC instant.
 *
 * There is no way to ask JavaScript this directly, so: assume the wall clock IS
 * UTC, ask Intl what that instant looks like in the target zone, and the
 * difference is the offset. Applying it can cross a DST boundary and change the
 * offset, so it runs twice - the second pass is exact everywhere except the one
 * ambiguous hour when clocks go back, where it picks the earlier instant. For a
 * school calendar that hour holds no events.
 */
function zonedToUtc(
  y: number, mo: number, d: number, h: number, mi: number, s: number, timeZone: string,
): Date {
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  let guess = asUtc;
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(guess));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    // Intl renders midnight as hour 24 in some engines.
    const hour = get('hour') % 24;
    const seen = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
    guess += asUtc - seen;
  }
  return new Date(guess);
}

/** Parses a DATE or DATE-TIME value into a UTC instant. */
function parseDateValue(value: string, params: Record<string, string>, calendarTz: string) {
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly && params.VALUE === 'DATE') {
    const [, y, m, d] = dateOnly;
    // Midnight UTC, not midnight local. An all-day event is a calendar square,
    // not an instant, and anchoring it to a zone makes it jump a day for
    // anyone reading from another one.
    return { date: new Date(Date.UTC(+y!, +m! - 1, +d!)), allDay: true };
  }

  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!dt) return null;
  const [, y, mo, d, h, mi, s, zulu] = dt;
  const nums = [+y!, +mo!, +d!, +h!, +mi!, +s!] as const;

  if (zulu) return { date: new Date(Date.UTC(nums[0], nums[1] - 1, nums[2], nums[3], nums[4], nums[5])), allDay: false };
  // No Z and no TZID means floating local time; the calendar's own zone is the
  // only sensible reading.
  const tz = params.TZID ?? calendarTz;
  return { date: zonedToUtc(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], tz), allDay: false };
}

interface Rule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  count?: number;
  until?: Date;
  byDay: { ordinal: number | null; weekday: number }[];
  byMonth: number[];
  byMonthDay: number[];
  unsupported: string[];
}

function parseRule(value: string, calendarTz: string): Rule | null {
  const parts: Record<string, string> = {};
  for (const chunk of value.split(';')) {
    const eq = chunk.indexOf('=');
    if (eq !== -1) parts[chunk.slice(0, eq).toUpperCase()] = chunk.slice(eq + 1);
  }

  const freq = parts.FREQ;
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') return null;

  const unsupported = ['BYSETPOS', 'BYWEEKNO', 'BYYEARDAY'].filter((k) => k in parts);

  const byDay = (parts.BYDAY ?? '')
    .split(',')
    .filter(Boolean)
    .map((token) => {
      const m = /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/.exec(token.trim());
      if (!m) return null;
      return { ordinal: m[1] ? Number(m[1]) : null, weekday: WEEKDAYS.indexOf(m[2] as never) };
    })
    .filter((x): x is { ordinal: number | null; weekday: number } => x !== null);

  const until = parts.UNTIL
    ? parseDateValue(parts.UNTIL, parts.UNTIL.endsWith('Z') ? {} : { VALUE: 'DATE' }, calendarTz)?.date
    : undefined;

  return {
    freq,
    interval: Math.max(1, Number(parts.INTERVAL ?? 1) || 1),
    count: parts.COUNT ? Number(parts.COUNT) : undefined,
    until,
    byDay,
    byMonth: (parts.BYMONTH ?? '').split(',').filter(Boolean).map(Number),
    byMonthDay: (parts.BYMONTHDAY ?? '').split(',').filter(Boolean).map(Number),
    unsupported,
  };
}

/** Every date in `year`/`month` matching an ordinal weekday like 2SU or -1FR. */
function ordinalWeekdayDates(year: number, month: number, ordinal: number, weekday: number): number[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const matches: number[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === weekday) matches.push(day);
  }
  const index = ordinal > 0 ? ordinal - 1 : matches.length + ordinal;
  const hit = matches[index];
  return hit === undefined ? [] : [hit];
}

/**
 * Expands a rule into occurrence start instants inside [from, to].
 *
 * Walks the recurrence forward from DTSTART rather than trying to jump to the
 * window, because COUNT is defined over occurrences from the start and any
 * shortcut has to reproduce the same sequence anyway.
 */
function expand(start: Date, rule: Rule, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const hours = start.getUTCHours();
  const minutes = start.getUTCMinutes();
  const seconds = start.getUTCSeconds();

  let emitted = 0;
  let cursorYear = start.getUTCFullYear();
  let cursorMonth = start.getUTCMonth() + 1;
  let cursorDay = start.getUTCDate();
  const limit = rule.until && rule.until < to ? rule.until : to;

  const push = (y: number, mo: number, d: number): boolean => {
    const at = new Date(Date.UTC(y, mo - 1, d, hours, minutes, seconds));
    if (at < start) return true;
    if (at > limit) return false;
    if (rule.byMonth.length && !rule.byMonth.includes(mo)) return true;
    emitted += 1;
    if (rule.count !== undefined && emitted > rule.count) return false;
    if (at >= from) out.push(at);
    return true;
  };

  for (let step = 0; step < MAX_OCCURRENCES; step += 1) {
    if (rule.freq === 'DAILY') {
      if (!push(cursorYear, cursorMonth, cursorDay)) break;
      const next = new Date(Date.UTC(cursorYear, cursorMonth - 1, cursorDay + rule.interval));
      cursorYear = next.getUTCFullYear();
      cursorMonth = next.getUTCMonth() + 1;
      cursorDay = next.getUTCDate();
    } else if (rule.freq === 'WEEKLY') {
      const weekdays = rule.byDay.length ? rule.byDay.map((b) => b.weekday) : [start.getUTCDay()];
      // Sunday of the cursor's week, so BYDAY members come out in order.
      const cursor = new Date(Date.UTC(cursorYear, cursorMonth - 1, cursorDay));
      const weekStart = new Date(cursor);
      weekStart.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());
      let stop = false;
      for (const weekday of [...weekdays].sort((a, b) => a - b)) {
        const day = new Date(weekStart);
        day.setUTCDate(weekStart.getUTCDate() + weekday);
        if (!push(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate())) { stop = true; break; }
      }
      if (stop) break;
      const nextWeek = new Date(weekStart);
      nextWeek.setUTCDate(weekStart.getUTCDate() + 7 * rule.interval);
      cursorYear = nextWeek.getUTCFullYear();
      cursorMonth = nextWeek.getUTCMonth() + 1;
      cursorDay = nextWeek.getUTCDate();
    } else if (rule.freq === 'MONTHLY') {
      const days = rule.byDay.length
        ? rule.byDay.flatMap((b) =>
            b.ordinal === null
              ? monthWeekdayDates(cursorYear, cursorMonth, b.weekday)
              : ordinalWeekdayDates(cursorYear, cursorMonth, b.ordinal, b.weekday))
        : rule.byMonthDay.length
          ? rule.byMonthDay
          : [start.getUTCDate()];
      let stop = false;
      for (const day of [...new Set(days)].sort((a, b) => a - b)) {
        // Skips 31 in a 30-day month rather than rolling into the next, which
        // is what RFC 5545 requires and what naive date maths gets wrong.
        if (day > new Date(Date.UTC(cursorYear, cursorMonth, 0)).getUTCDate()) continue;
        if (!push(cursorYear, cursorMonth, day)) { stop = true; break; }
      }
      if (stop) break;
      cursorMonth += rule.interval;
      while (cursorMonth > 12) { cursorMonth -= 12; cursorYear += 1; }
    } else {
      const month = rule.byMonth.length ? rule.byMonth[0]! : start.getUTCMonth() + 1;
      const days = rule.byDay.length
        ? rule.byDay.flatMap((b) =>
            b.ordinal === null
              ? monthWeekdayDates(cursorYear, month, b.weekday)
              : ordinalWeekdayDates(cursorYear, month, b.ordinal, b.weekday))
        : [start.getUTCDate()];
      let stop = false;
      for (const day of [...new Set(days)].sort((a, b) => a - b)) {
        if (!push(cursorYear, month, day)) { stop = true; break; }
      }
      if (stop) break;
      cursorYear += rule.interval;
    }
  }

  return out;
}

/** Every date in the month falling on `weekday`. */
function monthWeekdayDates(year: number, month: number, weekday: number): number[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const out: number[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === weekday) out.push(day);
  }
  return out;
}

/**
 * Reads an .ics document and returns every occurrence starting in [from, to],
 * sorted soonest first.
 */
export function parseCalendar(raw: string, from: Date, to: Date): ParseResult {
  const text = unfold(raw);
  const calendarTz = /^X-WR-TIMEZONE:(.+)$/m.exec(text)?.[1]?.trim() || 'UTC';

  // YYYYMMDD of the window start, for the cheap string compare in the
  // prefilter below. Both sides are zero-padded fixed width, so lexical order
  // is chronological order and no Date objects need building.
  const fromStamp = from.toISOString().slice(0, 10).replace(/-/g, '');

  const events: CalendarEvent[] = [];
  const skipped: ParseResult['skipped'] = [];
  /** RECURRENCE-ID entries: one occurrence of a series, moved or edited. */
  const overrides = new Set<string>();

  // Split on the VEVENT boundary. VTIMEZONE blocks contain their own DTSTART
  // and RRULE lines, and folding them into the event list is a classic way to
  // ship two phantom "events" named after DST transitions.
  const blocks = text.split('BEGIN:VEVENT').slice(1).map((b) => b.split('END:VEVENT')[0] ?? '');

  for (const block of blocks) {
    // Cheap reject before the expensive part. This feed carries every event
    // back to 2020 - roughly two thirds of it is history that can never appear
    // in the window - and fully parsing each one costs more than the whole rest
    // of the job. A single regex for the start date, plus "does it repeat",
    // is enough to discard them. Recurring events always go the long way,
    // because a 2020 DTSTART with a yearly rule is still current.
    if (!RECURS.test(block)) {
      const quick = QUICK_START.exec(block);
      if (quick && `${quick[1]}` < fromStamp) continue;
    }

    const lines = block.split(/\r?\n/).map(parseLine).filter((l): l is Line => l !== null);
    const find = (name: string) => lines.find((l) => l.name === name);

    const summaryLine = find('SUMMARY');
    const startLine = find('DTSTART');
    if (!summaryLine || !startLine) continue;

    const summary = unescapeText(summaryLine.value).trim();
    if (find('STATUS')?.value === 'CANCELLED') continue;

    const startParsed = parseDateValue(startLine.value, startLine.params, calendarTz);
    if (!startParsed) {
      skipped.push({ reason: 'unreadable DTSTART', summary });
      continue;
    }

    const endLine = find('DTEND');
    const endParsed = endLine ? parseDateValue(endLine.value, endLine.params, calendarTz) : null;
    const duration = endParsed
      ? Math.max(0, endParsed.date.getTime() - startParsed.date.getTime())
      : startParsed.allDay ? 86_400_000 : 3_600_000;

    const uid = find('UID')?.value ?? summary;
    const recurrenceId = find('RECURRENCE-ID');
    if (recurrenceId) overrides.add(`${uid}@${recurrenceId.value}`);

    const location = find('LOCATION')?.value;
    const description = find('DESCRIPTION')?.value;

    const build = (at: Date): CalendarEvent => ({
      id: `${uid}@${at.toISOString()}`,
      title: summary,
      start: at,
      end: new Date(at.getTime() + duration),
      allDay: startParsed.allDay,
      ...(location ? { location: unescapeText(location).trim() } : {}),
      ...(description ? { description: unescapeText(description).trim() } : {}),
    });

    const ruleLine = find('RRULE');
    if (!ruleLine) {
      if (startParsed.date >= from && startParsed.date <= to) events.push(build(startParsed.date));
      continue;
    }

    const rule = parseRule(ruleLine.value, calendarTz);
    if (!rule) {
      skipped.push({ reason: `unhandled RRULE: ${ruleLine.value}`, summary });
      continue;
    }
    if (rule.unsupported.length) {
      skipped.push({ reason: `RRULE uses ${rule.unsupported.join(', ')}`, summary });
    }

    // EXDATE marks occurrences the organiser deleted from the series.
    const excluded = new Set<number>();
    for (const line of lines.filter((l) => l.name === 'EXDATE')) {
      for (const value of line.value.split(',')) {
        const parsed = parseDateValue(value.trim(), line.params, calendarTz);
        if (parsed) excluded.add(parsed.date.getTime());
      }
    }

    for (const at of expand(startParsed.date, rule, from, to)) {
      if (excluded.has(at.getTime())) continue;
      events.push(build(at));
    }
  }

  // An occurrence with its own RECURRENCE-ID entry is already in the list as
  // that edited copy; drop the one the rule generated so it does not appear
  // twice, once at the old time and once at the new.
  const deduped = events.filter((e) => {
    const stamp = e.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const uid = e.id.slice(0, e.id.lastIndexOf('@'));
    return !overrides.has(`${uid}@${stamp}`);
  });

  deduped.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { events: deduped, skipped };
}
