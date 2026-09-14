/**
 * Blackshear PTA - the Worker. Two jobs: the pre-launch gate, and handing
 * everything the gate allows through to Astro.
 *
 * WHY THIS FILE IS STILL THE ENTRY POINT.
 *
 * Announcements render on demand now, which means @astrojs/cloudflare, which
 * generates its own Worker at dist/server/entry.mjs. The obvious move would be
 * to point wrangler.jsonc's "main" at that and delete this file - and it would
 * delete the gate with it.
 *
 * The gate cannot move into Astro middleware, which is the normal place for
 * "run this before every request". Middleware runs for routes Astro renders;
 * all but four routes here are prerendered files served straight off the assets
 * binding, and those are exactly the pages the gate exists to keep people out
 * of. A gate that only covered /announcements would be no gate.
 *
 * So the arrangement is the other way round: this file owns the front door, and
 * calls Astro's handler for anything it lets past. Astro then does what it
 * always does - render the four on-demand routes, hand everything else to
 * ASSETS.
 *
 * This is a supported shape, not a workaround. @astrojs/cloudflare builds
 * through @cloudflare/vite-plugin, which takes wrangler.jsonc's "main" as THE
 * Worker and compiles it - so this file is the entry, and
 * `@astrojs/cloudflare/entrypoints/server` is the published handler to hand off
 * to. (The adapter exports the same thing in smaller pieces for Hono.)
 *
 * ONE NON-OBVIOUS CONSEQUENCE, worth writing down because it cost an hour.
 * That handler also implements the protocol the adapter's *workerd* prerenderer
 * speaks at build time, over ordinary HTTP requests to this Worker. The gate
 * below answers a request with no unlock cookie by redirecting it, so with
 * `prerenderEnvironment: 'workerd'` the build's own prerender requests get
 * redirected to /under-construction and the build dies on a truncated JSON
 * response that names nothing relevant. astro.config.mjs pins
 * `prerenderEnvironment: 'node'`, which keeps prerendering out of this Worker
 * entirely. Do not change it without reading this paragraph.
 *
 * TEMPORARY: the gate itself (TASKS.md A29). At cutover, delete the gate branch
 * below and "run_worker_first" in wrangler.jsonc. This file stays, because the
 * hand-off to Astro is now permanent.
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
 * /admin is exempt from this gate - see the router below. It has its own,
 * stronger auth (Cloudflare Access), and it has to keep working after the gate
 * is deleted at cutover.
 *
 * WHY THE WORKER RUNS FIRST: with static assets, Cloudflare serves a matching
 * file before invoking JS unless assets.run_worker_first is set. Without that
 * flag this file would never run for /index.html and the gate would be purely
 * decorative. The cost is that asset hits now count against the Workers request
 * quota (100k/day free, which this site will not approach) - and that reverses
 * on its own when the gate is removed.
 */

import { handleAdminApi, isAdminPath, type AdminEnv } from './worker/admin';
import { isImagePath, serveImage, type ImageEnv } from './worker/images';
import astro from '@astrojs/cloudflare/entrypoints/server';

interface Env extends AdminEnv, ImageEnv {
  ASSETS: Fetcher;
  /** Set as a Cloudflare secret. Absent means "fail closed"; see above. */
  SITE_PASSWORD?: string;
}

/**
 * Hands a request to Astro: the four on-demand routes get rendered, everything
 * else falls through to the static assets binding inside the adapter's entry.
 *
 * Everywhere this appears used to read `env.ASSETS.fetch(request)`. That is
 * still what happens for a prerendered page - it just happens one layer in,
 * where the adapter can decide.
 */
function toAstro(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  /**
   * The cast is over optionality, not shape.
   *
   * `wrangler types` generates a global Env where every declared binding is
   * required, because at runtime it is - a Worker whose bindings are missing
   * does not start (F29). The interfaces in this repo mark them optional on
   * purpose, so that each feature has to decide out loud what it does when its
   * binding is absent and can answer with a sentence instead of a stack trace.
   *
   * Both describe the same object. Nothing is being asserted here that the
   * platform does not already guarantee.
   */
  return astro.fetch(request, env as unknown as Parameters<typeof astro.fetch>[1], ctx);
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Hashed build output. Straight to the assets binding, ahead of the gate and
    // ahead of Astro's routing - there is nothing for either to decide about a
    // fingerprinted stylesheet.
    if (isPublicAsset(url.pathname)) return env.ASSETS.fetch(request);
    if (url.pathname === UNLOCK_PATH) return handleUnlock(request, env);

    /**
     * /admin is exempt from the pre-launch gate, and must be.
     *
     * It sits behind Cloudflare Access with a real identity provider, which is
     * strictly stronger than a shared password. Making a board member type the
     * preview password as well would be friction with no security value - and
     * worse, it would mean the editor stops working the day the gate is removed
     * at cutover, which is precisely when it starts mattering most.
     */
    if (isAdminPath(url.pathname)) {
      if (url.pathname.startsWith('/admin/api')) return handleAdminApi(request, env, url);
      return toAstro(request, env, ctx);
    }

    /**
     * Announcement photos out of R2.
     *
     * Deliberately ahead of the gate, so this route does not have to be
     * untangled from it at cutover - deleting the gate below leaves this
     * working untouched. Nothing leaks by doing so: keys are 128 bits of
     * content hash, they are only ever linked from pages that are themselves
     * gated, and the gate was never a security boundary in the first place.
     */
    if (isImagePath(url.pathname)) {
      if (!env.IMAGES) return new Response('Not found', { status: 404 });
      return serveImage(env.IMAGES, url.pathname);
    }

    const expected = env.SITE_PASSWORD ? await sha256Hex(env.SITE_PASSWORD) : null;
    const presented = readCookie(request, COOKIE);
    const unlocked =
      expected !== null && presented !== null && timingSafeEqual(presented, expected);

    if (unlocked) return toAstro(request, env, ctx);

    // The gate page has to be reachable while gated, or this redirects forever.
    if (url.pathname === GATE_PATH || url.pathname === '/under-construction') {
      const page = await toAstro(request, env, ctx);
      // Copy the asset server's headers and override one, rather than building a
      // fresh set. Constructing a new Headers from scratch here silently dropped
      // everything public/_headers adds - including the site-wide
      // X-Robots-Tag: noindex - on the ONE page a crawler can actually reach,
      // which is the worst possible page to lose it on. The <meta> tag in
      // BaseLayout still covered it, so nothing was indexed, but the whole point
      // of having both is that neither is load-bearing alone.
      const headers = new Headers(page.headers);
      // Never cache the gate: an unlocked visitor must not be served it, and a
      // locked one must not be served a stale copy of the page behind it.
      headers.set('Cache-Control', 'no-store');
      return new Response(page.body, { status: 200, headers });
    }

    return toGate(url.origin, url.pathname + url.search);
  },
};
