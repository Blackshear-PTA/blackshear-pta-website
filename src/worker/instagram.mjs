/**
 * Read and write src/content/instagram.yaml - the Instagram posts on /gallery.
 *
 * Same shape and same reasoning as frontmatter.mjs: /admin writes a file that
 * Astro's content loader then parses with a real YAML parser, and the only way
 * that round trip stays safe is if the writer emits a small, boring subset.
 * So this quotes every URL, always, and understands exactly one field.
 *
 * .mjs rather than .ts so scripts/check-instagram.mjs can import it directly
 * and round-trip real values through it.
 *
 * WHY THE WHOLE FILE IS REGENERATED rather than edited in place: the editor
 * sends a list and gets a list back, so there is no partial state to get wrong,
 * and the comment header is rewritten from one string that lives here. An
 * editor that patched lines would have to understand the comments too.
 */

/**
 * A public post permalink and nothing else.
 *
 * Deliberately strict. A profile link, a share URL with tracking parameters, a
 * story, or a `/p/` with a trailing query all render as an empty white box on
 * the live page and give no clue what went wrong - so they are refused at the
 * point somebody pastes them, where there is a person to tell.
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

const HEADER = `# Instagram posts embedded on /gallery.
#
# MANAGED FROM /admin. Open the site's editor and use "Instagram posts" - it
# checks each address, keeps the order, and saves the file for you.
#
# Editing by hand still works and is not discouraged; this is an ordinary
# content file. Keep the shape below exactly: a list of \`- url:\` entries under
# \`gallery: posts:\`, each a public post permalink in double quotes.
#
# WHY A CHOSEN LIST AND NOT THE WHOLE FEED. Reading an account's recent posts
# needs a Meta app, a Business account and an access token that expires every 60
# days. Displaying a post needs none of that - Instagram renders any public post
# from its address. So the site does the part that is free forever and a person
# picks which ${MAX_POSTS} posts are worth showing, which is a better page anyway.
#
# A private post renders as an empty box for everyone but its followers.
`;

/**
 * The post URLs in a file, in order. Anything unrecognizable is skipped rather
 * than throwing: one bad hand-edited line should not make the page uneditable.
 */
export function parsePosts(text) {
  const urls = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- url:')) continue;
    const raw = trimmed.slice('- url:'.length).trim();
    // Both quote styles, plus bare, because a human may have typed any of them.
    const unquoted =
      (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) ||
      (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2)
        ? raw.slice(1, -1)
        : raw;
    if (unquoted) urls.push(unquoted);
  }
  return urls;
}

/** The complete file for a list of URLs. Always the full document. */
export function stringifyPosts(urls) {
  const list = Array.isArray(urls) ? urls : [];
  if (list.length === 0) {
    // `posts: []` rather than an empty `posts:`, which YAML reads as null and
    // the schema would then have to special-case.
    return `${HEADER}\ngallery:\n  posts: []\n`;
  }
  // JSON.stringify gives a correctly escaped double-quoted scalar, and a
  // double-quoted string is valid YAML. These are URLs matched against
  // POST_URL, so there is nothing exotic to escape - this is belt and braces.
  const lines = list.map((url) => `    - url: ${JSON.stringify(String(url))}`);
  return `${HEADER}\ngallery:\n  posts:\n${lines.join('\n')}\n`;
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
    const url = typeof item === 'string' ? item.trim() : '';
    if (!url) continue;
    if (!POST_URL.test(url)) {
      return {
        ok: false,
        error:
          `"${url}" is not a post address. Open the post on instagram.com and copy ` +
          'the address from the browser bar - it looks like ' +
          'https://www.instagram.com/p/ABC123/ - and remove anything after a "?".',
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
