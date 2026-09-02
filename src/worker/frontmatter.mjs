/**
 * Frontmatter read/write for announcement markdown files.
 *
 * Deliberately hand-rolled and deliberately narrow. A YAML library would be
 * more general, but general is the problem: /admin writes files that Astro's
 * content loader then parses with a real YAML parser, and the only way that
 * round trip stays safe is if the writer emits a small, boring subset. So this
 * quotes every string, always, and understands only the fields the
 * announcements schema declares.
 *
 * .mjs rather than .ts so scripts/check-frontmatter.mjs can import it directly
 * and round-trip real values through it. The failure this guards against is
 * quiet: a title containing a colon or a quote produces a file that still looks
 * fine in the editor and breaks the next build.
 *
 * @typedef {{ title: string, date: string, href?: string, linkLabel?: string,
 *             image?: string, imageAlt?: string, pinned?: boolean,
 *             draft?: boolean }} PostMeta
 */

/** Fields written, in this order. Anything else is dropped on save. */
const FIELDS = ['title', 'date', 'href', 'linkLabel', 'image', 'imageAlt', 'pinned', 'draft'];

/**
 * A double-quoted YAML scalar. Only backslash and double-quote need escaping
 * inside one, plus the control characters that YAML will not carry literally.
 * Quoting unconditionally means a title of "No: really" or "2026" cannot be
 * reinterpreted as a mapping or a number.
 */
export function yamlString(value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/** Inverse of yamlString for the quoted form, plus bare scalars. */
function parseScalar(raw) {
  const text = raw.trim();
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    // One pass, not a chain of .replace() calls. Chaining is wrong for any
    // input containing a literal backslash: unescaping \t before \\ turns the
    // \\t in an escaped "path\to" into a tab character. Consuming each
    // backslash-plus-one-character together can only ever read an escape the
    // writer actually emitted.
    const UNESCAPE = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' };
    return text.slice(1, -1).replace(/\\([\s\S])/g, (_, ch) => UNESCAPE[ch] ?? ch);
  }
  if (text.startsWith("'") && text.endsWith("'") && text.length >= 2) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  return text;
}

/**
 * Serialise a post to a complete markdown file.
 *
 * `date` goes out unquoted so the schema's z.coerce.date() sees a YAML date
 * rather than a string. Booleans are omitted when false: the schema defaults
 * both to false, and a file full of `pinned: false` is noise for whoever opens
 * it in the repo.
 */
export function stringifyPost(meta, body) {
  const lines = ['---'];
  for (const key of FIELDS) {
    const value = meta[key];
    if (value === undefined || value === null || value === '') continue;
    if (key === 'date') {
      lines.push(`date: ${String(value).slice(0, 10)}`);
    } else if (typeof value === 'boolean') {
      if (value) lines.push(`${key}: true`);
    } else {
      lines.push(`${key}: ${yamlString(value)}`);
    }
  }
  lines.push('---', '');
  // Exactly one trailing newline, so re-saving an unchanged post is a no-op
  // diff rather than a whitespace-only commit.
  return `${lines.join('\n')}${String(body ?? '').trim()}\n`;
}

/**
 * Split a markdown file into metadata and body.
 * Returns null when there is no frontmatter block at all.
 */
export function parsePost(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) return null;

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at === -1) continue;
    const key = line.slice(0, at).trim();
    if (!FIELDS.includes(key)) continue;
    const raw = line.slice(at + 1).trim();
    if (key === 'pinned' || key === 'draft') meta[key] = raw === 'true';
    else meta[key] = parseScalar(raw);
  }
  return { meta, body: (match[2] ?? '').trim() };
}

/**
 * `YYYY-MM-DD-slug.md` from a date and title. The date prefix is for humans
 * reading a directory listing; the site orders by the `date` field.
 */
export function filenameFor(date, title) {
  const slug = String(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return `${String(date).slice(0, 10)}-${slug || 'post'}.md`;
}
