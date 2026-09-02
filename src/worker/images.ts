/**
 * Image storage for announcements, backed by R2.
 *
 * WHY R2 AND NOT THE REPO: a phone photo is a few megabytes and there will be
 * one per post forever. Committing them would grow the repository without bound
 * and every clone would carry every photo the PTA ever posted. R2's free tier
 * is 10GB, which at the sizes this stores is several thousand photos.
 *
 * WHY NOT ASTRO'S IMAGE PIPELINE: it resizes and re-encodes at BUILD time, and
 * it can only see files that exist when the build runs. An image uploaded
 * through /admin arrives after that, so it never passes through it. The resizing
 * therefore happens in the browser before upload - see the admin page. That is
 * also why this module validates rather than transforms: by the time bytes get
 * here they are already the right size.
 *
 * SERVED THROUGH THE WORKER, not a public bucket. Keeps everything on
 * blackshearpta.org with no second hostname to explain or secure, and the
 * content-hashed keys make the responses safely immutable.
 */

export interface ImageEnv {
  IMAGES?: R2Bucket;
}

/** Generous after the browser has already shrunk it; a hard stop on abuse. */
const MAX_BYTES = 3 * 1024 * 1024;

const TYPES: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  'image/webp': { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
};

export const IMAGE_PREFIX = '/images/';

export function isImagePath(pathname: string): boolean {
  return pathname.startsWith(IMAGE_PREFIX);
}

/**
 * Confirms the bytes are what the upload claims.
 *
 * A Content-Type header is just a string the client chose; on its own it is not
 * evidence of anything. Checking the leading bytes means a script renamed to
 * .jpg cannot be stored and later served back with an image content type.
 */
function matchesMagic(bytes: Uint8Array, type: string): boolean {
  const spec = TYPES[type];
  if (!spec) return false;
  return spec.magic.some((sig) => sig.every((byte, i) => bytes[i] === byte));
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const digest = await crypto.subtle.digest('SHA-256', buffer as ArrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type StoreResult =
  | { ok: true; key: string; url: string; bytes: number }
  | { ok: false; error: string };

export async function storeImage(bucket: R2Bucket, file: File): Promise<StoreResult> {
  const declared = file.type;
  if (!TYPES[declared]) {
    return { ok: false, error: 'Images must be JPEG, PNG or WebP.' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'That image is too large. Try one under 3MB.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesMagic(bytes, declared)) {
    return { ok: false, error: 'That file does not look like an image.' };
  }

  /**
   * Content-addressed: the key IS the hash of the bytes. Uploading the same
   * photo twice costs one object rather than two, and because a key can never
   * point at different bytes the response is safely immutable forever.
   */
  const hash = await sha256Hex(bytes);
  const key = `${hash.slice(0, 32)}.${TYPES[declared]!.ext}`;

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: declared, cacheControl: 'public, max-age=31536000, immutable' },
  });

  return { ok: true, key, url: `${IMAGE_PREFIX}${key}`, bytes: file.size };
}

/** Serves an object, or a 404. Keys are opaque hashes, so there is nothing to enumerate. */
export async function serveImage(bucket: R2Bucket, pathname: string): Promise<Response> {
  const key = pathname.slice(IMAGE_PREFIX.length);
  // Keys are generated here and are always hash.ext, so anything else is
  // someone probing. This is not what produces the 404 - a key that does not
  // exist misses the bucket and 404s regardless, which is why deleting this
  // line fails none of the tests in scripts/check-images.mjs. It stays so odd
  // input never reaches R2 at all, and so the shape of a valid key is stated
  // somewhere rather than only implied by the code that generates it.
  if (!/^[0-9a-f]{32}\.(jpg|png|webp)$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await bucket.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Immutable by construction: the key is the content hash.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
}
