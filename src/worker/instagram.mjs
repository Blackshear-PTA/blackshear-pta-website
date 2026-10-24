/**
 * The rules for an Instagram post address - what /admin accepts for the list
 * on /gallery.
 *
 * The list itself is in D1 since 2026-10-24 (src/lib/instagram-list.mjs,
 * TASKS.md A52). It used to be src/content/instagram.yaml, and this file also
 * wrote and parsed that YAML; those halves went with it.
 *
 * .mjs rather than .ts so scripts/check-instagram.mjs can import it directly
 * and run real values through it.
 */

/**
 * A public post permalink and nothing else.
 *
 * Deliberately strict, and applied AFTER normalizeUrl - so tracking parameters
 * are stripped rather than refused, but a profile link, a story or some other
 * host still cannot get through. Each of those renders as an empty white box on
 * the live page with no clue what went wrong, so they are caught at the point
 * somebody pastes one, where there is a person to tell.
 */
export const POST_URL = /^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/;

/**
 * How many posts /gallery shows.
 *
 * Each one is an iframe loaded from instagram.com, so this is a page-weight
 * decision rather than a taste one - six is already a slow page on a phone in
 * the pickup line, and the PTA's own photo grid sits right below it doing the
 * same job for free.
 */
export const MAX_POSTS = 6;

/**
 * Trims an address down to the permalink.
 *
 * Instagram's own "Copy link" button produces
 * `.../p/ABC123/?utm_source=ig_web_copy_link&igsi=...`, so refusing anything
 * with a query string means refusing the exact thing the app hands people. That
 * was the first address pasted at this and it bounced, which is the whole
 * argument for normalizing rather than validating harder.
 *
 * Everything after `?` or `#` is tracking; the permalink identifies the post on
 * its own. A trailing slash is added back so stored addresses look alike.
 */
export function normalizeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const stripped = raw.split(/[?#]/)[0] ?? '';
  const match = /^(https:\/\/www\.instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+)\/?$/.exec(stripped);
  return match ? `${match[1]}/` : stripped;
}

/**
 * Checks a list the editor sent. Returns the cleaned list or a message meant to
 * be read by whoever is standing at the form.
 *
 * The union is spelled out so TypeScript can narrow it at the call site in
 * admin.ts. Without the typedef `urls` reads as possibly-undefined even after
 * `ok` has been checked, and the fix for that is a `?? []` that would quietly
 * write an empty list if this function ever changed shape.
 *
 * @typedef {{ ok: true, urls: string[] } | { ok: false, error: string }} PostsCheck
 * @param {unknown} value
 * @returns {PostsCheck}
 */
export function validatePosts(value) {
  if (!Array.isArray(value)) return { ok: false, error: 'The list of posts was not readable.' };
  if (value.length > MAX_POSTS) {
    return { ok: false, error: `That is more than ${MAX_POSTS} posts. Remove a few first.` };
  }

  const urls = [];
  for (const item of value) {
    const url = normalizeUrl(item);
    if (!url) continue;
    if (!POST_URL.test(url)) {
      return {
        ok: false,
        error:
          `"${url}" is not a post address. Open the post itself on Instagram and use ` +
          'Copy link, or copy the address from the browser bar - it looks like ' +
          'https://www.instagram.com/p/ABC123/. A profile page or a story will not work.',
      };
    }
    // Same post twice is two identical embeds, which always reads as a bug.
    if (urls.includes(url)) {
      return { ok: false, error: 'That post is already in the list.' };
    }
    urls.push(url);
  }
  return { ok: true, urls };
}
