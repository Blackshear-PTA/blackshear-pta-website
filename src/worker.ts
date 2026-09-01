/**
 * Blackshear PTA - pre-launch gate.
 *
 * TEMPORARY. Delete this file and the "main"/"run_worker_first" lines in
 * wrangler.jsonc at cutover (TASKS.md A29). Everything else keeps working.
 *
 * WHAT IT IS: one shared password, held by the e-board, so people who wander
 * onto blackshearpta.org before launch land on "we are still building, here is
 * the current site" instead of a half-finished PTA site they mistake for real.
 *
 * WHAT IT IS NOT: a security boundary. There is nothing confidential here, and
 * a shared password that a dozen people know is a speed bump by construction.
 * Treat everything behind it as public. The real access control for /admin in
 * Phase 2 is Cloudflare Access with Google SSO (D1), not this.
 *
 * THE PASSWORD IS NOT IN THIS REPO, and must not be - the repo is public, so a
 * committed password is no password. It lives in the SITE_PASSWORD secret:
 *
 *   npx wrangler secret put SITE_PASSWORD
 *
 * or Cloudflare dashboard -> Workers & Pages -> blackshear-pta -> Settings ->
 * Variables and Secrets -> Add -> type "Secret". Secrets are set on the Worker,
 * so branch previews inherit the same one.
 *
 * If the secret is missing the gate FAILS CLOSED - nobody gets in, including
 * us. That is deliberate: a site that is ungated while everyone believes it is
 * gated is the one outcome worse than having no gate at all.
 *
 * WHY THE WORKER RUNS FIRST: with static assets, Cloudflare serves a matching
 * file before invoking JS unless assets.run_worker_first is set. Without that
 * flag this file would never run for /index.html and the gate would be purely
 * decorative. The cost is that asset hits now count against the Workers request
 * quota (100k/day free, which this site will not approach) - and that reverses
 * on its own when the gate is removed.
 */

interface Env {
  ASSETS: Fetcher;
  /** Set as a Cloudflare secret. Absent means "fail closed"; see above. */
  SITE_PASSWORD?: string;
}

const COOKIE = 'pta_access';
const GATE_PATH = '/under-construction/';
const UNLOCK_PATH = '/__unlock';
/** 30 days. Short enough to expire after launch, long enough not to nag. */
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Served without the gate. Build output only: hashed CSS, JS and font files.
 * The gate page needs its own stylesheet and typefaces to render in-theme, and
 * a gate that ships unstyled reads as a broken site rather than a deliberate
 * one. These files carry no page content.
 */
function isPublicAsset(pathname: string): boolean {
  return pathname.startsWith('/_astro/') || pathname.startsWith('/favicon.');
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compares in time independent of how many leading characters match. Both
 * arguments here are fixed-length hex digests, so the length check leaks
 * nothing about the password.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * Same-origin paths only. A protocol-relative "//example.com" is a perfectly
 * valid URL to a browser, so echoing `next` back into a Location header without
 * this check turns the unlock endpoint into an open redirect.
 */
function safeNext(value: unknown): string {
  const next = typeof value === 'string' ? value : '';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

function redirect(to: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: to, 'Cache-Control': 'no-store' },
  });
}

function toGate(origin: string, next: string, error?: string): Response {
  const url = new URL(GATE_PATH, origin);
  if (error) url.searchParams.set('e', error);
  if (next !== '/') url.searchParams.set('next', next);
  return redirect(url.toString());
}

async function handleUnlock(request: Request, env: Env): Promise<Response> {
  const { origin } = new URL(request.url);
  if (request.method !== 'POST') return toGate(origin, '/');

  const form = await request.formData();
  const next = safeNext(form.get('next'));

  if (!env.SITE_PASSWORD) return toGate(origin, next, 'unset');

  // Hash both sides rather than comparing raw strings, so the comparison is
  // over two fixed-length digests and cannot leak the password's length.
  const expected = await sha256Hex(env.SITE_PASSWORD);
  const supplied = await sha256Hex(String(form.get('password') ?? ''));
  if (!timingSafeEqual(supplied, expected)) return toGate(origin, next, 'bad');

  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(next, origin).toString(),
      // The digest, not the password: no point leaving the plaintext sitting in
      // a cookie jar when a value derived from it verifies just as well.
      'Set-Cookie':
        `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (isPublicAsset(url.pathname)) return env.ASSETS.fetch(request);
    if (url.pathname === UNLOCK_PATH) return handleUnlock(request, env);

    const expected = env.SITE_PASSWORD ? await sha256Hex(env.SITE_PASSWORD) : null;
    const presented = readCookie(request, COOKIE);
    const unlocked =
      expected !== null && presented !== null && timingSafeEqual(presented, expected);

    if (unlocked) return env.ASSETS.fetch(request);

    // The gate page has to be reachable while gated, or this redirects forever.
    // no-store so an unlocked visitor never gets a cached copy of the gate.
    if (url.pathname === GATE_PATH || url.pathname === '/under-construction') {
      const page = await env.ASSETS.fetch(request);
      return new Response(page.body, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return toGate(url.origin, url.pathname + url.search);
  },
};
