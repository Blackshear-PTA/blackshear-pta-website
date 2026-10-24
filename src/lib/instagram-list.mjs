/**
 * The Instagram posts on /gallery, in D1 (migrations/0004_instagram_list.sql).
 *
 * Read by the gallery's Instagram block on every visit and written by /admin.
 * The list used to be src/content/instagram.yaml, committed through GitHub, so
 * a save appeared only after a rebuild (TASKS.md A52). Now a save is one
 * statement and the next visit shows it.
 *
 * Plain .mjs, like posts.mjs, so scripts/check-d1.mjs can exercise it against
 * real SQLite with no build step. Types are in instagram-list.d.mts.
 *
 * Checking that each address is a real post is not done here: the editor's
 * rules are in src/worker/instagram.mjs, and the table's CHECKs hold the shape.
 */
import { nowStamp } from './posts.mjs';

/** The slug its history rows carry. Generated post slugs start with a date, so this cannot collide. */
export const HISTORY_SLUG = 'instagram';

/**
 * The list, in display order, and the version it was read at.
 *
 * A missing table reads as an empty list with no version, rather than an
 * error: between this code deploying and the migration being applied, the
 * gallery shows no embeds instead of failing, and the editor says why.
 */
export async function getInstagramList(db) {
  let row;
  try {
    row = await db.prepare('SELECT urls, updated_at FROM instagram_list WHERE id = 1').first();
  } catch (error) {
    if (/no such table/i.test(String(error?.message ?? error))) {
      return { urls: [], updatedAt: null, missing: true };
    }
    throw error;
  }
  if (!row) return { urls: [], updatedAt: null, missing: false };
  let urls = [];
  try {
    const parsed = JSON.parse(String(row.urls));
    if (Array.isArray(parsed)) urls = parsed.map(String);
  } catch {
    // The CHECK makes this unreachable; an empty list is the safe reading.
  }
  return { urls, updatedAt: String(row.updated_at), missing: false };
}

/**
 * Replaces the whole list, and records who did it in the same transaction.
 *
 * `expectedUpdatedAt` is the version the editor loaded. If somebody else has
 * saved since, nothing is written and this returns 'conflict', exactly as a
 * post save does - the editor reloads and says so, rather than one person's
 * reorder silently undoing another's.
 *
 * Returns { urls, updatedAt } or 'conflict'.
 */
export async function saveInstagramList(db, { urls, editor, expectedUpdatedAt, at = nowStamp() }) {
  const list = Array.isArray(urls) ? urls.map(String) : [];
  const json = JSON.stringify(list);

  // The row exists after the migration; this covers a database built some
  // other way, and a first save then succeeds rather than conflicting forever.
  const write = expectedUpdatedAt
    ? db
        .prepare('UPDATE instagram_list SET urls = ?, updated_at = ? WHERE id = 1 AND updated_at = ?')
        .bind(json, at, String(expectedUpdatedAt))
    : db
        .prepare(
          'INSERT INTO instagram_list (id, urls, updated_at) VALUES (1, ?, ?) ' +
            'ON CONFLICT (id) DO UPDATE SET urls = excluded.urls, updated_at = excluded.updated_at',
        )
        .bind(json, at);

  const [result] = await db.batch([
    write,
    db
      .prepare(
        'INSERT INTO edits (at, editor, action, slug, title, detail) ' +
          // Recorded only when the write landed, so a lost race leaves no
          // history row for a change that did not happen.
          'SELECT ?, ?, ?, ?, ?, ? WHERE changes() > 0',
      )
      .bind(
        at,
        editor,
        'update',
        HISTORY_SLUG,
        `Instagram posts (${list.length})`,
        JSON.stringify({ urls: list }),
      ),
  ]);

  if (!result?.meta?.changes) return 'conflict';
  return { urls: list, updatedAt: at };
}
