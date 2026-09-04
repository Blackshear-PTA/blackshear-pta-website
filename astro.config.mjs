// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { fontFamilies } from './src/font-families.mjs';

// Blackshear PTA - PROJECT-BRIEF §3.1 / §3.2
//
// Static by default. Every route is prerendered for now and served straight
// off Cloudflare Workers static assets (see wrangler.jsonc), so there is no
// adapter here and no `main` Worker script. When we need SSR for /api/* or
// /admin, add @astrojs/cloudflare and flip `prerender = false` on those
// routes only - the rest of the site keeps shipping as static assets.

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
