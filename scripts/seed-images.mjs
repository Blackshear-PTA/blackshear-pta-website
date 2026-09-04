/**
 * Blackshear PTA - copy announcement photos into the local R2 bucket.
 *
 * WHY THIS EXISTS. `wrangler dev` binds a LOCAL R2 bucket - a miniflare store
 * under .wrangler/state - not the production one. It starts empty, so every
 * /images/<hash>.jpg request 404s and every announcement on a dev server shows
 * a broken photo. Nothing is misconfigured when that happens; there is simply
 * nothing in the bucket. This puts something in it.
 *
 * WHY IT CAN FETCH OVER PLAIN HTTPS AND NEEDS NO CREDENTIALS. /images/* is
 * deliberately routed ahead of the pre-launch gate in src/worker.ts, so the
 * live site serves these objects unauthenticated. That is not an oversight -
 * the keys are 128 bits of content hash with nothing to enumerate - and it
 * means seeding needs no R2 token, no bucket permissions, and no account
 * access at all. Anyone who can clone the repo can run it.
 *
 * Safe to run before every dev server: it records what it has already put in
 * the bucket and does nothing on a second run. The record lives INSIDE
 * .wrangler/ deliberately, next to the bucket it describes, so deleting the
 * local state resets both together and cannot leave the two disagreeing.
 *
 * Run: npm run dev:images         (--force to re-fetch, --quiet for scripts)
 */
import { execFileSync } from 'node:child_process';
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parsePost } from '../src/worker/frontmatter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'src/content/announcements');

const FORCE = process.argv.includes('--force');
/** Say nothing when there is nothing to do, so a preflight can call this every time. */
const QUIET = process.argv.includes('--quiet');

/** Beside the bucket it describes - see the header. */
const STATE_DIR = join(ROOT, '.wrangler/state');
const MANIFEST = join(STATE_DIR, 'pta-seeded-images.json');

function alreadySeeded() {
  if (FORCE) return new Set();
  try {
    const saved = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    // The bucket is only still populated if wrangler's own state survived. If
    // someone deleted .wrangler/state/v3 but left the manifest, believing it
    // would mean silently serving 404s for photos we think are present.
    if (!existsSync(join(STATE_DIR, 'v3'))) return new Set();
    return new Set(Array.isArray(saved.keys) ? saved.keys : []);
  } catch {
    return new Set();
  }
}

function recordSeeded(keys) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify({ keys: [...keys].sort() }, null, 2)}\n`);
}

/** Where the photos are fetched from. Override for a staging origin. */
const ORIGIN = process.env.SITE_ORIGIN ?? 'https://blackshearpta.org';

const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/**
 * The bucket name out of wrangler.jsonc, so the two cannot drift.
 *
 * Matched with a regex rather than parsed: the file is JSONC and JSON.parse
 * chokes on its comments, while stripping comments generically risks mangling a
 * "//" inside a string. One targeted match cannot be confused by either.
 */
function bucketName() {
  const text = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8');
  const found = /"bucket_name"\s*:\s*"([^"]+)"/.exec(text);
  if (!found) throw new Error('No r2_buckets bucket_name found in wrangler.jsonc.');
  return found[1];
}

/** Every image key referenced by a post - gallery images and covers alike. */
function referencedKeys() {
  const keys = new Set();
  let files = [];
  try {
    files = readdirSync(POSTS).filter((f) => f.endsWith('.md'));
  } catch {
    return keys;
  }
  for (const file of files) {
    const parsed = parsePost(readFileSync(join(POSTS, file), 'utf8'));
    if (!parsed) continue;
    for (const image of parsed.meta.images ?? []) {
      if (image && typeof image.key === 'string') keys.add(image.key);
    }
    // A cover names one of the images above in every file this repo writes, but
    // it is a separate field and a hand-edited file could disagree.
    if (typeof parsed.meta.cover === 'string' && parsed.meta.cover) keys.add(parsed.meta.cover);
  }
  return keys;
}

const wrangler = join(ROOT, 'node_modules/.bin/wrangler');
const bucket = bucketName();
const referenced = [...referencedKeys()].filter((k) => /^[0-9a-f]{32}\.(jpg|png|webp)$/.test(k));

if (referenced.length === 0) {
  if (!QUIET) console.log('No announcement photos to seed. Nothing to do.');
  process.exit(0);
}

const have = alreadySeeded();
const keys = referenced.filter((k) => !have.has(k));

if (keys.length === 0) {
  if (!QUIET) {
    console.log(`All ${referenced.length} announcement photos are already in the local bucket.`);
    console.log('Use --force to fetch them again.');
  }
  process.exit(0);
}

console.log(`Seeding ${keys.length} photo${keys.length === 1 ? '' : 's'} from ${ORIGIN}`);
console.log(`into the local "${bucket}" bucket.\n`);

const scratch = mkdtempSync(join(tmpdir(), 'pta-images-'));
const done = new Set(have);
let seeded = 0;
let failed = 0;

try {
  for (const key of keys) {
    const url = `${ORIGIN}/images/${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`  FAIL ${key} - ${ORIGIN} answered ${response.status}`);
        failed += 1;
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const file = join(scratch, key);
      writeFileSync(file, bytes);

      execFileSync(
        wrangler,
        [
          'r2', 'object', 'put', `${bucket}/${key}`,
          '--file', file,
          '--content-type', TYPES[key.split('.').pop()],
          '--local',
        ],
        { cwd: ROOT, stdio: 'pipe' },
      );

      console.log(`  ok   ${key}  ${(bytes.length / 1024).toFixed(0)}KB`);
      done.add(key);
      seeded += 1;
    } catch (error) {
      console.error(`  FAIL ${key} - ${error.message.trim().split('\n')[0]}`);
      failed += 1;
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
  // Written even on a partial run, so a retry only fetches what is still
  // missing rather than starting over.
  if (seeded) recordSeeded(done);
}

console.log(`\n${seeded} seeded, ${failed} failed.`);
if (failed && !seeded) {
  // Every single one failing is systemic - offline, or a wrong SITE_ORIGIN -
  // rather than a stale key in one old post, so it is worth a non-zero exit.
  console.error(`Could not reach any photo at ${ORIGIN}. Is that origin right, and are you online?`);
  process.exit(1);
}
if (seeded) console.log('Restart `dev worker` if it is already running.');
