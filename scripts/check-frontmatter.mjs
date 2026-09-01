/**
 * Blackshear PTA - frontmatter round-trip gate.
 *
 * /admin writes announcement files that Astro's content loader then parses with
 * a real YAML parser. If the writer emits something YAML reads differently from
 * what was typed, the failure is quiet and delayed: the file looks fine in the
 * editor and the next build is what breaks, or worse, the post silently changes
 * meaning ("2026" becoming a number, "No: really" becoming a mapping).
 *
 * So every value a board member could plausibly type gets round-tripped here.
 * Several of these are not hypothetical - the live content already contains an
 * apostrophe and a "#".
 *
 * Run: npm run check:frontmatter
 */
import { stringifyPost, parsePost, filenameFor } from '../src/worker/frontmatter.mjs';

let failures = 0;
const pass = (name) => console.log(`  ok   ${name}`);
const fail = (name, detail) => { failures += 1; console.error(`  FAIL ${name}\n       ${detail}`); };

function roundTrip(name, meta, body) {
  const text = stringifyPost(meta, body);
  const back = parsePost(text);
  if (!back) return fail(name, 'parsePost returned null - no frontmatter block found');
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === '' || v === false) continue;
    const got = k === 'date' ? String(back.meta[k]).slice(0, 10) : back.meta[k];
    const want = k === 'date' ? String(v).slice(0, 10) : v;
    if (got !== want) return fail(name, `${k}: wrote ${JSON.stringify(want)}, read back ${JSON.stringify(got)}`);
  }
  if (back.body !== String(body).trim()) {
    return fail(name, `body: wrote ${JSON.stringify(String(body).trim())}, read back ${JSON.stringify(back.body)}`);
  }
  pass(name);
}

const base = { date: '2026-09-01' };

roundTrip('plain title', { ...base, title: 'Bake sale Friday' }, 'Bring a dollar.');
roundTrip('apostrophe', { ...base, title: "Let's keep Blackshear where it is" }, "It's happening.");
roundTrip('colon', { ...base, title: 'Reminder: the meeting moved' }, 'Note: 6pm.');
roundTrip('double quotes', { ...base, title: 'The "Buzz" Bowl returns' }, 'She said "yes".');
roundTrip('hash', { ...base, title: 'No Sting Fundraiser #3' }, 'Goal #1 met.');
roundTrip('ampersand', { ...base, title: 'Teachers & staff appreciation' }, 'Coffee & donuts.');
roundTrip('backslash', { ...base, title: 'Path\\to\\somewhere' }, 'A\\B');
roundTrip('leading number', { ...base, title: '2026 calendar is up' }, '135 years.');
roundTrip('yes/no words', { ...base, title: 'yes' }, 'no');
roundTrip('unicode', { ...base, title: 'Jardín y café' }, 'Piñata día');
roundTrip('emoji', { ...base, title: 'Field day 🐝' }, 'Bring water 💧');
roundTrip('long body', { ...base, title: 'Long' }, 'para one\n\npara two\n\npara three');
roundTrip('all fields', {
  ...base, title: 'Everything set', href: 'https://example.org/a?b=1&c=2',
  linkLabel: 'Read: more', pinned: true, draft: true,
}, 'Body.');

// Booleans must be omitted when false, not written as `false`.
{
  const text = stringifyPost({ ...base, title: 'X', pinned: false, draft: false }, 'b');
  if (text.includes('pinned:') || text.includes('draft:')) {
    fail('false booleans omitted', `emitted:\n${text}`);
  } else pass('false booleans omitted');
}

// Date must be unquoted, so the schema's coerce.date() sees a YAML date.
{
  const text = stringifyPost({ ...base, title: 'X' }, 'b');
  if (/date:\s*"/.test(text)) fail('date unquoted', 'date was written as a quoted string');
  else pass('date unquoted');
}

// Re-saving unchanged content must be byte-identical, or every save is a diff.
{
  const a = stringifyPost({ ...base, title: 'Stable' }, 'Body text.');
  const b = stringifyPost(parsePost(a).meta, parsePost(a).body);
  if (a !== b) fail('idempotent', `first:\n${JSON.stringify(a)}\nsecond:\n${JSON.stringify(b)}`);
  else pass('idempotent re-save');
}

// A file with no frontmatter must be rejected, not silently treated as empty.
{
  if (parsePost('just a body, no frontmatter') !== null) fail('rejects bodiless file', 'expected null');
  else pass('rejects file with no frontmatter');
}

const names = [
  [['2026-09-01', 'Bake sale Friday'], '2026-09-01-bake-sale-friday.md'],
  [['2026-09-01', "Let's go!"], '2026-09-01-let-s-go.md'],
  [['2026-09-01', 'Jardín y café'], '2026-09-01-jardin-y-cafe.md'],
  [['2026-09-01', '🐝🐝🐝'], '2026-09-01-post.md'],
  [['2026-09-01', '   '], '2026-09-01-post.md'],
];
for (const [[d, t], want] of names) {
  const got = filenameFor(d, t);
  if (got !== want) fail(`filename ${JSON.stringify(t)}`, `got ${got}, want ${want}`);
  else pass(`filename ${JSON.stringify(t)}`);
}

console.log(`\n${failures ? `${failures} failing` : 'all frontmatter checks passed'}.`);
process.exit(failures ? 1 : 0);
