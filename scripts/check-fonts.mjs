/**
 * Blackshear PTA - font wiring gate.
 *
 * Three files have to agree about typefaces, and when they disagree the page
 * still renders, which is what makes it dangerous:
 *
 *   src/font-families.mjs    the families Astro downloads and subsets
 *   src/themes/<id>.css      var(--font-*) references in the theme's tokens
 *   src/themes/registry.ts   theme.fonts, which decides what gets preloaded
 *
 * This has already bitten this project twice. Once when a family was in the
 * Astro config but no <Font> was rendered, so --font-* was undefined, the whole
 * var() chain went invalid, and every theme silently rendered in the browser
 * default while looking perfectly plausible. Again when the preload list was
 * introduced and could drift from the CSS - preloading a face the page never
 * paints is wasted bytes, and missing one brings back the layout shift the
 * preload existed to remove.
 *
 * None of that shows up in a screenshot, so it gets a build gate instead.
 *
 * Run: npm run check:fonts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fontFamilies } from '../src/font-families.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesDir = join(root, 'src/themes');

const declared = new Set(fontFamilies.map((f) => f.cssVariable));
const failures = [];
const checks = [];

/** theme.fonts as written in the registry, keyed by theme id. */
function parseRegistry() {
  const src = readFileSync(join(themesDir, 'registry.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const themes'), src.indexOf('export const siteThemeId'));
  const out = new Map();
  for (const block of body.split(/\}\s*,?\s*(?=\{|\];)/)) {
    const id = block.match(/id:\s*'([^']+)'/)?.[1];
    if (!id) continue;
    const list = block.match(/fonts:\s*\[([^\]]*)\]/)?.[1] ?? '';
    out.set(id, [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]));
  }
  return out;
}

/** var(--font-*) actually referenced by a theme's CSS. */
function parseThemeCss(file) {
  const css = readFileSync(join(themesDir, file), 'utf8');
  return [...css.matchAll(/var\((--font-[a-z0-9-]+)\)/g)].map((m) => m[1]);
}

const registry = parseRegistry();
const cssFiles = readdirSync(themesDir).filter((f) => f.endsWith('.css') && f !== 'themes.css');

for (const file of cssFiles) {
  const id = file.replace(/\.css$/, '');
  const used = [...new Set(parseThemeCss(file))];
  const listed = registry.get(id);

  if (!listed) {
    failures.push(`${id}: has a CSS file but no entry in registry.ts`);
    continue;
  }

  for (const v of used) {
    if (!declared.has(v)) {
      failures.push(`${id}.css references ${v}, which is not in font-families.mjs`);
    }
  }

  const missing = used.filter((v) => !listed.includes(v));
  const extra = listed.filter((v) => !used.includes(v));
  if (missing.length) failures.push(`${id}: CSS uses ${missing.join(', ')} but registry.fonts omits it`);
  if (extra.length) failures.push(`${id}: registry.fonts lists ${extra.join(', ')} but the CSS never uses it`);

  checks.push(`  ${failures.length ? ' ' : 'ok'}   ${id.padEnd(22)} ${used.join(', ')}`);
}

// Every declared family should be used by something, or it is dead weight
// being downloaded and subsetted at build time for nothing.
const usedAnywhere = new Set(cssFiles.flatMap(parseThemeCss));
for (const v of declared) {
  if (!usedAnywhere.has(v)) {
    failures.push(`${v} is in font-families.mjs but no theme uses it - remove it or wire it up`);
  }
}

console.log(checks.join('\n'));
console.log(`\n${cssFiles.length} themes, ${declared.size} families declared.`);

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log('Font wiring consistent across font-families.mjs, theme CSS and registry.ts.');
