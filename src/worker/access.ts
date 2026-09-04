/**
 * Cloudflare Access JWT verification.
 *
 * Access already blocks unauthenticated requests to /admin at the edge, so in
 * the normal case this re-checks something that has already been checked. It
 * earns its place twice over anyway:
 *
 *   1. It is the only trustworthy source of WHO is editing. /admin writes
 *      commits to a public repo, and those commits should carry the editor's
 *      address, not a shared bot identity.
 *   2. An Access policy is dashboard configuration, and dashboard configuration
 *      can be edited, scoped wrong, or deleted by someone who does not realise
 *      it is the only thing standing in front of a write endpoint. If that
 *      happens, this fails closed instead of handing the repo to the internet.
 *
 * Needs two values, both set as Worker secrets (see docs/ADMIN.md):
 *   CF_ACCESS_TEAM_DOMAIN  e.g. blackshearpta.cloudflareaccess.com
 *   CF_ACCESS_AUD          the Application Audience tag for the /admin app
 */

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

export interface AccessIdentity {
  email: string;
}

/**
 * Signing keys, cached per isolate. Cloudflare rotates these, so the cache is
 * short and a miss simply refetches. Without it every /admin request pays an
 * extra round trip to the certs endpoint.
 */
let keyCache: { url: string; keys: Jwk[]; expires: number } | null = null;
const KEY_TTL_MS = 10 * 60 * 1000;

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

/**
 * Web Crypto in the Workers runtime types its inputs as BufferSource and will
 * not accept a Uint8Array view directly, so hand it a standalone ArrayBuffer
 * sliced to exactly this view's bytes.
 */
function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function fetchKeys(teamDomain: string): Promise<Jwk[]> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  if (keyCache && keyCache.url === url && keyCache.expires > Date.now()) return keyCache.keys;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Access certs fetch failed: ${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  keyCache = { url, keys, expires: Date.now() + KEY_TTL_MS };
  return keys;
}

/**
 * Hostnames that can only ever mean "this machine".
 *
 * Exact matches, no suffix test. "localhost.example.com" and "notlocalhost"
 * are ordinary registrable names that an attacker can own, and a check written
 * as endsWith('localhost') would accept both.
 */
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Stands in for a verified identity during local development.
 *
 * Access is enforced at Cloudflare's edge, so on localhost it does not exist:
 * no Cf-Access-Jwt-Assertion header is ever attached, verifyAccessJwt correctly
 * returns null, and every /admin/api call answers 401. The effect is that the
 * editor - the part of the site with the most behaviour and the most need for a
 * fast feedback loop - is the one part that cannot be exercised without
 * deploying. This closes that gap.
 *
 * WHY IT CANNOT OPEN PRODUCTION. The hostname is the control; the variable is
 * only the second lock. The names that route to this Worker are
 * blackshearpta.org and its workers.dev subdomain, and Cloudflare will not
 * route a request whose Host is "localhost" to either of them - such a request
 * never reaches this code. So the loopback branch is unreachable in production
 * even if someone were to mistakenly run `wrangler secret put DEV_ADMIN_EMAIL`.
 * Requiring the variable as well means a local run WITHOUT .dev.vars still
 * behaves exactly like production, which is what makes it safe to test the real
 * 401 path here too.
 *
 * Deliberately a pure function of (url, email) so scripts/check-access.mjs can
 * assert the hostname rule directly rather than by standing up a server.
 */
export function devIdentity(url: URL, email: string | undefined): AccessIdentity | null {
  if (!email) return null;
  if (!LOOPBACK.has(url.hostname)) return null;
  return { email };
}

/**
 * Returns the verified identity, or null if the token is missing, malformed,
 * expired, signed by an unknown key, or issued for a different application.
 *
 * Never throws for an untrusted token - callers treat null as "denied" and any
 * thrown error as a misconfiguration worth surfacing differently.
 */
export async function verifyAccessJwt(
  request: Request,
  teamDomain: string,
  aud: string,
): Promise<AccessIdentity | null> {
  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ??
    /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(request.headers.get('cookie') ?? '')?.[1];
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = decodeSegment(headerPart);
    payload = decodeSegment(payloadPart);
  } catch {
    return null;
  }

  // Reject anything not claiming RS256, early and explicitly.
  //
  // Note what actually stops "alg: none" and HS256 algorithm-confusion attacks:
  // the verify call below always imports the key as RSA and always checks
  // RSASSA-PKCS1-v1_5, no matter what this header says. That is the real
  // control, and removing this line does not weaken it - verified by deleting
  // it and watching scripts/check-access.mjs still pass every forgery case.
  //
  // It stays because it states the intent, and because it is the line that has
  // to change if anyone ever makes the algorithm dynamic. That refactor is
  // exactly when this becomes load-bearing.
  if (header.alg !== 'RS256') return null;

  const keys = await fetchKeys(teamDomain);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    toBuffer(base64UrlToBytes(signaturePart)),
    toBuffer(new TextEncoder().encode(`${headerPart}.${payloadPart}`)),
  );
  if (!valid) return null;

  // A valid signature only proves Cloudflare issued the token. These three
  // prove it was issued for THIS application and is still current - without
  // the aud check, a token minted for any other app on the same Access team
  // would open the editor.
  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(aud)) return null;
  if (payload.iss !== `https://${teamDomain}`) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null;

  const email = typeof payload.email === 'string' ? payload.email : '';
  if (!email) return null;
  return { email };
}
