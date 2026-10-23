/**
 * Builds the site's favicons from the brand mark.
 *
 * PROVENANCE. Nothing here is redrawn. The mark is assets/brand/buzz-mascot-color.svg
 * in the same white disc and black ring as src/components/BuzzMascot.astro, the
 * Workspace logo and hello@'s account photo, so the browser tab matches the
 * rest of the PTA's identity.
 *
 * One change for the size: the ring is twice as thick (6 of 100 rather than 3).
 * At 3 it is half a pixel in a 16px tab and disappears; at 6 it still draws
 * the edge of the disc, which is the outline that makes the mark read as a
 * badge rather than a loose bee.
 *
 * Three files, into public/ so they are served as-is:
 *   favicon.svg           modern browsers, sharp at any size and zoom
 *   favicon.ico           16, 32 and 48px PNGs in one file, for everything
 *                         else, and for the /favicon.ico every browser asks
 *                         for whether or not the page links it
 *   apple-touch-icon.png  180px, for a phone's home screen. Square and opaque,
 *                         because iOS fills transparency with black and rounds
 *                         the corners itself: the disc on brand blue, like
 *                         hello@'s account photo
 *
 *   node scripts/make-favicons.mjs
 *
 * All three are served by name, so the browser keeps its cached copy for a
 * while after a change. That is fine for a mark that changes once in years.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'public');

// Palette, from assets/brand/README.md.
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BLUE = '#0048A8';

/** The mascot's inner markup, without its outer <svg> or <title>. */
function mascotInner() {
  const src = fs.readFileSync(path.join(root, 'assets/brand/buzz-mascot-color.svg'), 'utf8');
  const open = src.indexOf('>', src.indexOf('<svg')) + 1;
  return src.slice(open, src.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/, '');
}

/** BuzzMascot.astro's geometry in its 100-unit box, with the thicker ring. */
const mark = `<circle cx="50" cy="50" r="46" fill="${WHITE}" stroke="${BLACK}" stroke-width="6"/>
  <svg x="23.77" y="15.00" width="52.45" height="70.00" viewBox="228 111 574 766" overflow="visible">${mascotInner()}</svg>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${mark}
</svg>
`;

/** Rasterise large and downsample, for cleaner edges than librsvg's 1x pass. */
const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * 8 })
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

/**
 * An .ico is a small directory of images, and since Windows Vista each entry
 * may simply be a PNG. sharp cannot write the container, but it is 6 bytes of
 * header and 16 per image.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0); // width; 0 means 256
    entry.writeUInt8(size % 256, 1); // height
    entry.writeUInt8(0, 2); // palette size: none
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

function write(name, data) {
  fs.writeFileSync(path.join(OUT_DIR, name), data);
  console.log(`${name}: ${(data.length / 1024).toFixed(1)} KB`);
}

write('favicon.svg', favicon);

const sizes = [16, 32, 48];
write('favicon.ico', ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(favicon, size) })))));

// The disc fills most of the square; iOS's rounded corners only ever cut blue.
const TOUCH = 180;
const touch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${BLUE}"/>
  <svg x="7" y="7" width="86" height="86" viewBox="0 0 100 100">${mark}</svg>
</svg>`;
const touchPng = await sharp(await png(touch, TOUCH)).flatten({ background: BLUE }).png().toBuffer();
const meta = await sharp(touchPng).metadata();
if (meta.width !== TOUCH || meta.height !== TOUCH || meta.hasAlpha) {
  throw new Error(`apple-touch-icon.png: ${meta.width}x${meta.height}, alpha ${meta.hasAlpha}`);
}
write('apple-touch-icon.png', touchPng);
