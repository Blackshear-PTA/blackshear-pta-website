import { env } from 'cloudflare:workers';

/**
 * The site's real 404 page, with a real 404 status, from an on-demand route.
 *
 * WHY NOT Astro.rewrite('/404'). Because it does not work here, and it fails in
 * a way that looks like something else. /404 is prerendered - it is a file in
 * dist/client, not a route the server manifest can render - so rewriting to it
 * throws `Unexpectedly unable to find a component instance for route /404`.
 * Astro then runs its error path, which asks the assets binding for an error
 * page, which has no 500.html and so serves 404.html by way of
 * `not_found_handling`. The reader gets the right-looking page with status
 * FIVE HUNDRED, which is wrong for a mistyped URL and, worse, tells a crawler
 * to come back later rather than to drop the address of a deleted post.
 *
 * So: fetch the prerendered page from the assets binding and restate the
 * status. Headers are copied from the asset response rather than built fresh -
 * that is the whole of finding F26, where constructing a new Headers on a gate
 * response silently dropped X-Robots-Tag and everything else public/_headers
 * adds, on the one page a crawler could reach.
 */
export async function notFoundPage(requestUrl: URL): Promise<Response> {
  /**
   * Falls back to a bare 404 if there is no assets binding to ask.
   *
   * Nothing in production reaches that branch - the binding is declared in
   * wrangler.jsonc and the Worker does not start without it. It exists so that
   * a local run against an incomplete environment answers "not found" rather
   * than throwing a second error on top of the first, which is the kind of
   * thing that sends somebody debugging the wrong layer.
   */
  if (!env.ASSETS) return new Response('Not found', { status: 404 });

  const page = await env.ASSETS.fetch(new URL('/404', requestUrl));
  const headers = new Headers(page.headers);
  // A 404 must never be cached as though it were the page somebody asked for.
  headers.set('Cache-Control', 'no-store');
  return new Response(page.body, { status: 404, headers });
}
