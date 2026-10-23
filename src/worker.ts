/**
 * Blackshear PTA - the Worker. Owns the front door and hands off to Astro.
 *
 * WHY THIS FILE IS THE ENTRY POINT.
 *
 * Announcements render on demand, which means @astrojs/cloudflare, which
 * generates its own Worker at dist/server/entry.mjs. wrangler.jsonc's "main"
 * could point straight at that - but then the three routes below would have
 * nowhere to live, because they are not Astro routes:
 *
 *   /admin/api/*  - the editor's API (A23). Cloudflare Access sits in front of
 *                   it at the edge, and worker/admin.ts re-verifies the signed
 *                   identity itself so a write carries the editor's address.
 *   /images/*     - announcement photos out of R2 (worker/images.ts).
 *   /_astro/*     - hashed build output, straight to the assets binding.
 *
 * So the arrangement is the other way round: this file owns the front door and
 * calls Astro's handler for anything it does not claim. Astro then does what it
 * always does - render the on-demand routes, hand everything else to ASSETS.
 *
 * This is a supported shape, not a workaround. @astrojs/cloudflare builds
 * through @cloudflare/vite-plugin, which takes wrangler.jsonc's "main" as THE
 * Worker and compiles it - so this file is the entry, and
 * `@astrojs/cloudflare/entrypoints/server` is the published handler to hand off
 * to. (The adapter exports the same thing in smaller pieces for Hono.)
 *
 * THE PRE-LAUNCH GATE IS GONE (cutover, TASKS.md A33). It used to sit in this
 * file, and two notes it left behind are worth correcting rather than deleting:
 *
 *   - A29 said cutover meant deleting this whole file. That stopped being true
 *     once /admin and /images landed here, and stopped being true twice over
 *     once the adapter made "main" permanent. See F49.
 *   - The gate was one reason astro.config.mjs pins `prerenderEnvironment:
 *     'node'`: its redirects broke the adapter's workerd prerenderer at build
 *     time. That reason is now moot, but the pin STAYS - it is also what keeps
 *     sharp doing build-time image optimization. Read the note there before
 *     touching it.
 *
 * ONE THING THIS FILE HAS TO DO THAT public/_headers CANNOT. That file is
 * applied by Cloudflare's STATIC ASSET server, so it only reaches responses
 * that come off the assets binding. The four on-demand routes are rendered by
 * the Worker and never touch it, so they silently lost `X-Robots-Tag`,
 * `X-Content-Type-Options` and `Referrer-Policy` when they stopped being files
 * (TASKS.md F52). `withSiteHeaders` below puts them back.
 *
 * WHY "run_worker_first" STAYS in wrangler.jsonc, though the gate is what
 * originally needed it: assets are configured `not_found_handling: "404-page"`,
 * and /admin/api/* matches no file, so a Worker that does not run first risks
 * those calls being answered by the built 404 page instead of reaching this
 * router. The cost is that asset hits count against the Workers request quota
 * (100k/day free, which this site will not approach).
 */

import { handleAdminApi, isAdminPath, type AdminEnv } from './worker/admin';
import { isImagePath, serveImage, type ImageEnv } from './worker/images';
import astro from '@astrojs/cloudflare/entrypoints/server';

interface Env extends AdminEnv, ImageEnv {
  ASSETS: Fetcher;
}

/**
 * Served straight off the assets binding, ahead of Astro's routing - there is
 * nothing for it to decide about a fingerprinted stylesheet or a favicon.
 */
function isPublicAsset(pathname: string): boolean {
  return pathname.startsWith('/_astro/') || pathname.startsWith('/favicon.');
}

/**
 * The headers public/_headers sets on every static asset, restated for the
 * responses this Worker renders itself.
 *
 * Kept deliberately identical to that file. If you change one, change both -
 * and delete the `X-Robots-Tag` line from BOTH as part of the cutover (A6),
 * along with the <meta name="robots"> in BaseLayout. Three mechanisms, and the
 * whole point is that no single one is load-bearing.
 */
const SITE_HEADERS: Record<string, string> = {
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Adds those headers to a response that does not already carry them.
 *
 * Only when absent: a prerendered page reaches here having already been through
 * the asset server, which applied public/_headers, and a route that sets one of
 * these deliberately should keep its own value.
 */
function withSiteHeaders(response: Response): Response {
  let missing = false;
  for (const name of Object.keys(SITE_HEADERS)) {
    if (!response.headers.has(name)) { missing = true; break; }
  }
  if (!missing) return response;

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SITE_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  // A 101 or 204 has no body and rejects one; everything here is an ordinary
  // rendered response, but constructing it this way keeps that true by shape.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Hands a request to Astro: the on-demand routes get rendered, everything else
 * falls through to the static assets binding inside the adapter's entry.
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
  return astro
    .fetch(request, env as unknown as Parameters<typeof astro.fetch>[1], ctx)
    .then(withSiteHeaders);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (isPublicAsset(url.pathname)) return env.ASSETS.fetch(request);

    /**
     * /admin sits behind Cloudflare Access with a real identity provider. Only
     * the API needs this Worker; the page itself is an Astro route.
     */
    if (isAdminPath(url.pathname)) {
      if (url.pathname.startsWith('/admin/api')) return handleAdminApi(request, env, url);
      return toAstro(request, env, ctx);
    }

    /**
     * Announcement photos out of R2. Keys are 128 bits of content hash, so the
     * URL is the capability - these were always served to anyone holding a link.
     */
    if (isImagePath(url.pathname)) {
      if (!env.IMAGES) return new Response('Not found', { status: 404 });
      return serveImage(env.IMAGES, url.pathname);
    }

    return toAstro(request, env, ctx);
  },
};
