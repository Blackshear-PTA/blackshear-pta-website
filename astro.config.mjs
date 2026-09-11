// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { fontFamilies } from './src/font-families.mjs';

// Blackshear PTA - PROJECT-BRIEF §3.1 / §3.2
//
// STILL STATIC BY DEFAULT. `output: 'static'` means a route is prerendered
// unless it says otherwise, and all but four of them do not: the eight
// pages.yaml pages, /calendar, /gallery, /preview, /404 and the rest are built
// once and served straight off Workers static assets with no JS invoked.
//
// The four exceptions all render announcements, which now live in D1 rather
// than in markdown files in git (see migrations/ and finding F41 in TASKS.md).
// They each carry `export const prerender = false`:
//
//   /                          the homepage announcements block
//   /announcements/            the list
//   /announcements/<slug>/     the post
//   /rss.xml                   the feed
//
// The homepage is in that list deliberately. Nothing rebuilds the site when a
// post is published any more, so a prerendered homepage would show whatever
// announcements existed at the last CODE deploy and go quietly stale - which is
// the exact failure F18 records on the old Weebly site. "Live without a
// rebuild" is not true if the front page is not.
//
// The adapter generates its own Worker entry at dist/_worker.js/. It is not
// what wrangler.jsonc points `main` at: the hand-written Worker still owns the
// front door, and calls into that entry. See src/worker.ts.

/**
 * Typefaces - PROJECT-BRIEF §5.1.
 *
 * "The escape is anchoring each theme to a real design tradition with committed
 * typographic choices." The typeface IS most of the difference between one
 * theme and another, so each gets its own pairing.
 *
 * Astro downloads, subsets, self-hosts, and preloads these at build time. No
 * Google Fonts request at runtime - no third-party connection, nothing for a
 * cookie banner to worry about, and no dependency we have to maintain.
 *
 * Weights are deliberately narrow. Every extra weight is another file over a
 * phone connection in a school pickup line.
 *
 * /preview renders both themes but hides one with `display: none`, and
 * browsers do not fetch fonts for display:none subtrees, so a visitor pays
 * for the active theme's two faces, not all four.
 *
 * The family list itself lives in src/font-families.mjs because BaseLayout
 * needs the same list to render an <Font> per family.
 *
 * Applies the shared provider/subset settings to each family in
 * src/font-families.mjs. Written as a helper rather than a .map() over inline
 * literals so `weights` keeps its non-empty-tuple type - Astro's config
 * requires one, and a plain map widens it to number[] and fails the check.
 *
 * @param {{ name: string, cssVariable: string, weights: number[] }} f
 */
const family = (f) => ({
  name: f.name,
  cssVariable: f.cssVariable,
  weights: /** @type {[number, ...number[]]} */ (f.weights),
  provider: fontProviders.google(),
  subsets: /** @type {['latin']} */ (['latin']),
  styles: /** @type {['normal']} */ (['normal']),
  // Generates a metric-matched local fallback so text does not reflow when the
  // webfont lands. Cheap, and it is the difference between a jump and a swap.
  optimizedFallbacks: true,
});

const fonts = fontFamilies.map(family);

/**
 * Where `astro dev` forwards the two paths it cannot serve itself.
 *
 * WHY THIS IS HERE. /admin/api/* and /images/* exist only in the Workers
 * runtime - one is the editor's API, the other reads photos out of R2 - so on
 * :4321 both 404. The page still renders, which is the trap: /admin looks
 * present and merely broken, announcements show missing photos, and neither
 * says the reason is that you are on the wrong port. Forwarding them to the
 * worker means one address does everything, with hot reload intact.
 *
 * Dev only. `vite.server.proxy` has no effect on a build, so the deployed site
 * is untouched - there, the Worker handles both paths directly.
 */
/**
 * Read off globalThis rather than as a bare `process`, because this file is
 * under `// @ts-check` and the repo has no @types/node - one override is not
 * worth a dependency. Override it if WORKER_PORT in dev.config ever moves.
 *
 * @type {{ env?: Record<string, string | undefined> } | undefined}
 */
const proc = /** @type {any} */ (globalThis).process;
const WORKER_ORIGIN = proc?.env?.PTA_WORKER_ORIGIN ?? 'http://127.0.0.1:8787';

/**
 * Turns a connection refused into a sentence.
 *
 * Without this, a dev server running while the worker is not answers these
 * paths with Vite's generic 500, which reads as the editor being broken. The
 * cause is nearly always the same one thing, so it is worth saying outright.
 *
 * `any` because Vite types this as http-proxy's ProxyServer, whose event
 * methods come from Node's EventEmitter - and this repo has no @types/node for
 * that to resolve against, so a precise signature here fails to assign.
 *
 * @param {any} proxy
 */
const explainWorkerDown = (proxy) => {
  proxy.on('error', sendWorkerDown);
};

/**
 * Named rather than inline so its parameters can carry types: `proxy` above is
 * `any`, which makes an inline callback's arguments implicitly `any` too, and
 * this project builds with noImplicitAny.
 *
 * @param {unknown} _error
 * @param {unknown} _request
 * @param {any} response
 */
function sendWorkerDown(_error, _request, response) {
  // Also fires for websocket upgrades, where `response` is a raw socket with no
  // writeHead. Nothing useful to say there, so leave it alone.
  if (!response || typeof response.writeHead !== 'function' || response.headersSent) return;
  response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(
    JSON.stringify({
      error:
        'The Workers runtime is not running, so /admin and announcement photos ' +
        'are unavailable. Start it with `dev worker`, then reload.',
    }),
  );
}

const workerProxy = {
  target: WORKER_ORIGIN,
  // Keeps the Host header as localhost:4321. The Worker derives request.url
  // from it, and its local sign-in only trusts loopback hostnames - so the
  // header has to stay a loopback name, which this is and 127.0.0.1 also is.
  changeOrigin: false,
  configure: explainWorkerDown,
};

export default defineConfig({
  site: 'https://blackshearpta.org',
  output: 'static',
  /**
   * Needed only by the four on-demand routes listed at the top of this file.
   *
   * Each option here is load-bearing and none is the default. Read before
   * changing any of them.
   */
  adapter: cloudflare({
    /**
     * Prerender in Node, not in workerd.
     *
     * The workerd prerenderer works by starting the project's OWN Worker and
     * talking to it over HTTP - and this project's Worker is the pre-launch
     * gate, which answers an unauthenticated request with a redirect. The
     * build's prerender calls therefore get bounced to /under-construction and
     * the build dies on `Unexpected end of JSON input`, which names nothing
     * that would lead you here. Node prerendering keeps the build out of the
     * Worker entirely. See the long note in src/worker.ts.
     *
     * It is also what keeps sharp in the picture, which the next option needs.
     */
    prerenderEnvironment: 'node',
    /**
     * Optimize images at build time with sharp, as this site always has.
     *
     * The adapter's default is to transform images at RUNTIME through the
     * Cloudflare Images binding. That is a product this project has not
     * enabled and would have to stay inside the free allowance of - against the
     * zero-budget constraint - and per F29 a binding for a resource that does
     * not exist fails the whole deploy rather than the feature.
     */
    imageService: 'compile',
    /**
     * ...and when the build does stand up that binding, it must not be called
     * IMAGES. That name is already taken by the R2 bucket holding announcement
     * photos, and two bindings cannot share a name: the build fails with
     * "IMAGES assigned to R2 Bucket and Images bindings".
     */
    imagesBindingName: 'CF_IMAGES',
  }),
  build: {
    // Emit /about/index.html rather than /about.html so Workers' asset
    // handler serves clean URLs without redirect games.
    format: 'directory',
  },
  fonts,
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/admin/api': workerProxy,
        '/images': workerProxy,
      },
    },
  },
});
