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
 * @typedef {{ key: string, alt: string }} PostImage
 * @typedef {{ title: string, date: string, href?: string, linkLabel?: string,
 *             images?: PostImage[], cover?: string, grades?: string[],
 *             pinned?: boolean, draft?: boolean }} PostMeta
 */

/** Fields written, in this order. Anything else is dropped on save. */
const FIELDS = ['title', 'date', 'href', 'linkLabel', 'images', 'cover', 'grades', 'pinned', 'draft'];

/**
 * Fields holding a list rather than a scalar, emitted as JSON.
 *
 * YAML is a superset of JSON, so `images: [{"key":"a.jpg","alt":"A garden"}]`
 * is valid YAML that Astro's real parser reads correctly, and JSON.stringify /
 * JSON.parse handle the escaping on this side. The alternative was teaching this
 * writer to emit block sequences and nested mappings, which is a lot of new
 * surface for exactly the kind of quiet corruption the round-trip gate exists
 * to catch.
 */
const JSON_FIELDS = new Set(['images', 'grades']);

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
    if (JSON_FIELDS.has(key)) {
      // Empty list means "not set", so it is omitted rather than written as [].
      if (!Array.isArray(value) || value.length === 0) continue;
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (key === 'date') {
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
    if (key === 'pinned' || key === 'draft') {
      meta[key] = raw === 'true';
    } else if (JSON_FIELDS.has(key)) {
      // A hand-edited file could put anything here. A list field that will not
      // parse is dropped rather than crashing the read, so one bad line does
      // not make a post uneditable in /admin.
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) meta[key] = parsed;
      } catch {
        /* leave unset */
      }
    } else {
      meta[key] = parseScalar(raw);
    }
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

/**
 * The date encoded in a filename, or null.
 *
 * A safety net for the post list. Reading a file GitHub has only just committed
 * can 404 while the directory listing already shows it, and when that happened
 * the row lost its title AND its date - so it rendered as a raw filename and
 * sorted to the bottom, which is exactly where a brand new post should not be.
 * filenameFor always writes the date first, so the name itself is a usable
 * fallback sort key.
 */
export function dateFromFilename(name) {
  const match = /^(\d{4}-\d{2}-\d{2})-/.exec(String(name));
  return match ? match[1] : null;
}

/** A readable title from a filename, for the same fallback case. */
export function titleFromFilename(name) {
  const withoutDate = String(name).replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  if (!withoutDate) return String(name);
  const words = withoutDate.replace(/-/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
