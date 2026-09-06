/**
 * WCAG 2.1 contrast gate for every theme.
 *
 * PROJECT-BRIEF §5.3: "A theme that can't clear AA gets cut regardless of how
 * good it looks." This makes that a build step rather than an intention.
 *
 * Parses each [data-theme="..."] block in src/themes/*.css, resolves the
 * --pta-* color tokens, and checks the pairings that actually carry text.
 * Exits non-zero on any failure.
 *
 *   node scripts/check-contrast.mjs      (or: npm run check:contrast)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const THEME_DIR = 'src/themes';
const GLOBAL_CSS = 'src/styles/global.css';

/** Pairings that put text on a ground. [foreground, background, label, minimum] */
const PAIRS = [
  ['--pta-ink', '--pta-surface', 'body text on surface', 4.5],
  ['--pta-ink-muted', '--pta-surface', 'muted text on surface', 4.5],
  ['--pta-link', '--pta-surface', 'links on surface', 4.5],
  ['--pta-ink', '--pta-surface-alt', 'body text on alt surface', 4.5],
  ['--pta-ink-on-accent', '--pta-accent', 'text on accent', 4.5],
  ['--pta-header-ink', '--pta-header-bg', 'header text', 4.5],
  ['--pta-header-ink-muted', '--pta-header-bg', 'header muted text', 4.5],
  ['--pta-cta-ink', '--pta-cta-bg', 'primary action label', 4.5],
  ['--pta-mark-ring', '--pta-mark-ground', 'mascot disc ring', 3.0], // graphical object
];

const srgb = (c) => {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

/**
 * CSS composites in sRGB space, not linear light, so mix the channels before
 * converting. Returns the scrim laid over pure black at the given alpha, which
 * is the darkest ground any text in the band can land on.
 */
function overBlack(scrimHex, alpha) {
  const h = scrimHex.replace('#', '');
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) * alpha);
  return '#' + ch.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function ratio(a, b) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Pulls `--token: #hex;` declarations out of each [data-theme="id"] { ... } block. */
function parseThemes(css) {
  const out = {};
  const blocks = css.matchAll(/\[data-theme="([\w-]+)"\]\s*\{([^}]*)\}/g);
  for (const [, id, body] of blocks) {
    out[id] ??= {};
    for (const [, prop, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const v = value.trim();
      const hex = v.match(/^#[0-9a-fA-F]{3,8}$/);
      if (hex) out[id][prop] = hex[0];
      // The band alpha is a bare number, not a color, but the gate needs it.
      else if (prop === '--pta-topband-alpha' && /^[\d.]+$/.test(v)) out[id][prop] = v;
    }
  }
  return out;
}

/**
 * Resolve the :root defaults from global.css first, then layer each theme on
 * top. A theme only overrides what it wants to change, so checking the
 * [data-theme] block alone would silently skip every inherited token, and a
 * skipped check reads like a pass in the summary line.
 *
 * :root values are written as var(--color-brand-*), so the @theme primitives
 * have to be resolved before they mean anything.
 */
function parseBaseTokens(css) {
  const primitives = {};
  const themeBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  if (themeBlock) {
    for (const [, prop, value] of themeBlock[1].matchAll(/(--color-[\w-]+)\s*:\s*([^;]+);/g)) {
      const hex = value.trim().match(/^#[0-9a-fA-F]{3,8}$/);
      if (hex) primitives[prop] = hex[0];
    }
  }
  const base = {};
  const rootBlock = css.match(/\n:root\s*\{([\s\S]*?)\n\}/);
  if (rootBlock) {
    for (const [, prop, raw] of rootBlock[1].matchAll(/(--pta-[\w-]+)\s*:\s*([^;]+);/g)) {
      const value = raw.trim();
      const direct = value.match(/^#[0-9a-fA-F]{3,8}$/);
      if (direct) { base[prop] = direct[0]; continue; }
      // Bare number, not a color. Without this the band checks silently skip
      // any theme that inherits the default alpha rather than setting its own,
      // which is the common case and reads as a pass in the summary.
      if (/^[\d.]+$/.test(value)) { base[prop] = value; continue; }
      const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
      if (ref && primitives[ref[1]]) base[prop] = primitives[ref[1]];
    }
  }
  return base;
}

const baseTokens = parseBaseTokens(readFileSync(GLOBAL_CSS, 'utf8'));

const themes = {};
for (const file of readdirSync(THEME_DIR).filter((f) => f.endsWith('.css') && f !== 'themes.css')) {
  for (const [id, tokens] of Object.entries(parseThemes(readFileSync(join(THEME_DIR, file), 'utf8')))) {
    themes[id] = { ...baseTokens, ...(themes[id] ?? {}), ...tokens };
  }
}

let failures = 0;
let checks = 0;
const skipped = [];

for (const [id, tokens] of Object.entries(themes)) {
  const rows = [];
  for (const [fg, bg, label, min] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      skipped.push(`${id}: ${label} (unresolved token)`);
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    checks++;
    if (!ok) failures++;
    rows.push(
      `  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(26)} ${r.toFixed(2).padStart(6)}:1  (min ${min})`,
    );
  }
  // ── The photographic top band ──────────────────────────────────────────
  // Text there sits on a scrim over a photograph, not on a flat color, so the
  // pairs above say nothing about it. Both source photos contain true black,
  // so the worst case is a text run landing over a pure-black pixel: composite
  // the scrim over black at the theme's alpha and check against that. Anything
  // brighter in the photo can only improve the result.
  //
  // This exists because the scrim alpha looks like a taste setting. It is not.
  // Nudging it down to make the photo read better is exactly the change that
  // would silently break AA, and it would break it only on the crops where a
  // shadow happens to fall under a paragraph.
  const alpha = Number(tokens['--pta-topband-alpha']);
  const scrim = tokens['--pta-topband-scrim'];
  if (Number.isFinite(alpha) && scrim) {
    const worst = overBlack(scrim, alpha);
    for (const [fg, label] of [
      ['--pta-ink', 'band: body text'],
      ['--pta-ink-muted', 'band: muted text'],
      ['--pta-link', 'band: links'],
    ]) {
      if (!tokens[fg]) continue;
      const r = ratio(tokens[fg], worst);
      const ok = r >= 4.5;
      checks++;
      if (!ok) failures++;
      rows.push(
        `  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(26)} ${r.toFixed(2).padStart(6)}:1  (min 4.5, scrim ${scrim} @ ${alpha} over black)`,
      );
    }
  }

  console.log(`\n${id}`);
  console.log(rows.join('\n'));
}

if (skipped.length) {
  console.log(`\nSkipped (token not a literal hex - check by hand):`);
  for (const s of skipped) console.log(`  - ${s}`);
}

console.log(
  `\n${checks} checks across ${Object.keys(themes).length} themes - ${failures} failing.`,
);

if (failures > 0) {
  console.error('\nContrast gate FAILED. See PROJECT-BRIEF §5.3 - this is not advisory.');
  process.exit(1);
}
