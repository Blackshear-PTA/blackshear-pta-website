/**
 * Blackshear PTA - committed-secret gate.
 *
 * This repository is PUBLIC. Three separate documents say the site password and
 * the GitHub token must never be committed, and the password was committed
 * anyway (F28) - in the note explaining how to clean up a different mistake
 * involving it. Prose did not hold. This is the same rule with an exit code.
 *
 * WHAT IT CANNOT DO, stated plainly so nobody trusts it further than it goes:
 * it cannot recognize a secret that looks like an ordinary English word, which
 * is exactly what leaked. No grep can. What it catches is token-shaped strings,
 * private keys, a real value sitting in an .env-style assignment, and the two
 * command shapes that put a credential on a documented command line.
 *
 * A green run means "no *recognizable* secret", not "no secret".
 *
 * Run: npm run check:secrets
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !/\.(png|jpe?g|gif|webp|ico|woff2?|pdf|zip)$/i.test(f));

/** Names whose values must never appear beside them in a committed file. */
const SECRET_NAMES = ['SITE_PASSWORD', 'GITHUB_TOKEN', 'CF_ACCESS_AUD', 'CF_API_TOKEN'];

/** Values that are obviously not real credentials. */
const PLACEHOLDER = /^(replace-me|changeme|xxx+|your[-_].*|<.*>|\$\{.*\}|fake.*|example.*|\.\.\.)$/i;

const RULES = [
  {
    name: 'GitHub token',
    // eslint-disable-next-line no-useless-escape
    pattern: /\b(gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'private key block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'Slack token', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
];

/**
 * A secret value on a `wrangler secret put NAME ...` line. The value belongs at
 * the interactive prompt, never on the command line - that is exactly how the
 * stray secret in F28 was created.
 *
 * Getting this precise took three passes, and each miss is worth remembering:
 *
 *   1. Matching raw prose flagged "run `wrangler secret put SITE_PASSWORD`,
 *      then tell the board" - the words after the closing backtick read as an
 *      argument. Fixed by only looking inside code spans and command lines.
 *   2. A trailing shell comment is not a value. The documented
 *      `wrangler secret put GITHUB_TOKEN   # the token from step 2` tripped it.
 *   3. Nor is a placeholder. Documentation that writes out the shape of the
 *      command is describing the mistake, not making it.
 *
 * A gate that cries wolf on its own documentation is a gate somebody switches
 * off, which is worse than not having one.
 */
const WRANGLER_LINE = /(?:npx\s+)?wrangler\s+secret\s+(?:put|delete)\s+([A-Za-z_][A-Za-z0-9_]*)\s+(\S+)/;

/** Stand-ins a document uses to show the shape of a command. */
const ARG_PLACEHOLDER = /^(value|<.*>|\.\.\.|\$\{?[A-Z_]+\}?)$/i;

function looksLikeRealValue(span) {
  // A trailing `# comment` is annotation, not an argument.
  const command = span.split(/\s+#/)[0] ?? '';
  const match = WRANGLER_LINE.exec(command);
  if (!match) return false;
  const arg = match[2];
  return !ARG_PLACEHOLDER.test(arg) && !PLACEHOLDER.test(arg);
}

function commandSpans(line) {
  const spans = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  // A fenced or indented command line: nothing before the command but spaces
  // or a shell prompt marker.
  if (/^\s*\$?\s*(npx\s+)?wrangler\b/.test(line)) spans.push(line);
  return spans;
}

const failures = [];

for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    const where = `${file}:${i + 1}`;

    for (const rule of RULES) {
      if (rule.pattern.test(line)) failures.push(`${where}  ${rule.name}`);
    }

    if (commandSpans(line).some(looksLikeRealValue)) {
      failures.push(`${where}  secret value on a wrangler command line`);
    }

    // NAME=value or NAME: value with a value that is not a placeholder.
    for (const name of SECRET_NAMES) {
      const match = new RegExp(`\\b${name}\\b\\s*[=:]\\s*["']?([^"'\\s,}]+)`).exec(line);
      const value = match?.[1];
      if (value && !PLACEHOLDER.test(value) && !value.startsWith('env.') && value !== 'undefined') {
        failures.push(`${where}  ${name} assigned a literal value ("${value.slice(0, 12)}...")`);
      }
    }
  });
}

// .dev.vars holds the real password locally and must never be tracked.
if (files.includes('.dev.vars')) {
  failures.push('.dev.vars is tracked by git - it holds real secrets and must be ignored');
}

/**
 * Terraform state and variable files, if docs/TERRAFORM.md is ever acted on.
 *
 * Nothing in this repo uses Terraform today, so this rule catches nothing and
 * costs nothing. It exists now rather than later because the alternative is a
 * rule that lives only in prose, and F28 is what that is worth: three separate
 * documents said the password must never be committed, and it was committed.
 *
 * State is the dangerous one. `sensitive` in a Terraform schema means redacted
 * in plan output, NOT encrypted in state - so a Google SSO client secret (B6)
 * would sit in `terraform.tfstate` in plaintext. .gitignore already covers
 * these; this is the second mechanism, for the case where somebody uses
 * `git add -f` or writes the file somewhere the pattern does not reach.
 */
const TERRAFORM_STATE = /(^|\/)(.*\.tfstate(\..*)?|.*\.tfvars(\.json)?)$/;
for (const file of files) {
  if (TERRAFORM_STATE.test(file)) {
    failures.push(`${file} is tracked by git - Terraform state and tfvars can hold secrets in plaintext`);
  }
}

console.log(`Scanned ${files.length} tracked files.`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.error('\nIf a secret reached a commit, redacting the file is not enough.');
  console.error('The value is in the history and must be rotated.');
  process.exit(1);
}
console.log('No recognizable committed secrets. (Cannot detect a secret that looks like a normal word.)');
