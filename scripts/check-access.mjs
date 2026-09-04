/**
 * Blackshear PTA - Cloudflare Access token verification gate.
 *
 * verifyAccessJwt is what stands between a signed-in board member and anyone
 * else being able to commit to the repository through /admin. Cloudflare Access
 * blocks unauthenticated traffic at the edge too, but that is dashboard
 * configuration and this is the part that lives in the repo, so this is the
 * part that gets tested.
 *
 * Mints real RS256 tokens against a throwaway keypair and serves a matching
 * JWKS through a stubbed fetch, then checks that every forgery is refused.
 * The cases are the classic JWT failures - none of these are theoretical, they
 * are how JWT verification is actually broken in the wild.
 *
 * Run: npm run check:access
 */
import { generateKeyPairSync, sign as nodeSign, createHmac } from 'node:crypto';

const TEAM = 'blackshearpta.cloudflareaccess.com';
const AUD = 'aud-tag-for-the-admin-app';
const KID = 'test-key-1';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' });

// Stub the certs endpoint the module fetches.
globalThis.fetch = async (url) => {
  if (String(url) === `https://${TEAM}/cdn-cgi/access/certs`) {
    return new Response(JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: 'RS256' }] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('not found', { status: 404 });
};

const { verifyAccessJwt, devIdentity } = await import('../src/worker/access.ts');

const b64 = (obj) =>
  Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const now = () => Math.floor(Date.now() / 1000);

function mint({ header = {}, payload = {}, signer = 'rs256' } = {}) {
  const h = b64({ alg: 'RS256', kid: KID, typ: 'JWT', ...header });
  const p = b64({
    aud: [AUD], iss: `https://${TEAM}`, email: 'board@blackshearpta.org',
    exp: now() + 600, iat: now() - 10, ...payload,
  });
  const data = `${h}.${p}`;
  let sig;
  if (signer === 'none') sig = '';
  else if (signer === 'hmac') {
    sig = createHmac('sha256', 'secret').update(data).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } else {
    sig = nodeSign('sha256', Buffer.from(data), privateKey).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return `${data}.${sig}`;
}

const req = (token, viaCookie = false) =>
  new Request('https://blackshearpta.org/admin/api/session', {
    headers: viaCookie
      ? { cookie: `CF_Authorization=${token}; other=x` }
      : token ? { 'Cf-Access-Jwt-Assertion': token } : {},
  });

let failures = 0;
async function expect(name, token, shouldPass, viaCookie = false) {
  let result;
  try {
    result = await verifyAccessJwt(req(token, viaCookie), TEAM, AUD);
  } catch (error) {
    result = null;
    if (shouldPass) { failures++; console.error(`  FAIL ${name}\n       threw: ${error.message}`); return; }
  }
  const passed = shouldPass ? result?.email === 'board@blackshearpta.org' : result === null;
  if (passed) console.log(`  ok   ${name}`);
  else { failures++; console.error(`  FAIL ${name}\n       expected ${shouldPass ? 'accept' : 'REJECT'}, got ${JSON.stringify(result)}`); }
}

console.log('accepts:');
await expect('valid token, header', mint(), true);
await expect('valid token, CF_Authorization cookie', mint(), true, true);
await expect('aud as a bare string not an array', mint({ payload: { aud: AUD } }), true);

console.log('\nrejects:');
await expect('no token at all', '', false);
await expect('garbage', 'not.a.jwt', false);
await expect('two segments only', 'aaa.bbb', false);
await expect('alg: none', mint({ header: { alg: 'none' }, signer: 'none' }), false);
await expect('algorithm confusion (HS256)', mint({ header: { alg: 'HS256' }, signer: 'hmac' }), false);
await expect('unknown signing key (kid)', mint({ header: { kid: 'some-other-key' } }), false);
await expect('expired', mint({ payload: { exp: now() - 30 } }), false);
await expect('not yet valid (nbf far future)', mint({ payload: { nbf: now() + 3600 } }), false);
await expect('wrong audience', mint({ payload: { aud: ['a-different-app'] } }), false);
await expect('wrong issuer', mint({ payload: { iss: 'https://evil.cloudflareaccess.com' } }), false);
await expect('no email claim', mint({ payload: { email: undefined } }), false);
await expect('empty email claim', mint({ payload: { email: '' } }), false);

// Tamper: swap the payload for one claiming a different user, keep the old signature.
{
  const good = mint();
  const [h, , s] = good.split('.');
  const forged = `${h}.${b64({ aud: [AUD], iss: `https://${TEAM}`, email: 'attacker@example.com', exp: now() + 600 })}.${s}`;
  await expect('tampered payload, original signature', forged, false);
}

/**
 * The local-development sign-in.
 *
 * devIdentity() hands out an identity with no token at all, so the thing worth
 * testing is not that it works - it is that the hostname rule is the real lock
 * and holds even when the variable IS set. The cases below are what a mistake
 * would look like: the variable leaking into production, and a hostname check
 * written loosely enough that a name an attacker can register satisfies it.
 */
console.log('\ndev sign-in:');
const DEV_EMAIL = 'parent@blackshearpta.org';

function expectDev(name, href, email, shouldPass) {
  const result = devIdentity(new URL(href), email);
  const passed = shouldPass ? result?.email === DEV_EMAIL : result === null;
  if (passed) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.error(
      `  FAIL ${name}\n       expected ${shouldPass ? 'accept' : 'REJECT'}, got ${JSON.stringify(result)}`,
    );
  }
}

expectDev('localhost with the var set', 'http://localhost:8787/admin/api/session', DEV_EMAIL, true);
expectDev('127.0.0.1 with the var set', 'http://127.0.0.1:8787/admin/api/session', DEV_EMAIL, true);
expectDev('IPv6 loopback with the var set', 'http://[::1]:8787/admin/api/session', DEV_EMAIL, true);

expectDev('localhost, var unset', 'http://localhost:8787/admin/api/session', undefined, false);
expectDev('localhost, var empty', 'http://localhost:8787/admin/api/session', '', false);
// The one that matters: the variable set somewhere it should never be.
expectDev('production host, var set', 'https://blackshearpta.org/admin/api/session', DEV_EMAIL, false);
expectDev('workers.dev host, var set', 'https://blackshear-pta.workers.dev/admin/api/session', DEV_EMAIL, false);
// Names an attacker can register, against a suffix or substring check.
expectDev('localhost.example.com', 'https://localhost.example.com/admin/api/session', DEV_EMAIL, false);
expectDev('notlocalhost', 'https://notlocalhost/admin/api/session', DEV_EMAIL, false);
expectDev('evil.com/?h=localhost', 'https://evil.com/admin/api/session?h=localhost', DEV_EMAIL, false);
expectDev('127.0.0.1.example.com', 'https://127.0.0.1.example.com/admin/api/session', DEV_EMAIL, false);

console.log(`\n${failures ? `${failures} failing` : 'all Access token checks passed'}.`);
process.exit(failures ? 1 : 0);
