/**
 * WCAG 2.1 contrast gate for every theme.
 *
 * PROJECT-BRIEF §5.3: "A theme that can't clear AA gets cut regardless of how
 * good it looks." This makes that a build step rather than an intention.
 *
 * Parses each [data-theme="..."] block in src/themes/*.css, resolves the
 * --pta-* colour tokens, and checks the pairings that actually carry text.
 * Exits non-zero on any failure.
 *
 *   node scripts/check-contrast.mjs      (or: npm run check:contrast)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const THEME_DIR = 'src/themes';

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
  ['--pta-mark-ink', '--pta-mark-body', 'mark banding', 3.0], // graphical object
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
      const hex = value.trim().match(/^#[0-9a-fA-F]{3,8}$/);
      if (hex) out[id][prop] = hex[0];
    }
  }
  return out;
}

const themes = {};
for (const file of readdirSync(THEME_DIR).filter((f) => f.endsWith('.css') && f !== 'themes.css')) {
  Object.assign(themes, parseThemes(readFileSync(join(THEME_DIR, file), 'utf8')));
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
  console.log(`\n${id}`);
  console.log(rows.join('\n'));
}

if (skipped.length) {
  console.log(`\nSkipped (token not a literal hex — check by hand):`);
  for (const s of skipped) console.log(`  - ${s}`);
}

console.log(
  `\n${checks} checks across ${Object.keys(themes).length} themes — ${failures} failing.`,
);

if (failures > 0) {
  console.error('\nContrast gate FAILED. See PROJECT-BRIEF §5.3 — this is not advisory.');
  process.exit(1);
}
