// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { fontFamilies } from './src/font-families.mjs';

// Blackshear PTA — PROJECT-BRIEF §3.1 / §3.2
//
// Static by default. Every route is prerendered for now and served straight
// off Cloudflare Workers static assets (see wrangler.jsonc), so there is no
// adapter here and no `main` Worker script. When we need SSR for /api/* or
// /admin, add @astrojs/cloudflare and flip `prerender = false` on those
// routes only — the rest of the site keeps shipping as static assets.

/**
 * Typefaces — PROJECT-BRIEF §5.1.
 *
 * "The escape is anchoring each theme to a real design tradition with committed
 * typographic choices." The typeface IS most of the difference between six
 * themes and six recolors, so each theme gets its own pairing.
 *
 * Astro downloads, subsets, self-hosts, and preloads these at build time. No
 * Google Fonts request at runtime — no third-party connection, nothing for a
 * cookie banner to worry about, and no dependency we have to maintain.
 *
 * Weights are deliberately narrow. Every extra weight is another file over a
 * phone connection in a school pickup line.
 *
 * /preview renders all six themes but hides five with `display: none`, and
 * browsers do not fetch fonts for display:none subtrees — so a visitor pays
 * for the active theme's two faces, not all ten.
 *
 * The family list itself lives in src/font-families.mjs because BaseLayout
 * needs the same list to render an <Font> per family.
 *
 * Applies the shared provider/subset settings to each family in
 * src/font-families.mjs. Written as a helper rather than a .map() over inline
 * literals so `weights` keeps its non-empty-tuple type — Astro's config
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
  },
});
