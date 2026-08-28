// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Blackshear PTA — PROJECT-BRIEF §3.1 / §3.2
//
// Static by default. Every route is prerendered for now and served straight
// off Cloudflare Workers static assets (see wrangler.jsonc), so there is no
// adapter here and no `main` Worker script. When we need SSR for /api/* or
// /admin, add @astrojs/cloudflare and flip `prerender = false` on those
// routes only — the rest of the site keeps shipping as static assets.
export default defineConfig({
  site: 'https://blackshearpta.org',
  output: 'static',
  build: {
    // Emit /about/index.html rather than /about.html so Workers' asset
    // handler serves clean URLs without redirect games.
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
