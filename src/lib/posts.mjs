/**
 * Announcements, in D1.
 *
 * Every read and every write of the `posts` and `edits` tables goes through
 * this file - the Astro routes that render announcements, and the /admin API
 * that edits them. One module rather than SQL scattered across five callers,
 * for the same reason getAnnouncements() was one function before: the ordering
 * rule and the draft filter are the two things that must never be written
 * twice, because the second copy is where a draft leaks.
 *
 * .mjs rather than .ts, matching frontmatter.mjs and instagram.mjs, so
 * scripts/check-d1.mjs can import it directly and run it against a real SQLite
 * database. That gate is the whole reason this layer is a separate file: the
 * lesson from F32 and F38 is that logic which is hard to verify in place should
 * move somewhere it can be verified deterministically. Types live alongside in
 * posts.d.mts.
 *
 * `db` is anything shaped like a D1Database: prepare().bind().all()/.first()/
 * .run(), plus batch() for atomicity. D1 provides it in production and in
 * `wrangler dev`; check-d1.mjs provides a thin node:sqlite shim.
 *
 * @typedef {{ key: string, alt: string }} PostImage
 */

/** Columns every read selects, in a fixed order. */
const COLUMNS =
  'slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at';

/**
 * The public ordering: pinned first, then newest, then slug.
 *
 * The slug tiebreaker is not decoration. Two posts can share a date, and the
 * markdown version got its stable order from the directory listing plus a
 * stable Array.sort - so same-day posts came out in filename order. Without
 * this the database is free to return them either way round, and a list that
 * reshuffles between two page loads for no visible reason is the kind of bug
 * nobody can reproduce.
 */
const ORDER = 'pinned DESC, date DESC, slug ASC';

/** Fields a caller may write, mapped to their columns. Anything else is ignored. */
const EDITABLE = {
  title: 'title',
  date: 'date',
  href: 'href',
  linkLabel: 'link_label',
  images: 'images',
  cover: 'cover',
  grades: 'grades',
  pinned: 'pinned',
  draft: 'draft',
  body: 'body',
};

/** Fields stored as JSON text. */
const JSON_FIELDS = new Set(['images', 'grades']);

/** Fields stored as 0/1. */
const BOOL_FIELDS = new Set(['pinned', 'draft']);

/** Fields where an empty string means "not set" and is stored as NULL. */
const NULLABLE = new Set(['href', 'linkLabel', 'cover']);

/** Timestamp format, matching the SQL DEFAULTs in migrations/0001. */
export function nowStamp(date = new Date()) {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/**
 * A slug from a date and a title: `YYYY-MM-DD-some-words`.
 *
 * Only ever called for a NEW post. An existing post keeps the slug it was
 * created with, because the slug is the URL and some of these are already
 * linked from elsewhere - see docs/EDITING-CONTENT.md. Renaming on a title edit
 * would break those links silently.
 */
export function slugFor(date, title) {
  const words = String(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return `${String(date).slice(0, 10)}-${words || 'post'}`;
}

/**
 * A JSON column back into an array.
 *
 * Never throws. A row hand-edited into invalid JSON reads as an empty list
 * rather than taking down the page that renders it - the same call this
 * codebase already made in parsePost(), and for the same reason: one bad value
 * should cost one field, not the whole announcements page.
 */
function readJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** A database row as the shape the rest of the site renders. */
export function toPost(row) {
  return {
    slug: String(row.slug),
    title: String(row.title ?? ''),
    date: String(row.date ?? ''),
    href: row.href ? String(row.href) : null,
    linkLabel: row.link_label ? String(row.link_label) : null,
    images: readJsonArray(row.images)
      .filter((image) => image && typeof image === 'object')
      .map((image) => ({ key: String(image.key ?? ''), alt: String(image.alt ?? '') }))
      .filter((image) => image.key),
    cover: row.cover ? String(row.cover) : null,
    grades: readJsonArray(row.grades).map(String),
    pinned: Boolean(row.pinned),
    draft: Boolean(row.draft),
    body: String(row.body ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

/** One editable field as the value its column stores. */
function toColumn(field, value) {
  if (JSON_FIELDS.has(field)) {
    const list = Array.isArray(value) ? value : [];
    return JSON.stringify(
      field === 'images'
        ? list.map((image) => ({ key: String(image?.key ?? ''), alt: String(image?.alt ?? '').trim() }))
        : list.map(String),
    );
  }
  if (BOOL_FIELDS.has(field)) return value === true || value === 1 ? 1 : 0;
  const text = value === null || value === undefined ? '' : String(value).trim();
  if (NULLABLE.has(field)) return text || null;
  return text;
}

// ------------------------------------------------------------------- reading

/**
 * Published posts, in site order, with the total published count.
 *
 * Drafts are excluded HERE, in the query, rather than by a filter a caller has
 * to remember. There is deliberately no options bag that could turn that off:
 * the admin path uses listAll() instead, and the two names are different so
 * nobody reaches for the wrong one with a flag set wrong.
 *
 * The total comes back as a window function on the same query rather than as a
 * second round trip, because the homepage needs both - four posts and "see all
 * 12" - and one query is one D1 call.
 */
export async function listPublished(db, limit) {
  const capped = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : null;
  const sql =
    `SELECT ${COLUMNS}, count(*) OVER () AS total FROM posts WHERE draft = 0 ` +
    `ORDER BY ${ORDER}${capped === null ? '' : ' LIMIT ?'}`;
  const statement = capped === null ? db.prepare(sql) : db.prepare(sql).bind(capped);
  const { results } = await statement.all();
  const rows = results ?? [];
  return {
    posts: rows.map(toPost),
    total: rows.length ? Number(rows[0].total) : 0,
  };
}

/**
 * One published post, or null.
 *
 * A draft returns null, which is what closes the leak the markdown version
 * had: a draft was filtered out of every listing and still had a page built at
 * its own URL, reachable by anyone with the address. Here the post page and the
 * listings ask the same question of the same column, so there is no second
 * place for the answer to differ.
 */
export async function getPublished(db, slug) {
  const row = await db
    .prepare(`SELECT ${COLUMNS} FROM posts WHERE slug = ? AND draft = 0`)
    .bind(String(slug))
    .first();
  return row ? toPost(row) : null;
}

/** Every post, drafts included. /admin only. */
export async function listAll(db) {
  const { results } = await db.prepare(`SELECT ${COLUMNS} FROM posts ORDER BY ${ORDER}`).all();
  return (results ?? []).map(toPost);
}

/** One post, draft or not. /admin only. */
export async function getAny(db, slug) {
  const row = await db
    .prepare(`SELECT ${COLUMNS} FROM posts WHERE slug = ?`)
    .bind(String(slug))
    .first();
  return row ? toPost(row) : null;
}

/** Recent entries from the audit trail, newest first. */
export async function listEdits(db, limit = 50) {
  const { results } = await db
    .prepare('SELECT id, at, editor, action, slug, title, detail FROM edits ORDER BY at DESC, id DESC LIMIT ?')
    .bind(Math.max(1, Math.min(500, Math.floor(limit))))
    .all();
  return (results ?? []).map((row) => ({
    id: Number(row.id),
    at: String(row.at),
    editor: String(row.editor),
    action: String(row.action),
    slug: String(row.slug),
    title: row.title ? String(row.title) : '',
    detail: row.detail ? String(row.detail) : '',
  }));
}

// ------------------------------------------------------------------- writing

/**
 * One row of the audit trail, as a statement to put in somebody else's batch.
 *
 * Never its own call. An edit recorded separately from the change it describes
 * is an edit that can be missing when the change landed, or present when it did
 * not - and a history with holes in it is worse than no history, because it
 * gets trusted.
 */
function editStatement(db, { at, editor, action, slug, title, detail }) {
  return db
    .prepare('INSERT INTO edits (at, editor, action, slug, title, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(at, editor, action, slug, title ?? null, detail ? JSON.stringify(detail) : null);
}

/** Unpins whatever is pinned, so a new pin can be set in the same transaction. */
function unpinStatement(db, at, exceptSlug) {
  return db
    .prepare('UPDATE posts SET pinned = 0, updated_at = ? WHERE pinned = 1 AND slug <> ?')
    .bind(at, exceptSlug);
}

/**
 * Creates a post. `fields` must carry at least title, date and body.
 *
 * Returns the slug it chose. Throws if the slug is taken - the caller turns
 * that into the 409 the editor already knows how to show.
 */
export async function createPost(db, { fields, editor, at = nowStamp() }) {
  const slug = String(fields.slug || slugFor(fields.date, fields.title));

  const columns = ['slug', 'created_at', 'updated_at'];
  const values = [slug, at, at];
  for (const [field, column] of Object.entries(EDITABLE)) {
    if (!(field in fields)) continue;
    columns.push(column);
    values.push(toColumn(field, fields[field]));
  }

  const insert = db
    .prepare(`INSERT INTO posts (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
    .bind(...values);

  const statements = [];
  if (fields.pinned === true) statements.push(unpinStatement(db, at, slug));
  statements.push(insert);
  statements.push(
    editStatement(db, { at, editor, action: 'create', slug, title: fields.title, detail: null }),
  );

  await db.batch(statements);
  return slug;
}

/**
 * Writes only the fields it was given.
 *
 * THIS IS THE POINT OF THE MIGRATION, in one function. The GitHub Contents API
 * writes whole documents, so /admin had to send every field on every save, and
 * a field the form stopped sending was written as absent - which is how
 * removing the pin checkbox silently unpinned a post on the next edit. Here an
 * absent key is an absent SET clause, so a caller cannot clear a field by
 * forgetting it. The editor now sends the nine fields its form owns and never
 * mentions `pinned` at all; pinning is its own action.
 *
 * `expectedUpdatedAt` is optimistic concurrency, carried over from the sha the
 * Contents API required. Two board members editing the same post in the same
 * minute is unlikely and the second one silently losing their work is bad
 * enough to be worth one extra WHERE clause.
 *
 * Returns 'ok', 'missing', or 'conflict'.
 */
export async function updatePost(db, slug, { fields, editor, expectedUpdatedAt, at = nowStamp() }) {
  const assignments = [];
  const values = [];
  const changed = [];
  for (const [field, column] of Object.entries(EDITABLE)) {
    if (!(field in fields)) continue;
    assignments.push(`${column} = ?`);
    values.push(toColumn(field, fields[field]));
    changed.push(field);
  }
  if (assignments.length === 0) return 'ok';

  assignments.push('updated_at = ?');
  values.push(at);

  let sql = `UPDATE posts SET ${assignments.join(', ')} WHERE slug = ?`;
  values.push(String(slug));
  if (expectedUpdatedAt) {
    // Compared against the row as it stands, before this statement's own SET.
    sql += ' AND updated_at = ?';
    values.push(String(expectedUpdatedAt));
  }

  const statements = [];
  // Pinning has to unpin the incumbent in the SAME transaction, or the partial
  // unique index rejects the second post. Done here rather than left to callers
  // precisely so no caller can forget it.
  if (fields.pinned === true) statements.push(unpinStatement(db, at, String(slug)));
  statements.push(db.prepare(sql).bind(...values));

  const action =
    'pinned' in fields && changed.length === 1 ? (fields.pinned === true ? 'pin' : 'unpin') : 'update';

  /**
   * The title for the history row.
   *
   * An editor save always carries one. A pin, an unpin or a draft toggle does
   * not - and a history that reads "pinned 2026-09-10-bake-sale-this-friday"
   * where every other row names the post is a history people stop reading. One
   * extra read, on the actions that are rare by construction.
   */
  const title =
    fields.title ??
    (
      await db.prepare('SELECT title FROM posts WHERE slug = ?').bind(String(slug)).first()
    )?.title ??
    null;

  statements.push(
    editStatement(db, { at, editor, action, slug: String(slug), title, detail: { fields: changed } }),
  );

  const results = await db.batch(statements);
  const update = results[fields.pinned === true ? 1 : 0];
  if (update?.meta?.changes) return 'ok';

  // Nothing changed: either the post is gone, or somebody else saved first.
  const still = await db.prepare('SELECT slug FROM posts WHERE slug = ?').bind(String(slug)).first();
  return still ? 'conflict' : 'missing';
}

/**
 * Sets or clears the pin. At most one post is pinned; the database guarantees
 * it, this only has to ask for it.
 */
export async function setPinned(db, slug, pinned, { editor, at = nowStamp() } = {}) {
  return updatePost(db, slug, { fields: { pinned: pinned === true }, editor, at });
}

/**
 * Deletes a post, keeping enough in the audit trail to put it back.
 *
 * The whole row goes into edits.detail. `git revert` used to be the undo for a
 * mistaken delete and this migration takes that away, so the replacement has to
 * carry the content, not just the fact that something was deleted. See
 * docs/ADMIN.md for the recovery steps.
 */
export async function deletePost(db, slug, { editor, at = nowStamp() }) {
  const post = await getAny(db, slug);
  if (!post) return 'missing';

  await db.batch([
    db.prepare('DELETE FROM posts WHERE slug = ?').bind(String(slug)),
    editStatement(db, {
      at,
      editor,
      action: 'delete',
      slug: String(slug),
      title: post.title,
      detail: { post },
    }),
  ]);
  return 'ok';
}
