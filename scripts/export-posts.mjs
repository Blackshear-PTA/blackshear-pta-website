/**
 * Blackshear PTA - export every announcement out of D1.
 *
 * Run: npm run export:posts            (the local database)
 *      npm run export:posts -- --remote (the live one)
 *
 * WHY. Content used to be markdown files in a public git repository, which
 * meant a backup existed whether anyone thought about it or not: every clone
 * was one. Rows in a managed database have no such property, and the PTA is a
 * volunteer board whose members change every year. This is the answer to "what
 * if we lose the Cloudflare account", and it is also what makes the migration
 * reversible - the markdown it writes is the same format src/content/
 * announcements/ used, so putting the site back on files is a copy.
 *
 * Writes three things into exports/ (gitignored):
 *
 *   exports/posts/<slug>.md  one file per post, frontmatter and body
 *   exports/posts.json       the rows verbatim, including drafts
 *   exports/edits.json       the audit trail - who changed what, when
 *
 * Shells out to wrangler rather than talking to the D1 HTTP API directly, so it
 * uses the login somebody already has and there is no token to issue, store or
 * leak. `check:secrets` exists because of the last one.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringifyPost } from '../src/worker/frontmatter.mjs';
import { toPost } from '../src/lib/posts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'exports');
const DATABASE = 'blackshear-pta';

const remote = process.argv.includes('--remote');
const where = remote ? '--remote' : '--local';

/**
 * One query, through wrangler.
 *
 * --json makes wrangler print the result and nothing else, but it has been
 * known to emit a banner first depending on the version and whether an update
 * is available, so the JSON is located rather than assumed to start at byte
 * zero. A parse failure here would otherwise read as "the database is empty".
 */
function query(sql) {
  let raw;
  try {
    raw = execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', DATABASE, where, '--json', '--command', sql],
      { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    console.error(`\nwrangler failed. Its output:\n${error.stderr || error.stdout || error.message}`);
    if (remote) {
      console.error(
        '\nFor the live database you need to be logged in: npx wrangler login',
      );
    } else {
      console.error(
        '\nFor the local database, apply the migrations first:\n' +
          `  npx wrangler d1 migrations apply ${DATABASE} --local`,
      );
    }
    process.exit(1);
  }

  const start = raw.indexOf('[');
  if (start === -1) {
    console.error(`Could not find JSON in wrangler's output:\n${raw}`);
    process.exit(1);
  }
  const parsed = JSON.parse(raw.slice(start));
  return parsed[0]?.results ?? [];
}

console.log(`Exporting from the ${remote ? 'REMOTE' : 'local'} database...`);

const rows = query(
  'SELECT slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, ' +
    'created_at, updated_at FROM posts ORDER BY date DESC, slug ASC',
);
const edits = query(
  'SELECT id, at, editor, action, slug, title, detail FROM edits ORDER BY at DESC, id DESC',
);

const posts = rows.map(toPost);

// Cleared first, so a post deleted since the last export does not linger as a
// file and get mistaken for something still live.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'posts'), { recursive: true });

for (const post of posts) {
  /**
   * Deliberately the same shape src/content/announcements/*.md had, written by
   * the same function that wrote those files. That is what makes this an undo
   * button rather than just a backup: these can be dropped back into the
   * content directory as they are.
   */
  const markdown = stringifyPost(
    {
      title: post.title,
      date: post.date,
      href: post.href ?? undefined,
      linkLabel: post.linkLabel ?? undefined,
      images: post.images,
      cover: post.cover ?? undefined,
      grades: post.grades,
      pinned: post.pinned,
      draft: post.draft,
    },
    post.body,
  );
  writeFileSync(join(OUT, 'posts', `${post.slug}.md`), markdown);
}

writeFileSync(join(OUT, 'posts.json'), `${JSON.stringify(posts, null, 2)}\n`);
writeFileSync(join(OUT, 'edits.json'), `${JSON.stringify(edits, null, 2)}\n`);

const drafts = posts.filter((p) => p.draft).length;
console.log(`  exports/posts/            ${posts.length} markdown files (${drafts} draft)`);
console.log(`  exports/posts.json        ${posts.length} posts`);
console.log(`  exports/edits.json        ${edits.length} history entries`);
console.log('\nexports/ is gitignored. Keep a copy somewhere that is not this machine.');
