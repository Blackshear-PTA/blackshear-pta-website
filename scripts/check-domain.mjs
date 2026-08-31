/**
 * Registration watchdog for blackshearpta.org.
 *
 * WHY THIS EXISTS
 *   The domain is registered in a board member's personal GoDaddy account that
 *   nobody else can pay from. A renewal that quietly does not happen is the one
 *   failure that takes the whole project with it, and the only signal would be
 *   the site going dark. This turns that into an alert days ahead.
 *
 * WHAT IT CANNOT DO
 *   Not a backorder. If the domain does lapse, nothing here reacquires it -
 *   Cloudflare Registrar has no drop-catch service and no registrar sells an
 *   "auto-buy the moment it frees up" that is not really an auction entry. All
 *   this buys is time to act inside the owner-only recovery window.
 *
 * Reads RDAP rather than WHOIS: it is the registry's own JSON API, so there is
 * no free-text parsing to break, and it needs no packages on the runner.
 *
 *   node scripts/check-domain.mjs                     (exit 1 = needs attention)
 *   node scripts/check-domain.mjs --days 30
 */
const DOMAIN = process.env.WATCH_DOMAIN ?? 'blackshearpta.org';

/**
 * Endpoint by TLD. This has to be right before a 404 can be read as "the
 * domain has dropped": asking the .org registry about a .com returns 404
 * because it is the wrong registry, not because the domain is gone, and that
 * is a false alarm in the one direction that matters. rdap.org is the IANA
 * bootstrap redirector and covers everything else.
 */
const TLD = DOMAIN.slice(DOMAIN.lastIndexOf('.') + 1).toLowerCase();
const REGISTRY = {
  org: 'https://rdap.publicinterestregistry.org/rdap',
};
const AUTHORITATIVE = TLD in REGISTRY;
const RDAP = `${REGISTRY[TLD] ?? 'https://rdap.org'}/domain/${DOMAIN}`;

const argDays = process.argv.indexOf('--days');
const WARN_DAYS = argDays > -1 ? Number(process.argv[argDays + 1]) : 21;

/** Registry states that mean the domain has already lapsed or been suspended. */
const ALARM_STATUS = [
  'redemption period',
  'pending delete',
  'client hold',
  'server hold',
  'inactive',
];

const out = [];
const say = (s) => {
  out.push(s);
  console.log(s);
};

let res;
try {
  res = await fetch(RDAP, { headers: { Accept: 'application/rdap+json' } });
} catch (err) {
  // A network blip must not page anyone. Report and pass.
  console.log(`RDAP unreachable (${err.message}). Treating as inconclusive, not an alert.`);
  process.exit(0);
}

if (res.status === 404) {
  if (!AUTHORITATIVE) {
    // Could equally mean the bootstrap sent us somewhere unhelpful.
    console.log(`RDAP says no record for ${DOMAIN}, but this run did not query a known`);
    console.log(`registry for .${TLD}, so that is not trustworthy. Not alerting.`);
    process.exit(0);
  }
  say(`ALERT: ${DOMAIN} is not registered at all. It has dropped.`);
  process.exit(1);
}
if (!res.ok) {
  console.log(`RDAP returned ${res.status}. Inconclusive, not an alert.`);
  process.exit(0);
}

const data = await res.json();
const statuses = (data.status ?? []).map((s) => s.toLowerCase());
const events = Object.fromEntries(
  (data.events ?? []).map((e) => [e.eventAction, e.eventDate]),
);
const registrar =
  (data.entities ?? [])
    .find((e) => (e.roles ?? []).includes('registrar'))
    ?.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3] ?? 'unknown';

const expiry = events.expiration ? new Date(events.expiration) : null;
const daysLeft = expiry ? Math.floor((expiry - Date.now()) / 86_400_000) : null;

say(`${DOMAIN}`);
say(`  registrar   ${registrar}`);
say(`  status      ${statuses.join(', ') || 'none reported'}`);
say(`  expires     ${expiry ? expiry.toISOString().slice(0, 10) : 'unknown'}`);
say(`  days left   ${daysLeft ?? 'unknown'}`);

const problems = [];

const bad = statuses.filter((s) => ALARM_STATUS.includes(s));
if (bad.length) {
  problems.push(
    `Registry status is "${bad.join(', ')}". The domain has lapsed or been suspended. ` +
      `There is still an owner-only recovery window, but it closes - act today.`,
  );
}

if (daysLeft !== null && daysLeft < 0) {
  problems.push(`Expired ${Math.abs(daysLeft)} days ago and has not been renewed.`);
} else if (daysLeft !== null && daysLeft <= WARN_DAYS) {
  problems.push(
    `Expires in ${daysLeft} days and the registry still shows the old date, ` +
      `so no renewal has been processed.`,
  );
}

if (problems.length === 0) {
  say(`\nOK. Nothing needs attention.`);
  process.exit(0);
}

say(`\nNEEDS ATTENTION`);
for (const p of problems) say(`  - ${p}`);
say(
  `\nWho can fix it: the registrant on the GoDaddy account. Jon's delegate access is\n` +
    `"Domains Only", which cannot pay. Getting that raised to a purchase-capable level\n` +
    `is the durable fix; see TASKS.md.`,
);
process.exit(1);
