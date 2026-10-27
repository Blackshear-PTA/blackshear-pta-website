/**
 * Blackshear PTA - put pictures from the repository into the live photo bucket.
 *
 * WHY THIS EXISTS. Announcement photos normally arrive through /admin, which
 * shrinks each one in the browser and stores it in R2 under a content-hash
 * name. Some pictures are already in the repository instead: every Weekly Buzz
 * flyer was imported into the post's text from public/weekly-buzz/, before a
 * photo could be uploaded whole. This puts such files in the bucket the same
 * way, so a migration can attach them to their posts as real photos and covers.
 * First used 2026-10-27, for migrations 0007 and 0008 (TASKS.md A46).
 *
 * THE NAME IS THE CONTENT. Same rule as src/worker/images.ts: the first 32 hex
 * characters of the file's SHA-256, then its extension. So a migration can name
 * a photo before it is uploaded, a file uploaded twice is stored once, and
 * nothing here can overwrite a different photo.
 *
 * It checks what the Worker checks - JPEG or PNG by the leading bytes, at most
 * 3MB - and one thing more: nothing over 1600px on its longer side, the size
 * /admin shrinks to, so a picture put in this way costs a parent on a phone no
 * more than one uploaded there. Shrink anything bigger first.
 *
 *   node scripts/upload-photos.mjs <file>...            print each name and size
 *   node scripts/upload-photos.mjs --upload <file>...   put them in the bucket
 *   node scripts/upload-photos.mjs --verify <file>...   check the live site serves them
 *   node scripts/upload-photos.mjs --local <file>...    put them in the local bucket
 *                                                       that `wrangler dev` uses
 *
 * --upload goes through scripts/cf.sh, and needs the PTA's API token to have
 * *Workers R2 Storage: Edit*. Until 2026-10-27 it had Read only, since nothing
 * outside /admin wrote photos. Run it with Node 22, like everything wrangler.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.SITE_ORIGIN ?? 'https://blackshearpta.org';

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_SIDE = 1600;

const args = process.argv.slice(2);
const UPLOAD = args.includes('--upload');
const LOCAL = args.includes('--local');
const VERIFY = args.includes('--verify');
const files = args.filter((arg) => !arg.startsWith('--'));

if (files.length === 0) {
  console.error('usage: node scripts/upload-photos.mjs [--upload | --verify | --local] <file>...');
  process.exit(2);
}

/** The bucket out of wrangler.jsonc, as in scripts/seed-images.mjs, so the two cannot drift. */
function bucketName() {
  const text = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8');
  const found = /"bucket_name"\s*:\s*"([^"]+)"/.exec(text);
  if (!found) throw new Error('No r2_buckets bucket_name found in wrangler.jsonc.');
  return found[1];
}

/** Type and pixel size from the file's own header. JPEG and PNG, as /admin produces. */
function inspect(bytes) {
  if (bytes[0] === 0x89 && bytes.subarray(1, 4).toString('latin1') === 'PNG') {
    return { type: 'image/png', ext: 'png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    // Walk the segments to the frame header, which holds the size. C4, C8 and
    // CC share the SOFn range but are tables, not frames.
    let at = 2;
    while (at + 9 < bytes.length) {
      if (bytes[at] !== 0xff) break;
      const marker = bytes[at + 1];
      const length = bytes.readUInt16BE(at + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { type: 'image/jpeg', ext: 'jpg', height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
      }
      at += 2 + length;
    }
    throw new Error('a JPEG with no readable size');
  }
  throw new Error('not a JPEG or PNG');
}

let failed = false;
const rows = [];
for (const file of files) {
  try {
    const bytes = readFileSync(file);
    const { type, ext, width, height } = inspect(bytes);
    if (bytes.length > MAX_BYTES) throw new Error(`${bytes.length} bytes, over the Worker's 3MB`);
    if (Math.max(width, height) > MAX_SIDE) {
      throw new Error(`${width}x${height}, over ${MAX_SIDE}px on its longer side; shrink it first`);
    }
    const key = `${createHash('sha256').update(bytes).digest('hex').slice(0, 32)}.${ext}`;
    rows.push({ file, key, type, width, height, bytes: bytes.length });
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    failed = true;
  }
}
if (failed) process.exit(1);

for (const row of rows) {
  console.log(`${row.file}\n  key ${row.key}  ${row.width}x${row.height}  ${Math.round(row.bytes / 1024)}KB`);
}

if (UPLOAD || LOCAL) {
  const bucket = bucketName();
  // Wrangler refuses to run under Node 20; this script's own Node goes first on
  // the PATH so npx finds the same one.
  const env = { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH}` };
  // The local bucket needs no token, so no cf.sh.
  const run = LOCAL ? ['npx'] : ['sh', join(ROOT, 'scripts/cf.sh'), 'npx'];
  for (const row of rows) {
    console.log(`\n${LOCAL ? 'putting in the local bucket' : 'uploading'} ${row.key}`);
    execFileSync(
      run[0],
      [
        ...run.slice(1),
        'wrangler', 'r2', 'object', 'put', `${bucket}/${row.key}`,
        LOCAL ? '--local' : '--remote',
        '--file', row.file,
        '--content-type', row.type,
        // What storeImage() sets: the name is the content, so it never changes.
        '--cache-control', 'public, max-age=31536000, immutable',
      ],
      { cwd: ROOT, env, stdio: 'inherit' },
    );
  }
}

if (VERIFY) {
  console.log('');
  for (const row of rows) {
    const response = await fetch(`${ORIGIN}/images/${row.key}`, { method: 'HEAD' });
    const size = Number(response.headers.get('content-length'));
    const ok = response.ok && (!size || size === row.bytes);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${ORIGIN}/images/${row.key} (${response.status})`);
    if (!ok) failed = true;
  }
  if (failed) process.exit(1);
}
