/**
 * Blackshear PTA - image upload gate.
 *
 * storeImage decides what is allowed into the bucket and then served back with
 * an image content type. The checks that matter cannot be reached over HTTP in
 * a test, because Cloudflare Access sits in front of the endpoint, so they are
 * exercised here directly against a stub bucket.
 *
 * The case worth having: a Content-Type header is a string the client picked.
 * On its own it is not evidence of anything, so a script renamed to .jpg must
 * be refused on its bytes rather than its label.
 *
 * Run: npm run check:images
 */
import { deflateSync } from 'node:zlib';
import { storeImage, serveImage, isImagePath } from '../src/worker/images.ts';

let failures = 0;
const pass = (n) => console.log(`  ok   ${n}`);
const fail = (n, d) => { failures += 1; console.error(`  FAIL ${n}\n       ${d}`); };

/** Enough of an R2Bucket for storeImage and serveImage. */
function stubBucket() {
  const objects = new Map();
  return {
    puts: objects,
    async put(key, bytes, opts) { objects.set(key, { bytes, opts }); },
    async get(key) {
      const found = objects.get(key);
      if (!found) return null;
      return {
        body: found.bytes,
        httpEtag: '"stub"',
        writeHttpMetadata(headers) {
          headers.set('content-type', found.opts?.httpMetadata?.contentType ?? '');
        },
      };
    },
  };
}

const jpegBytes = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from('\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00', 'binary'),
  Buffer.from([0xff, 0xd9]),
]);

function pngBytes() {
  const crcTable = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from([0, 0, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const file = (bytes, type, name = 'x') => new File([bytes], name, { type });

async function expectStore(name, f, shouldPass, expectExt) {
  const bucket = stubBucket();
  const result = await storeImage(bucket, f);
  if (shouldPass) {
    if (!result.ok) return fail(name, `expected accept, got: ${result.error}`);
    if (expectExt && !result.key.endsWith(`.${expectExt}`)) {
      return fail(name, `expected a .${expectExt} key, got ${result.key}`);
    }
    if (!/^[0-9a-f]{32}\.\w+$/.test(result.key)) return fail(name, `key not content-hashed: ${result.key}`);
    if (bucket.puts.size !== 1) return fail(name, `expected one object, got ${bucket.puts.size}`);
    return pass(name);
  }
  if (result.ok) return fail(name, `expected REJECT, but it stored ${result.key}`);
  if (bucket.puts.size !== 0) return fail(name, 'rejected but still wrote to the bucket');
  return pass(name);
}

console.log('accepts:');
await expectStore('real JPEG', file(jpegBytes, 'image/jpeg'), true, 'jpg');
await expectStore('real PNG', file(pngBytes(), 'image/png'), true, 'png');

console.log('\nrejects:');
await expectStore(
  'script renamed .jpg, declared image/jpeg',
  file(Buffer.from('<script>alert(1)</script>'), 'image/jpeg', 'evil.jpg'),
  false,
);
await expectStore('PNG bytes declared as JPEG', file(pngBytes(), 'image/jpeg'), false);
await expectStore('unsupported type (gif)', file(jpegBytes, 'image/gif'), false);
await expectStore('no content type', file(jpegBytes, ''), false);
await expectStore('empty file', file(Buffer.alloc(0), 'image/jpeg'), false);
await expectStore(
  'over the size cap',
  file(Buffer.concat([jpegBytes, Buffer.alloc(4 * 1024 * 1024)]), 'image/jpeg'),
  false,
);

console.log('\ncontent addressing:');
{
  const bucket = stubBucket();
  const a = await storeImage(bucket, file(jpegBytes, 'image/jpeg', 'one.jpg'));
  const b = await storeImage(bucket, file(jpegBytes, 'image/jpeg', 'two.jpg'));
  if (a.ok && b.ok && a.key === b.key && bucket.puts.size === 1) pass('same bytes, different filename -> one object');
  else fail('same bytes -> one object', `keys ${a.key}/${b.key}, objects ${bucket.puts.size}`);

  const c = await storeImage(bucket, file(pngBytes(), 'image/png'));
  if (c.ok && c.key !== a.key) pass('different bytes -> different key');
  else fail('different bytes -> different key', `got ${c.key}`);

  const stored = bucket.puts.get(a.key);
  if (stored?.opts?.httpMetadata?.contentType === 'image/jpeg') pass('content type recorded on the object');
  else fail('content type recorded', JSON.stringify(stored?.opts));
}

console.log('\nserving:');
{
  const bucket = stubBucket();
  const stored = await storeImage(bucket, file(jpegBytes, 'image/jpeg'));
  const ok = await serveImage(bucket, `/images/${stored.key}`);
  if (ok.status === 200 && ok.headers.get('cache-control')?.includes('immutable')) pass('stored key serves 200, immutable');
  else fail('stored key serves', `status ${ok.status}, cache-control ${ok.headers.get('cache-control')}`);
  if (ok.headers.get('x-content-type-options') === 'nosniff') pass('nosniff on served images');
  else fail('nosniff', ok.headers.get('x-content-type-options'));

  for (const bad of ['/images/nope.jpg', '/images/../secret', '/images/' + 'a'.repeat(32) + '.svg', '/images/']) {
    const r = await serveImage(bucket, bad);
    if (r.status === 404) pass(`refuses ${JSON.stringify(bad)}`);
    else fail(`refuses ${bad}`, `status ${r.status}`);
  }
}

console.log('\npath matching:');
for (const [p, want] of [['/images/x.jpg', true], ['/images', false], ['/imagesx', false], ['/news/', false]]) {
  if (isImagePath(p) === want) pass(`isImagePath(${JSON.stringify(p)}) === ${want}`);
  else fail(`isImagePath(${p})`, `got ${!want}`);
}

/**
 * The two PRE-SIZED derived photos, which are committed files rather than
 * getImage() calls - see "Why some photos are pre-sized files" in
 * src/assets/photos/README.md.
 *
 * They are checked here because nothing else can catch them. Four routes render
 * on demand, where Astro's image pipeline is unavailable and the adapter's
 * fallback endpoint streams whatever it is handed straight back. If one of
 * these is regenerated at the wrong size, or replaced with the original by
 * somebody tidying up duplicate-looking photos, the page still renders, still
 * looks right, and quietly ships megabytes. The failure is invisible everywhere
 * except Content-Length - which is exactly how BOTH of them got shipped once.
 *
 * The backdrop was caught before release. The social card was not: it went to
 * production, where sharing a link produced a card with no image because
 * scrapers refuse a 6.3MB fetch. One of the two was guarded and the other was
 * not, so this now covers every derived photo rather than the one that bit
 * first.
 */

/** Dimensions straight out of a WebP container. */
function webpSize(b) {
  const kind = b.subarray(12, 16).toString('latin1');
  // sharp can emit any of three shapes depending on the encode, so all three
  // are read rather than assuming the one it happens to produce today.
  if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff, kind };
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, kind };
  }
  if (kind === 'VP8X') {
    return {
      width: (b.readUIntLE(24, 3) & 0xffffff) + 1,
      height: (b.readUIntLE(27, 3) & 0xffffff) + 1,
      kind,
    };
  }
  return { width: 0, height: 0, kind };
}

/** Dimensions from a JPEG's first SOF marker. */
function jpegSize(b) {
  let i = 2; // past SOI
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    // Standalone markers carry no length segment to skip over.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    const length = b.readUInt16BE(i + 2);
    // SOF0..SOF15, except DHT (c4), JPG (c8) and DAC (cc), which are not frames.
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5), kind: 'JPEG' };
    i += 2 + length;
  }
  return { width: 0, height: 0, kind: 'JPEG' };
}

console.log('\npre-sized derived photos (because four routes render on demand):');
{
  const { readFileSync, existsSync } = await import('node:fs');

  const DERIVED = [
    {
      what: 'top-band backdrop',
      path: 'src/assets/photos/campus-front-walk-band.webp',
      width: 1200,
      height: 800,
      /** Generous: the real file is ~180KB. A tripwire, not a budget. */
      maxBytes: 400 * 1024,
      magic: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
      format: 'WebP',
      size: webpSize,
    },
    {
      what: 'social card (og:image)',
      path: 'src/assets/photos/campus-front-walk-social.jpg',
      width: 1200,
      height: 630,
      /**
       * Tighter than a tripwire on purpose. X refuses an og:image over about
       * 5MB and other scrapers have their own caps, but a card is also fetched
       * on every share - 400KB is already generous for 1200x630.
       */
      maxBytes: 400 * 1024,
      magic: (b) => b[0] === 0xff && b[1] === 0xd8,
      format: 'JPEG',
      size: jpegSize,
    },
  ];

  for (const asset of DERIVED) {
    if (!existsSync(asset.path)) {
      fail(`${asset.what} exists`, `${asset.path} is missing - regenerate it, see src/assets/photos/README.md`);
      continue;
    }
    const bytes = readFileSync(asset.path);
    pass(`${asset.what} exists`);

    if (asset.magic(bytes)) pass(`  it is a ${asset.format}`);
    else fail(`  it is a ${asset.format}`, `magic bytes were ${JSON.stringify(bytes.subarray(0, 12).toString('latin1'))}`);

    const { width, height, kind } = asset.size(bytes);
    if (width === asset.width && height === asset.height) {
      pass(`  it is ${asset.width}x${asset.height}`);
    } else {
      fail(`  it is ${asset.width}x${asset.height}`, `got ${width}x${height} (container ${JSON.stringify(kind)})`);
    }

    const kb = Math.round(bytes.length / 1024);
    if (bytes.length <= asset.maxBytes) {
      pass(`  it is ${kb}KB, under the ${asset.maxBytes / 1024}KB ceiling`);
    } else {
      fail(
        '  it is under the size ceiling',
        `${kb}KB exceeds ${asset.maxBytes / 1024}KB - this is the shape of the bug where the ` +
          'full-size original gets shipped in place of the derived file',
      );
    }
  }
}

console.log(`\n${failures ? `${failures} failing` : 'all image checks passed'}.`);
process.exit(failures ? 1 : 0);
