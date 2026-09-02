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

const { verifyAccessJwt } = await import('../src/worker/access.ts');

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

console.log(`\n${failures ? `${failures} failing` : 'all Access token checks passed'}.`);
process.exit(failures ? 1 : 0);
