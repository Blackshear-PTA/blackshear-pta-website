/**
 * Builds the themes for the PTA's two Shared Drives (B35 in TASKS.md).
 *
 * Google's requirements: an image with an aspect ratio of 80:9, at least
 * 1280 x 144 pixels. Anything smaller is refused with "Your image is below the
 * minimum allowed resolution of 1280 x 144 pixels". The image is picked from
 * Drive, so it has to be uploaded there first.
 * https://developers.google.com/workspace/drive/api/reference/rest/v3/drives
 *
 * Drive shows the theme as a wide banner in some places and as a small square
 * next to the drive's name in others, so the design has no text (the name is
 * always shown beside it) and puts Buzz in the middle, where a square crop
 * keeps him. Rendered at twice the minimum, 2560 x 288, so it stays sharp on
 * high-density screens.
 *
 *   drive-theme-documents.png  the documents drive: brand blue, Buzz in the
 *                              site's disc, and the lemon rule from the foot of
 *                              the site's masthead.
 *   drive-theme-vault.png      PTA Vault: black, like the masthead itself, with
 *                              the same disc and rule. Different enough to tell
 *                              the two apart at a glance, which matters for the
 *                              drive that holds the passwords.
 *
 * No honeycomb or hive pattern: Buzz is a yellow jacket, not a honeybee (F7 in
 * TASKS.md). A first draft of these had one.
 *
 * PROVENANCE. As in make-workspace-logo.mjs, nothing is redrawn: the mark is
 * assets/brand/buzz-mascot-color.svg inside the disc and ring of
 * src/components/BuzzMascot.astro, and the colours are the palette in
 * assets/brand/README.md.
 *
 *   node scripts/make-drive-themes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'assets/brand');
const W = 2560;
const H = 288;

// Palette, from assets/brand/README.md.
const BLUE = '#0048A8';
const YELLOW = '#F0E430';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

/** The mascot's inner markup, without its outer <svg> or <title>. */
function mascotInner() {
  const src = fs.readFileSync(path.join(root, 'assets/brand/buzz-mascot-color.svg'), 'utf8');
  const open = src.indexOf('>', src.indexOf('<svg')) + 1;
  return src.slice(open, src.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/, '');
}

function compose({ ground }) {
  // The masthead's lemon rule (6px under a band about 100px tall), scaled to
  // this height.
  const RULE = 16;
  // BuzzMascot.astro's geometry (100-unit box, disc r=46, ring 3, mascot at
  // 23.77,15 sized 52.45 x 70), scaled so the disc nearly fills the band above
  // the rule.
  const band = H - RULE;
  const markSize = band - 24;
  const markX = (W - markSize) / 2;
  const markY = (band - markSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${ground}"/>
  <rect y="${band}" width="${W}" height="${RULE}" fill="${YELLOW}"/>
  <svg x="${markX}" y="${markY}" width="${markSize}" height="${markSize}" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/>
    <svg x="23.77" y="15.00" width="52.45" height="70.00" viewBox="228 111 574 766" overflow="visible">${mascotInner()}</svg>
  </svg>
</svg>`;
}

async function render(name, opts) {
  const png = await sharp(Buffer.from(compose(opts)), { density: 72 * 2 })
    .resize(W, H)
    .flatten({ background: opts.ground })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const meta = await sharp(png).metadata();
  if (meta.width !== W || meta.height !== H) throw new Error(`${name}: ${meta.width}x${meta.height}, expected ${W}x${H}`);
  if (meta.width * 9 !== meta.height * 80 || meta.width < 1280) throw new Error(`${name}: not 80:9 at 1280 x 144 or more`);
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  console.log(`${name}: ${meta.width}x${meta.height}, ${(png.length / 1024).toFixed(1)} KB`);
}

await render('drive-theme-documents.png', { ground: BLUE });
await render('drive-theme-vault.png', { ground: BLACK });
