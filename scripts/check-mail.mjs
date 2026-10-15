/**
 * Mail authentication watchdog for blackshearpta.org.
 *
 * WHY THIS EXISTS
 *   F43: the SPF record pointed at a GoDaddy hostname that stopped existing the
 *   day DNS moved to Cloudflare, and nothing noticed for a month. An SPF
 *   permerror with DMARC at p=quarantine sends the PTA's own mail to spam, and
 *   the only symptom is parents quietly not reading it. This looks, so that
 *   nobody has to remember to.
 *
 * WHAT IT CHECKS, against public resolvers (1.1.1.1 and 8.8.8.8), not the
 * local one, so a stale cache on this machine cannot pass a broken zone:
 *   - MX points at Google. Cloudflare Email Routing, if ever switched on,
 *     overwrites MX and cuts off every Workspace mailbox (C7).
 *   - SPF: exactly one v=spf1 record, every include resolves to exactly one
 *     record of its own, at most 10 DNS lookups in total (the limit past which
 *     receivers return permerror), Google's include present, and a ~all or
 *     -all at the end.
 *   - DKIM: google._domainkey publishes a key.
 *   - DMARC: exactly one record, a policy that is not "none", and reports going
 *     to an address on this domain (B12 sends them to dmarc@).
 *
 *   npm run check:mail          exit 1 = something needs attention
 *   MAIL_DOMAIN=example.org npm run check:mail
 */
import { Resolver } from 'node:dns/promises';

const DOMAIN = process.env.MAIL_DOMAIN ?? 'blackshearpta.org';
const resolver = new Resolver({ timeout: 5000, tries: 2 });
resolver.setServers(['1.1.1.1', '8.8.8.8']);

let failures = 0;
const ok = (what) => console.log(`  ok    ${what}`);
const fail = (what) => {
  failures++;
  console.log(`  FAIL  ${what}`);
};

/** TXT records as whole strings: DNS splits long ones into 255-byte chunks. */
async function txt(name) {
  try {
    return (await resolver.resolveTxt(name)).map((chunks) => chunks.join(''));
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') return [];
    throw error;
  }
}

const spfOf = (records) => records.filter((r) => /^v=spf1(\s|$)/i.test(r));

/**
 * Walks an SPF record the way a receiver does, counting the mechanisms that
 * cost a DNS lookup. Returns the count; records problems through fail().
 */
async function walkSpf(name, record, seen = new Set()) {
  if (seen.has(name)) {
    fail(`SPF include loop at ${name}`);
    return 0;
  }
  seen.add(name);
  let lookups = 0;
  for (const term of record.split(/\s+/).slice(1)) {
    const mechanism = term.replace(/^[-+~?]/, '').toLowerCase();
    const target = mechanism.split(/[:=]/)[1];
    if (/^(include:|redirect=)/.test(mechanism)) {
      lookups++;
      const found = spfOf(await txt(target));
      if (found.length !== 1) {
        fail(`SPF ${mechanism} -> ${found.length} SPF records at ${target}; receivers treat that as permerror`);
        continue;
      }
      lookups += await walkSpf(target, found[0], seen);
    } else if (/^(a|mx|ptr|exists)(:|\/|$)/.test(mechanism)) {
      lookups++;
    }
  }
  return lookups;
}

console.log(`Mail authentication for ${DOMAIN}`);

const mx = await resolver.resolveMx(DOMAIN).catch(() => []);
const google = mx.filter((r) => /(^|\.)(google\.com|googlemail\.com)$/i.test(r.exchange));
if (mx.length && google.length === mx.length) ok(`MX: ${mx.length} record(s), all Google`);
else fail(`MX: expected only Google mail servers, found ${mx.map((r) => r.exchange).join(', ') || 'none'}`);

const spf = spfOf(await txt(DOMAIN));
if (spf.length !== 1) {
  fail(`SPF: expected exactly one v=spf1 record, found ${spf.length}`);
} else {
  const record = spf[0];
  const lookups = await walkSpf(DOMAIN, record);
  if (lookups <= 10) ok(`SPF: ${lookups} DNS lookup(s), within the limit of 10`);
  else fail(`SPF: ${lookups} DNS lookups; more than 10 is a permerror`);
  if (/\binclude:_spf\.google\.com\b/i.test(record)) ok('SPF: includes Google (_spf.google.com)');
  else fail('SPF: does not include _spf.google.com, so Workspace mail fails SPF');
  if (/\s[-~]all$/i.test(record.trim())) ok(`SPF: ends ${record.trim().split(/\s+/).pop()}`);
  else fail(`SPF: should end with ~all or -all: ${record}`);
}

const dkim = (await txt(`google._domainkey.${DOMAIN}`)).find((r) => /v=DKIM1/i.test(r));
const key = dkim?.match(/\bp=([^;\s]*)/i)?.[1] ?? '';
if (key.length > 100) ok(`DKIM: google._domainkey publishes a key (${key.length} characters)`);
else fail('DKIM: no key at google._domainkey. Admin console -> Apps -> Gmail -> Authenticate email');

const dmarc = (await txt(`_dmarc.${DOMAIN}`)).filter((r) => /^v=DMARC1/i.test(r));
if (dmarc.length !== 1) {
  fail(`DMARC: expected exactly one record at _dmarc.${DOMAIN}, found ${dmarc.length}`);
} else {
  const policy = dmarc[0].match(/\bp=(\w+)/i)?.[1]?.toLowerCase();
  if (policy === 'quarantine' || policy === 'reject') ok(`DMARC: p=${policy}`);
  else fail(`DMARC: p=${policy ?? 'missing'}; spoofed mail is not stopped`);
  const rua = dmarc[0].match(/\brua=([^;]+)/i)?.[1] ?? '';
  const ours = rua.split(',').map((a) => a.trim()).filter((a) => new RegExp(`^mailto:[^@]+@${DOMAIN.replace('.', '\\.')}$`, 'i').test(a));
  if (ours.length) ok(`DMARC: reports go to ${ours.map((a) => a.slice(7)).join(', ')}`);
  else fail(`DMARC: reports do not go to an address on ${DOMAIN} (rua=${rua || 'none'})`);
}

console.log(failures ? `\n${failures} problem(s).` : '\nOK. Mail authentication is in order.');
process.exit(failures ? 1 : 0);
