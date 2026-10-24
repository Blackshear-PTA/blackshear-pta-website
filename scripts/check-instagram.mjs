/**
 * Blackshear PTA - Instagram post addresses.
 *
 * Checks that the validator /admin runs before saving the list accepts what the
 * Copy link button produces and refuses the addresses people actually paste.
 * Storing the list is check-d1's job (TASKS.md A52).
 *
 * The failure this guards against is quiet: a wrong address saves without
 * complaint and renders as an empty white box on the live page.
 *
 * Run: npm run check:instagram
 */
import { validatePosts, normalizeUrl, POST_URL, MAX_POSTS } from '../src/worker/instagram.mjs';

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.error(`  FAIL ${name}\n       expected ${JSON.stringify(expected)}\n       got      ${JSON.stringify(actual)}`);
  }
}

const A = 'https://www.instagram.com/p/ABC123xyz/';
const B = 'https://www.instagram.com/reel/Def456_-A/';

console.log('accepts (stored form on the right - normalizing may add a trailing slash):');
for (const [name, url, stored] of [
  ['a /p/ permalink', A, A],
  ['a /reel/ permalink', B, B],
  ['no trailing slash', 'https://www.instagram.com/p/ABC123', 'https://www.instagram.com/p/ABC123/'],
]) {
  const result = validatePosts([url]);
  check(name, result.ok === true && result.urls, [stored]);
}

console.log('\nnormalizes what the Copy link button actually produces:');
check(
  'strips utm parameters',
  normalizeUrl('https://www.instagram.com/p/DU_h7inEsyQ/?utm_source=ig_web_copy_link&igsi=MzRlODBiNWFlZA=='),
  'https://www.instagram.com/p/DU_h7inEsyQ/',
);
check('strips a fragment', normalizeUrl(`${A}#comments`), A);
check('adds the trailing slash back', normalizeUrl('https://www.instagram.com/p/ABC123xyz'), A);
check('leaves a clean permalink alone', normalizeUrl(A), A);
check('normalizes a reel too', normalizeUrl(`${B}?igsh=x`), B);
check('surrounding whitespace', normalizeUrl(`  ${A}  `), A);
check(
  'a pasted Copy link is accepted end to end',
  validatePosts(['https://www.instagram.com/p/DU_h7inEsyQ/?utm_source=ig_web_copy_link']).urls,
  ['https://www.instagram.com/p/DU_h7inEsyQ/'],
);
check(
  'the same post twice, one with parameters, is still a duplicate',
  validatePosts([A, `${A}?utm_source=x`]).ok,
  false,
);
// Normalizing must not become a way to smuggle a different host through.
check('a lookalike host is not rescued', normalizeUrl('https://www.instagram.com.evil.test/p/A1/?x=1'), 'https://www.instagram.com.evil.test/p/A1/');

console.log('\nrejects (each renders as an empty box if it gets through):');
for (const [name, url] of [
  ['a profile link', 'https://www.instagram.com/blackshearpta/'],
  ['a story', 'https://www.instagram.com/stories/blackshearpta/123/'],
  ['http, not https', 'http://www.instagram.com/p/ABC123/'],
  ['a lookalike host', 'https://www.instagram.com.evil.test/p/ABC123/'],
  ['no host at all', '/p/ABC123/'],
  ['a javascript: URL', 'javascript:alert(1)'],
  ['some other site', 'https://example.com/p/ABC123/'],
]) {
  const result = validatePosts([url]);
  check(name, result.ok, false);
  // The regex is the real control; confirm it directly too.
  if (POST_URL.test(url)) { failures++; console.error(`       POST_URL wrongly matched ${url}`); }
}

console.log('\nother refusals:');
check('duplicates', validatePosts([A, A]).ok, false);
check(`more than ${MAX_POSTS}`, validatePosts(Array(MAX_POSTS + 1).fill(A)).ok, false);
check('not a list', validatePosts('nope').ok, false);
check('blank entries are dropped, not refused', validatePosts([A, '', '  ']).urls, [A]);

console.log(`\n${failures ? `${failures} failing` : 'all Instagram list checks passed'}.`);
process.exit(failures ? 1 : 0);
