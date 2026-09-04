/**
 * Blackshear PTA - pull the latest Instagram posts into src/content/instagram.yaml.
 *
 * WHY A NIGHTLY JOB AND NOT A LIVE FEED. The site is static, so there is no
 * server to call Instagram from when a page loads. Doing it in the browser would
 * mean shipping an access token to every visitor, which is the same as
 * publishing it. So the fetch happens here, on a schedule, and the result is
 * committed - which is also what triggers the rebuild that publishes it.
 *
 * The cost is that the page can be up to a day behind. For an account that posts
 * every few days, that is not a cost anyone notices.
 *
 * WHICH API. `graph.instagram.com/me/media` - the Instagram API with Instagram
 * Login. It needs a Business or Creator account but NOT a linked Facebook Page,
 * which is the difference between a setup a PTA can do in ten minutes and one
 * that needs Business Manager. The old Basic Display API this replaces was shut
 * down in December 2024.
 *
 * TOKENS. IG_ACCESS_TOKEN must be a long-lived token. Long-lived tokens last 60
 * days, and this refreshes on every run - but a refresh only works if the token
 * is less than 60 days old, so a gap longer than that needs a new one by hand.
 * The refreshed value cannot be written back to a repository secret from here
 * (the default Actions token cannot write secrets), so what this does instead is
 * SAY how long is left, and fail loudly once it is under two weeks. See
 * docs/INSTAGRAM.md.
 *
 * FAILS RATHER THAN EMPTIES. A fetch error exits non-zero and writes nothing. An
 * expired token must not quietly turn into "the PTA has no posts" - a stale
 * gallery is much better than an empty one, and a red workflow is an email to
 * whoever owns the repo.
 *
 * Run: npm run refresh:instagram
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/content/instagram.yaml');

/** How many posts the gallery shows. Each one is an iframe, so this is not free. */
const LIMIT = 12;

/** Fail the run when a token has less than this long to live. */
const RENEW_WARNING_DAYS = 14;

/**
 * No token means the automatic mode was never set up, which is a legitimate
 * choice rather than a fault - the gallery works perfectly well with posts
 * listed by hand, and that path needs no Meta app at all.
 *
 * So this exits 0 and does nothing. Failing here would turn "we decided not to
 * bother" into a red workflow and an email every single night, which trains
 * whoever owns the repository to ignore exactly the notification that matters
 * when a real token expires.
 */
const token = process.env.IG_ACCESS_TOKEN;
if (!token) {
  console.log('IG_ACCESS_TOKEN is not set, so automatic mode is off. Nothing to do.');
  console.log('The gallery renders whatever is listed in src/content/instagram.yaml.');
  console.log('To turn automatic updates on, see docs/INSTAGRAM.md.');
  process.exit(0);
}

async function getJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Meta puts the useful part in `error.message`; the HTTP status alone is
    // almost always just 400.
    const detail = body?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(detail);
  }
  return body;
}

/**
 * A YAML double-quoted scalar. Same reasoning as src/worker/frontmatter.mjs:
 * quote unconditionally, so a caption containing a colon, a quote or a leading
 * digit cannot be reinterpreted as anything but a string.
 */
function yamlString(value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

// ── Token health ─────────────────────────────────────────────────────────────
// Checked first: there is no point fetching with a token that is about to die,
// and this is the only warning anyone gets.
let daysLeft = null;
try {
  const refreshed = await getJson(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
  );
  if (typeof refreshed.expires_in === 'number') {
    daysLeft = Math.floor(refreshed.expires_in / 86400);
    console.log(`Token good for about ${daysLeft} more days.`);
  }
} catch (error) {
  // Not fatal on its own - a page or system-user token has nothing to refresh
  // and answers with an error here while still working perfectly for reads.
  console.log(`Could not refresh the token (${error.message}). Continuing.`);
}

// ── The posts ────────────────────────────────────────────────────────────────
const fields = 'id,permalink,caption,media_type,timestamp';
let media;
try {
  const result = await getJson(
    `https://graph.instagram.com/me/media?fields=${fields}&limit=${LIMIT}&access_token=${encodeURIComponent(token)}`,
  );
  media = Array.isArray(result.data) ? result.data : [];
} catch (error) {
  console.error(`Instagram fetch failed: ${error.message}`);
  console.error('Leaving src/content/instagram.yaml untouched. See docs/INSTAGRAM.md.');
  process.exit(1);
}

/**
 * Stories and anything without a permalink cannot be embedded. Filtering here
 * rather than in the page keeps the file itself honest about what it holds.
 */
const posts = media
  .filter((item) => typeof item.permalink === 'string')
  .filter((item) => /^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/.test(item.permalink))
  .slice(0, LIMIT);

if (posts.length === 0) {
  console.error('Instagram returned no embeddable posts. Leaving the file untouched.');
  process.exit(1);
}

const header = `# Instagram posts embedded on /gallery.
#
# GENERATED FILE - do not edit by hand. Every line below the marker is rewritten
# by scripts/refresh-instagram.mjs, which runs nightly from
# .github/workflows/refresh-instagram.yml and commits the result. An edit here
# survives until the next run and then disappears without trace.
#
# It holds the ${LIMIT} most recent posts from the account. To change how many,
# change LIMIT in that script - each one is an iframe from instagram.com, so the
# number is a page-weight decision, not a taste one.
#
# WHY PERMALINKS AND NOT IMAGES. The API's image URLs expire after a few days,
# so a build a week later would render broken pictures. A permalink is stable
# forever, and Instagram's own embed renders the post from it.
#
# Last updated: ${new Date().toISOString().slice(0, 10)}
`;

const lines = posts.map((post) => {
  const caption = (post.caption ?? '').split('\n')[0]?.trim().slice(0, 120) ?? '';
  // The caption is a comment, purely so the file is readable in a diff - the
  // page never renders it, because Instagram's embed shows the real one.
  return `${caption ? `    # ${caption.replace(/\s+/g, ' ')}\n` : ''}    - url: ${yamlString(post.permalink)}`;
});

const yaml = `${header}\ngallery:\n  posts:\n${lines.join('\n')}\n`;

const unchanged = (() => {
  try {
    // Compare everything after the header, so the "last updated" date alone
    // never produces a commit - and therefore never triggers a pointless build.
    const previous = readFileSync(OUT, 'utf8');
    const body = (text) => text.slice(text.indexOf('\ngallery:'));
    return body(previous) === body(yaml);
  } catch {
    return false;
  }
})();

if (unchanged) {
  console.log(`No change - the same ${posts.length} posts are already in the file.`);
} else {
  writeFileSync(OUT, yaml);
  console.log(`Wrote ${posts.length} posts to src/content/instagram.yaml.`);
}

// Last, so the useful output is above it and a failure here still leaves the
// file written: a token nearing expiry is a thing to fix, not a reason to stop
// publishing.
if (daysLeft !== null && daysLeft < RENEW_WARNING_DAYS) {
  console.error(
    `\nThe Instagram token expires in ${daysLeft} days. Issue a new one and update the ` +
      'IG_ACCESS_TOKEN repository secret - see docs/INSTAGRAM.md. Failing this run so ' +
      'it is not missed.',
  );
  process.exit(1);
}
