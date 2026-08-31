/**
 * Registration watchdog for the PTA's domains.
 *
 * WHY THIS EXISTS
 *   blackshearpta.org is registered in a board member's personal GoDaddy
 *   account that nobody else can pay from. A renewal that quietly does not
 *   happen is the one failure that takes the whole project with it, and the
 *   only other signal would be the site going dark. This turns that into an
 *   alert days ahead.
 *
 *   The .com and .net are Cloudflare-registered on the PTA's own account and
 *   are far lower risk, but they redirect to the .org and are worth the same
 *   two seconds of checking. They are also the reason the endpoint selection
 *   below has to be right.
 *
 * WHAT IT CANNOT DO
 *   Not a backorder. If a domain does lapse, nothing here reacquires it -
 *   Cloudflare Registrar has no drop-catch service and the products that
 *   resemble one are auction entries. All this buys is time to act inside the
 *   owner-only recovery window.
 *
 * Reads RDAP rather than WHOIS: it is the registry's own JSON API, so there is
 * no free-text parsing to break, and it needs no packages on the runner.
 *
 *   node scripts/check-domain.mjs                 all domains (exit 1 = attention)
 *   node scripts/check-domain.mjs --days 30       widen the warning window
 *   WATCH_DOMAINS=a.org,b.com node scripts/check-domain.mjs
 */
const DOMAINS = (process.env.WATCH_DOMAINS ?? 'blackshearpta.org,blackshearpta.com,blackshearpta.net')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);

const argDays = process.argv.indexOf('--days');
const WARN_DAYS = argDays > -1 ? Number(process.argv[argDays + 1]) : 21;

/**
 * Endpoint by TLD. This has to be right before a 404 can be read as "the
 * domain has dropped": asking the .org registry about a .com returns 404
 * because it is the wrong registry, not because the domain is gone, and that
 * is a false alarm in the single direction that matters. rdap.org is the IANA
 * bootstrap redirector and covers whatever is not listed here.
 */
const REGISTRY = {
  org: 'https://rdap.publicinterestregistry.org/rdap',
  com: 'https://rdap.verisign.com/com/v1',
  net: 'https://rdap.verisign.com/net/v1',
};

/** Registry states meaning the domain has already lapsed or been suspended. */
const ALARM_STATUS = ['redemption period', 'pending delete', 'client hold', 'server hold', 'inactive'];

const lines = [];
const say = (s) => {
  lines.push(s);
  console.log(s);
};

/** @returns {Promise<{problems: string[], inconclusive: boolean}>} */
async function check(domain) {
  const tld = domain.slice(domain.lastIndexOf('.') + 1).toLowerCase();
  const authoritative = tld in REGISTRY;
  const url = `${REGISTRY[tld] ?? 'https://rdap.org'}/domain/${domain}`;

  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/rdap+json' } });
  } catch (err) {
    // A network blip must not page anyone.
    say(`  ${domain}: RDAP unreachable (${err.message}). Inconclusive.`);
    return { problems: [], inconclusive: true };
  }

  if (res.status === 404) {
    if (!authoritative) {
      say(`  ${domain}: no record, but no known registry for .${tld} was queried. Inconclusive.`);
      return { problems: [], inconclusive: true };
    }
    say(`  ${domain}: NOT REGISTERED - it has dropped.`);
    return { problems: [`${domain} is not registered at all. It has dropped.`], inconclusive: false };
  }
  if (!res.ok) {
    say(`  ${domain}: RDAP returned ${res.status}. Inconclusive.`);
    return { problems: [], inconclusive: true };
  }

  const data = await res.json();
  const statuses = (data.status ?? []).map((s) => s.toLowerCase());
  const events = Object.fromEntries((data.events ?? []).map((e) => [e.eventAction, e.eventDate]));
  const registrar =
    (data.entities ?? []).find((e) => (e.roles ?? []).includes('registrar'))
      ?.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3] ?? 'unknown';

  const expiry = events.expiration ? new Date(events.expiration) : null;
  const daysLeft = expiry ? Math.floor((expiry - Date.now()) / 86_400_000) : null;

  const problems = [];
  const bad = statuses.filter((s) => ALARM_STATUS.includes(s));
  if (bad.length) {
    problems.push(
      `${domain} registry status is "${bad.join(', ')}". It has lapsed or been suspended. ` +
        `There is still an owner-only recovery window, but it closes - act today.`,
    );
  }
  if (daysLeft !== null && daysLeft < 0) {
    problems.push(`${domain} expired ${Math.abs(daysLeft)} days ago and has not been renewed.`);
  } else if (daysLeft !== null && daysLeft <= WARN_DAYS) {
    problems.push(
      `${domain} expires in ${daysLeft} days and the registry still shows the old date, ` +
        `so no renewal has been processed.`,
    );
  }

  const flag = problems.length ? 'NEEDS ATTENTION' : 'ok';
  say(
    `  ${domain.padEnd(22)} ${String(daysLeft ?? '?').padStart(4)} days  ` +
      `${(statuses.join(',') || 'none').padEnd(18)} ${registrar.padEnd(20)} ${flag}`,
  );
  return { problems, inconclusive: false };
}

say(`  ${'domain'.padEnd(22)} ${'left'.padStart(4)}       ${'status'.padEnd(18)} ${'registrar'.padEnd(20)} `);
say(`  ${'-'.repeat(78)}`);

const results = await Promise.all(DOMAINS.map(check));
const problems = results.flatMap((r) => r.problems);

if (problems.length === 0) {
  say(`\nOK. Nothing needs attention.`);
  process.exit(0);
}

say(`\nNEEDS ATTENTION`);
for (const p of problems) say(`  - ${p}`);
say(
  `\nblackshearpta.org is the one that matters: it is the live site, and the other\n` +
    `two only redirect to it. Its registrant is the GoDaddy account holder. Jon's\n` +
    `delegate access is "Domains Only", which cannot pay - see C1b in TASKS.md for\n` +
    `the durable fix.`,
);
process.exit(1);
