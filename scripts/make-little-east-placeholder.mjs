/**
 * The "poster coming soon" stand-in for this year's Little EAST page, until
 * the real 2026 poster exists (TASKS.md A40). Jon asked for something that
 * says "to be revealed soon!" and looks creative and fun.
 *
 * The 2026 theme is Time Warp, so Buzz sits at the centre of a clock face
 * inside a hypnotic spiral of rings, with a few question marks around him.
 * Same palette and type as the site: lemon and black, Bevan for display,
 * Archivo for the small lines. When the real poster arrives, it replaces this
 * file's entry in src/content/pages.yaml and this script can be deleted.
 *
 * PROVENANCE. As in make-workspace-logo.mjs, nothing is redrawn: the mark is
 * assets/brand/buzz-mascot-color.svg inside the disc and ring of
 * src/components/BuzzMascot.astro, and the colours are the palette in
 * assets/brand/README.md. Type is set as paths from the fonts in Astro's font
 * cache, which exists after one build, so the result does not depend on the
 * fonts the rendering machine happens to have.
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

/** The mascot's inner markup, without its outer <svg> or <title>. */
function mascotInner() {
  const src = fs.readFileSync(path.join(root, 'assets/brand/buzz-mascot-color.svg'), 'utf8');
  const open = src.indexOf('>', src.indexOf('<svg')) + 1;
  return src.slice(open, src.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/, '');
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

  // The time warp: rings that shrink towards a point a little off centre, so
  // they read as a tunnel rather than a target.
  const RCX = cx;
  const RCY = 760;
  let rings = '';
  for (let i = 0; i < 11; i++) {
    const r = 430 - i * 32;
    const dx = Math.sin(i * 0.7) * i * 3;
    const dy = Math.cos(i * 0.7) * i * 3;
    rings += `<circle cx="${(RCX + dx).toFixed(1)}" cy="${(RCY + dy).toFixed(1)}" r="${r}" fill="${i % 2 ? YELLOW : BLACK}"/>`;
  }

  // A clock face around Buzz: twelve ticks, the hour hand running backwards.
  const FACE = 140;
  let ticks = '';
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const long = h % 3 === 0;
    const r1 = FACE + 10;
    const r2 = FACE + (long ? 46 : 30);
    ticks += `<line x1="${(RCX + r1 * Math.sin(a)).toFixed(1)}" y1="${(RCY - r1 * Math.cos(a)).toFixed(1)}" x2="${(RCX + r2 * Math.sin(a)).toFixed(1)}" y2="${(RCY - r2 * Math.cos(a)).toFixed(1)}" stroke="${BLACK}" stroke-width="${long ? 12 : 7}" stroke-linecap="round"/>`;
  }
  const clock = `
    <circle cx="${RCX}" cy="${RCY}" r="${FACE + 60}" fill="${WHITE}" stroke="${BLACK}" stroke-width="10"/>
    ${ticks}
    <path d="M ${RCX + FACE + 70} ${RCY - 40} a ${FACE + 70} ${FACE + 70} 0 0 0 -60 -150" fill="none" stroke="${BLUE}" stroke-width="14" stroke-linecap="round"/>
    <path d="M ${RCX + FACE + 48} ${RCY - 214} l 4 46 l 40 -22 z" fill="${BLUE}"/>`;

  // Buzz, in BuzzMascot.astro's disc and ring (100-unit box, disc r=46,
  // ring 3, mascot at 23.77,15 sized 52.45 x 70), scaled to sit in the face.
  const MARK = FACE * 2;
  const mark = `
    <svg x="${RCX - MARK / 2}" y="${RCY - MARK / 2}" width="${MARK}" height="${MARK}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/>
      <svg x="23.77" y="15.00" width="52.45" height="70.00" viewBox="228 111 574 766" overflow="visible">${mascotInner()}</svg>
    </svg>`;

  // Question marks, tumbling through the warp.
  const q = (x, y, size, angle, fill) => {
    const line = setLine(bevan, '?', size);
    return `<g fill="${fill}" stroke="${BLACK}" stroke-width="5" paint-order="stroke" transform="translate(${x} ${y}) rotate(${angle}) translate(${(-line.width / 2).toFixed(1)} ${(line.capHeight / 2).toFixed(1)})">${line.svg}</g>`;
  };
  const marks = [
    q(185, 470, 150, -18, WHITE),
    q(1030, 560, 120, 16, BLUE),
    q(160, 1040, 110, 12, BLUE),
    q(1050, 1060, 160, -10, WHITE),
  ].join('');

  // The sticker: the one thing the page is saying.
  const sticker = `
    <g transform="translate(${cx} 1250) rotate(-4)">
      <rect x="-520" y="-82" width="1040" height="164" rx="22" fill="${BLACK}"/>
      ${centred(bevan, 'POSTER TO BE REVEALED SOON!', 64, 0, 26, YELLOW, { maxWidth: 960 })}
    </g>`;

  const theme = centred(archivo, 'THIS YEAR’S THEME: TIME WARP', 40, cx, 1418, BLACK, { trackingEm: 0.08 });

  // Bottom band: the date, in the brand blue.
  const FOOT = 140;
  const foot = `
    <rect y="${H - FOOT}" width="${W}" height="${FOOT}" fill="${BLUE}"/>
    ${centred(archivo, 'SATURDAY, NOVEMBER 14, 2026  ·  11AM TO 3PM', 38, cx, H - FOOT + 62, WHITE, { trackingEm: 0.06, maxWidth: W - 100 })}
    ${centred(archivo, 'BLACKSHEAR ELEMENTARY  ·  1712 E. 11TH ST.  ·  FREE', 28, cx, H - FOOT + 108, YELLOW, { trackingEm: 0.08, maxWidth: W - 100 })}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${YELLOW}"/>
  ${rings}
  ${clock}
  ${mark}
  ${marks}
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
