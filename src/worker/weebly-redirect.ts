/**
 * TEMPORARY: send blackshearpta.org's visitors back to the old Weebly site.
 *
 * WHY. On 2026-10-22 the exec board decided the Weebly site stays the PTA's
 * public face until the new site's content is filled in and checked; they are
 * more confident in the old one for now. Flyers with blackshearpta.org on them
 * were going out that evening, so every page here points at its Weebly
 * counterpart, and /little-east lands on Weebly's Little EAST page rather than
 * its homepage. Tracked in TASKS.md.
 *
 * WHAT IS LEFT ALONE, so nothing else breaks while this is on:
 *
 *   - The Worker's workers.dev address. Only blackshearpta.org and www redirect,
 *     so the board can keep reviewing the new site at
 *     https://blackshear-pta.blackshearpta.workers.dev/ while they fill it in.
 *   - /admin, /images/*, /_astro/* and /favicon.*: worker.ts answers those
 *     before it ever asks this file, so the editor keeps working.
 *   - Anything that is a file rather than a page (/rss.xml, /robots.txt, ...).
 *
 * 302, not 301, and never cached: a 301 is remembered by browsers and is
 * effectively unrecallable (TASKS.md A22), and this is meant to come off.
 *
 * TO TURN IT OFF: set WEEBLY_REDIRECT to false, or delete this file and its two
 * lines in worker.ts, and merge. The new site's pages are all still here,
 * untouched, so nothing else needs restoring.
 */
export const WEEBLY_REDIRECT = true;

const WEEBLY = 'https://blackshearpta.weebly.com';

/** The names that redirect. Everything else reaching the Worker is left alone. */
const HOSTS = new Set(['blackshearpta.org', 'www.blackshearpta.org']);

/**
 * A page here and its Weebly counterpart. These five are every page in
 * Weebly's own navigation (checked 2026-10-22); any other path, including the
 * pages Weebly never had, goes to Weebly's homepage.
 */
const WEEBLY_PAGES: Record<string, string> = {
  '/': '/',
  '/little-east': '/little-east.html',
  '/sponsors': '/sponsors.html',
  '/volunteer': '/volunteer.html',
  '/contact': '/contact.html',
  '/calendar': '/calendar.html',
};

/** A last path segment with a dot in it, like rss.xml or robots.txt. */
const FILE = /\/[^/]*\.[a-z0-9]+$/i;

/**
 * Where to send this request on Weebly, or null to serve the new site as usual.
 *
 * `enabled` exists for the checks; the Worker uses the default.
 */
export function weeblyRedirect(url: URL, enabled: boolean = WEEBLY_REDIRECT): string | null {
  if (!enabled || !HOSTS.has(url.hostname)) return null;

  const path = url.pathname.toLowerCase();
  if (FILE.test(path) && !path.endsWith('.html')) return null;

  // /little-east, /little-east/ and /little-east.html are the same page.
  const page = path.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  return WEEBLY + (WEEBLY_PAGES[page] ?? '/');
}

/** The response for a redirect: temporary, and not to be cached anywhere. */
export function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store' },
  });
}
