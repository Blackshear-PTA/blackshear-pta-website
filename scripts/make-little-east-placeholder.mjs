/**
 * The "poster coming soon" stand-in for this year's Little EAST page, until
 * the real 2026 poster exists (TASKS.md A40). Jon asked for something that
 * says "to be revealed soon!" and looks creative and fun.
 *
 * Just the words, in the site's colours: the masthead's black band and lemon
 * rule with the event's name, "POSTER TO BE REVEALED SOON!" across the
 * middle on a slightly canted black strip, the theme, and the date in the
 * brand blue. A first draft had Buzz in a clock face inside a spiral of rings;
 * Jon preferred the plain version (2026-10-23). When the real poster arrives,
 * it replaces this file's entry in src/content/pages.yaml and this script can
 * be deleted.
 *
 * Type is set as paths from the fonts in Astro's font cache, which exists
 * after one build, so the result does not depend on the fonts the rendering
 * machine happens to have. The colours are the palette in
 * assets/brand/README.md.
 *
 *   node scripts/make-little-east-placeholder.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkitten';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'src/assets/little-east/2026/poster-coming-soon.png');

// 3:4, like the posters it stands in for, and big enough to stay sharp in the
// lightbox.
const W = 1200;
const H = 1600;

// Palette, from assets/brand/README.md.
const BLUE = '#0048A8';
const YELLOW = '#F0E430';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

function findFont(family) {
  const dir = path.join(root, 'node_modules/.astro/fonts');
  for (const f of fs.readdirSync(dir)) {
    try {
      const font = create(fs.readFileSync(path.join(dir, f)));
      if (font.familyName === family) return font;
    } catch {
      // Not a font file, or not one fontkitten reads; keep looking.
    }
  }
  throw new Error(`${family} not found in node_modules/.astro/fonts. Run \`npm run build\` once first.`);
}

/** One line of type as SVG paths, baseline at y = 0, from x = 0. As in make-workspace-logo.mjs. */
function setLine(font, text, sizePx, trackingEm = 0) {
  const scale = sizePx / font.unitsPerEm;
  const glyphs = font.glyphsForString(text);
  const parts = [];
  let x = 0;
  glyphs.forEach((glyph, i) => {
    const d = glyph.path.toSVG();
    if (d) {
      parts.push(`<path transform="translate(${(x * scale).toFixed(2)} 0) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" d="${d}"/>`);
    }
    x += glyph.advanceWidth + (i < glyphs.length - 1 ? trackingEm * font.unitsPerEm : 0);
  });
  return { svg: parts.join(''), width: x * scale, capHeight: font.capHeight * scale };
}

/** A line of type centred on x, baseline at y, fitted to maxWidth if it would overflow. */
function centred(font, text, sizePx, x, y, fill, { trackingEm = 0, maxWidth = Infinity } = {}) {
  let line = setLine(font, text, sizePx, trackingEm);
  if (line.width > maxWidth) line = setLine(font, text, (sizePx * maxWidth) / line.width, trackingEm);
  return `<g fill="${fill}" transform="translate(${(x - line.width / 2).toFixed(2)} ${y.toFixed(2)})">${line.svg}</g>`;
}

function compose() {
  const bevan = findFont('Bevan');
  const archivo = findFont('Archivo SemiBold'); // the cached cut is SemiBold
  const cx = W / 2;

  // Top band: black, like the site's masthead, with its lemon rule.
  const BAND = 300;
  const top = `
    <rect width="${W}" height="${BAND}" fill="${BLACK}"/>
    <rect y="${BAND}" width="${W}" height="18" fill="${YELLOW}"/>
    ${centred(archivo, 'THE 13TH ANNUAL', 46, cx, 92, YELLOW, { trackingEm: 0.12 })}
    ${centred(bevan, 'LITTLE EAST', 150, cx, 245, WHITE, { trackingEm: 0.01, maxWidth: W - 120 })}`;

  // The one thing the poster says, across the middle of the yellow field.
  const sticker = `
    <g transform="translate(${cx} 840) rotate(-4)">
      <rect x="-560" y="-110" width="1120" height="220" rx="26" fill="${BLACK}"/>
      ${centred(bevan, 'POSTER TO BE REVEALED SOON!', 96, 0, 34, YELLOW, { maxWidth: 1010 })}
    </g>`;

  const theme = centred(archivo, 'THIS YEAR\u2019S THEME: TIME WARP', 44, cx, 1100, BLACK, { trackingEm: 0.08 });

  // Bottom band: the date, in the brand blue.
  const FOOT = 140;
  const foot = `
    <rect y="${H - FOOT}" width="${W}" height="${FOOT}" fill="${BLUE}"/>
    ${centred(archivo, 'SATURDAY, NOVEMBER 14, 2026  \u00B7  11AM TO 3PM', 38, cx, H - FOOT + 62, WHITE, { trackingEm: 0.06, maxWidth: W - 100 })}
    ${centred(archivo, 'BLACKSHEAR ELEMENTARY  \u00B7  1712 E. 11TH ST.  \u00B7  FREE', 28, cx, H - FOOT + 108, YELLOW, { trackingEm: 0.08, maxWidth: W - 100 })}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${YELLOW}"/>
  ${top}
  ${sticker}
  ${theme}
  ${foot}
</svg>`;
}

const png = await sharp(Buffer.from(compose()), { density: 72 * 2 })
  .resize(W, H)
  .flatten({ background: YELLOW })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
  .toBuffer();
const meta = await sharp(png).metadata();
if (meta.width !== W || meta.height !== H) throw new Error(`${meta.width}x${meta.height}, expected ${W}x${H}`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, png);
console.log(`${path.relative(root, OUT)}: ${meta.width}x${meta.height}, ${(png.length / 1024).toFixed(1)} KB`);
