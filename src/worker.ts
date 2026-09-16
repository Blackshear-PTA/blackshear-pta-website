/**
 * Blackshear PTA - request router in front of the static site.
 *
 * The pre-launch gate that this file originally existed for is GONE (cutover,
 * TASKS.md A29/A31). What remains are the two routes that were always going to
 * outlive it, and they are not temporary:
 *
 *   /admin, /admin/api/*  - the content editor (A23). Cloudflare Access sits in
 *                           front of it at the edge, and worker/admin.ts
 *                           re-verifies the signed identity itself so a commit
 *                           carries the editor's address.
 *   /images/*             - announcement photos out of R2 (worker/images.ts).
 *
 * Everything else falls through to the static assets untouched.
 *
 * WHY "main" AND "run_worker_first" STAY IN wrangler.jsonc. A29 said to delete
 * both at cutover and let the site go back to pure static assets. That was
 * written when this file was only the gate, and it is no longer safe: assets are
 * configured with `not_found_handling: "404-page"`, so with the Worker no longer
 * running first, a request to /admin/api/* - which has no matching file - risks
 * being answered with the 404 page instead of reaching this router. Keeping both
 * costs asset requests against the Workers quota (100k/day free; this site does
 * not approach it) and keeps the editor working. Revisit if the admin routes
 * ever move to @astrojs/cloudflare.
 */

import { handleAdminApi, isAdminPath, type AdminEnv } from './worker/admin';
import { isImagePath, serveImage, type ImageEnv } from './worker/images';

interface Env extends AdminEnv, ImageEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    /**
     * /admin sits behind Cloudflare Access with a real identity provider. The
     * page itself is a static asset; only the API needs this Worker.
     */
    if (isAdminPath(url.pathname)) {
      if (url.pathname.startsWith('/admin/api')) return handleAdminApi(request, env, url);
      return env.ASSETS.fetch(request);
    }

    /**
     * Announcement photos out of R2. Keys are 128 bits of content hash, so the
     * URL is the capability - these were always served to anyone holding a link.
     */
    if (isImagePath(url.pathname)) {
      if (!env.IMAGES) return new Response('Not found', { status: 404 });
      return serveImage(env.IMAGES, url.pathname);
    }

    return env.ASSETS.fetch(request);
  },
};
