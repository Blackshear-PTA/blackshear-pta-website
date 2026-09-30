/**
 * Builds the Google Workspace organization logo from the site's own brand.
 *
 * Google's requirements (Admin console -> Account -> Account settings ->
 * Personalization): PNG, GIF or JPEG, exactly 320 x 132 pixels, or it is
 * stretched to fit; keep it under 30 KB. It shows at the top of Gmail, Drive
 * and Calendar, to people in the organization only, and not on mobile.
 * https://knowledge.workspace.google.com/admin/getting-started/add-your-logo-to-google-workspace
 *
 * PROVENANCE. Nothing here is redrawn. The mark is assets/brand/buzz-mascot-color.svg
 * inside the same white disc and black ring as src/components/BuzzMascot.astro.
 * The wordmark is set in Bevan, the live theme's display face (Civic Letterpress
 * A), uppercase, converted to outlines, so the PNG does not depend on whatever
 * fonts the rendering machine happens to have.
 *
 * Two variants:
 *   workspace-logo.png              the site header as-is: black band, white
 *                                   type. Upload this one. It reads on Google's
 *                                   light header and in dark themes alike.
 *   workspace-logo-transparent.png  black type, no background. Lighter on the
 *                                   default light header, but the type vanishes
 *                                   in dark themes, which are per-user and
 *                                   common. Use it only if nobody does.
 *
 * Bevan comes from Astro's font cache, which exists after one build:
 *   npm run build && node scripts/make-workspace-logo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkitten';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'assets/brand');
const W = 320;
const H = 132;
const MAX_BYTES = 30 * 1024;

// Palette, from assets/brand/README.md.
const BLACK = '#000000';
const WHITE = '#FFFFFF';

function findFont(family) {
  const dir = path.join(root, 'node_modules/.astro/fonts');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.woff2')) : [];
  for (const f of files) {
    const font = create(fs.readFileSync(path.join(dir, f)));
    if (font.familyName === family) return font;
  }
  throw new Error(`${family} not found in node_modules/.astro/fonts. Run \`npm run build\` once first.`);
}

/**
 * One line of type as SVG path data in pixels, baseline at y = 0, starting at
 * x = 0. Tracking is in em, as in the theme CSS. fontkitten maps characters to
 * glyphs but does no shaping, so there is no kerning; for one short all-caps
 * line in a slab face that is not visible.
 */
function setLine(font, text, sizePx, trackingEm) {
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
  return {
    svg: parts.join(''),
    width: x * scale,
    capHeight: font.capHeight * scale,
  };
}

/** The mascot's inner markup, without its outer <svg> or <title>. */
function mascotInner() {
  const src = fs.readFileSync(path.join(root, 'assets/brand/buzz-mascot-color.svg'), 'utf8');
  const open = src.indexOf('>', src.indexOf('<svg')) + 1;
  return src.slice(open, src.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/, '');
}

function compose({ background, ink }) {
  const bevan = findFont('Bevan');
  const TRACKING = 0.01; // --pta-display-tracking in civic-letterpress-a.css

  // Mark: BuzzMascot.astro's geometry (100-unit box, disc r=46, ring 3, mascot
  // at 23.77,15 sized 52.45 x 70), scaled so the disc nearly fills the height.
  const PAD = 6;
  const markSize = H - PAD * 2;
  const mark = `
    <svg x="${PAD}" y="${PAD}" width="${markSize}" height="${markSize}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/>
      <svg x="23.77" y="15.00" width="52.45" height="70.00" viewBox="228 111 574 766" overflow="visible">${mascotInner()}</svg>
    </svg>`;

  // Wordmark: BLACKSHEAR over a larger PTA, both fitted to the column right of
  // the disc. Sizes come from the measured glyphs, not guessed.
  const colX = PAD + markSize + 10;
  const colW = W - colX - PAD;
  const probe = setLine(bevan, 'BLACKSHEAR', 100, TRACKING);
  const top = setLine(bevan, 'BLACKSHEAR', (100 * colW) / probe.width, TRACKING);
  const probePta = setLine(bevan, 'PTA', 100, TRACKING);
  const pta = setLine(bevan, 'PTA', Math.min((100 * colW) / probePta.width, 100 * (top.capHeight * 2.3) / probePta.capHeight), TRACKING);

  const GAP = top.capHeight * 0.55;
  const blockH = top.capHeight + GAP + pta.capHeight;
  const topBaseline = (H - blockH) / 2 + top.capHeight;
  const ptaBaseline = topBaseline + GAP + pta.capHeight;

  const bg = background ? `<rect width="${W}" height="${H}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${bg}
  ${mark}
  <g fill="${ink}">
    <g transform="translate(${colX.toFixed(2)} ${topBaseline.toFixed(2)})">${top.svg}</g>
    <g transform="translate(${colX.toFixed(2)} ${ptaBaseline.toFixed(2)})">${pta.svg}</g>
  </g>
</svg>`;
}

async function render(name, opts) {
  const svg = compose(opts);
  // Rasterise at 4x and downsample, for cleaner edges than librsvg's 1x pass.
  let png = await sharp(Buffer.from(svg), { density: 72 * 4 })
    .resize(W, H)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  if (png.length > MAX_BYTES) {
    png = await sharp(png).png({ palette: true, colours: 64, compressionLevel: 9 }).toBuffer();
  }
  const meta = await sharp(png).metadata();
  if (meta.width !== W || meta.height !== H) throw new Error(`${name}: ${meta.width}x${meta.height}, expected ${W}x${H}`);
  if (png.length > MAX_BYTES) throw new Error(`${name}: ${png.length} bytes, over ${MAX_BYTES}`);
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  console.log(`${name}: ${meta.width}x${meta.height}, ${(png.length / 1024).toFixed(1)} KB`);
}

await render('workspace-logo.png', { background: BLACK, ink: WHITE });
await render('workspace-logo-transparent.png', { background: null, ink: BLACK });
