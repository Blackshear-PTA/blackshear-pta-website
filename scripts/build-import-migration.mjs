/**
 * Blackshear PTA - generates the migration that imports the existing posts.
 *
 * Run: npm run build:import
 *
 * WHY A GENERATED MIGRATION RATHER THAN AN IMPORT SCRIPT. "Safe to re-run" is
 * the requirement, and wrangler already solves that for migrations: it records
 * what it has applied in a d1_migrations table and will not apply a file twice,
 * against local and remote separately. An import script would have to
 * reimplement that, and reimplement it correctly on the one run where it
 * matters. The generated SQL is also a reviewable diff - the five posts are
 * visible in the pull request, which a script reading files at some future
 * moment is not.
 *
 * Belt and braces anyway: the INSERTs are OR IGNORE on the slug primary key and
 * the audit rows are guarded by NOT EXISTS, so applying the file by hand a
 * second time changes nothing. Note that OR IGNORE does NOT swallow the
 * schema's RAISE(ABORT) triggers - alt text and cover are still enforced, so a
 * bad post fails loudly here rather than arriving half-formed.
 *
 * The markdown files stay in the repo, untouched, until the D1 path is proven
 * in production. Removing them is a separate commit; see docs/ADMIN.md.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePost } from '../src/worker/frontmatter.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'src/content/announcements');
const TARGET = join(root, 'migrations/0002_import_existing_announcements.sql');

/**
 * Who the audit trail credits for these rows.
 *
 * Every other edit records the editor's address, verified from the Access JWT.
 * An import has no person behind it, and inventing one would put a name against
 * work they did not do. This says what actually happened instead, and the
 * detail column names the file each post came from so `git log` on that path is
 * still reachable for anything before the cutover.
 */
const IMPORTER = 'src/content/announcements (git)';

/** A SQL string literal. Single quotes doubled; nothing else needs escaping. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;
/** NULL for an absent or empty value, a quoted literal otherwise. */
const qOrNull = (value) => (value === undefined || value === null || value === '' ? 'NULL' : q(value));

const problems = [];
const rows = [];

const files = readdirSync(SOURCE)
  .filter((name) => name.endsWith('.md'))
  .sort();

for (const file of files) {
  const parsed = parsePost(readFileSync(join(SOURCE, file), 'utf8'));
  if (!parsed) {
    problems.push(`${file}: no frontmatter block`);
    continue;
  }
  const { meta, body } = parsed;
  const slug = file.replace(/\.md$/, '');

  // The URL must not change, so the slug is the filename and nothing derives it
  // from the title. Assert the shape the schema's CHECK will demand anyway,
  // here, where the message can name the file.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) problems.push(`${file}: slug "${slug}" is not URL-safe`);
  if (!meta.title) problems.push(`${file}: no title`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(meta.date).slice(0, 10))) {
    problems.push(`${file}: date "${meta.date}" is not YYYY-MM-DD`);
  }
  if (!String(body).trim()) problems.push(`${file}: empty body`);

  const images = Array.isArray(meta.images) ? meta.images : [];
  for (const image of images) {
    if (!String(image?.alt ?? '').trim()) problems.push(`${file}: image ${image?.key} has no alt text`);
  }
  if (meta.cover && !images.some((image) => image.key === meta.cover)) {
    problems.push(`${file}: cover "${meta.cover}" is not one of this post's images`);
  }

  const date = String(meta.date).slice(0, 10);
  rows.push({
    slug,
    title: String(meta.title),
    date,
    href: meta.href ?? null,
    linkLabel: meta.linkLabel ?? null,
    images: JSON.stringify(images.map((i) => ({ key: String(i.key), alt: String(i.alt).trim() }))),
    cover: meta.cover ?? null,
    grades: JSON.stringify(Array.isArray(meta.grades) ? meta.grades.map(String) : []),
    pinned: meta.pinned ? 1 : 0,
    draft: meta.draft ? 1 : 0,
    body: String(body).trim(),
    // The publication date, not the moment this file was generated. It is the
    // only timestamp these posts actually have - markdown carried no authoring
    // time - and a made-up "imported at" would read as though somebody wrote
    // five posts in one second.
    stamp: `${date}T00:00:00Z`,
    source: `src/content/announcements/${file}`,
  });
}

const pinned = rows.filter((row) => row.pinned);
if (pinned.length > 1) {
  problems.push(
    `${pinned.length} posts are pinned (${pinned.map((r) => r.slug).join(', ')}) - ` +
      'the schema allows at most one',
  );
}

if (problems.length) {
  console.error('Cannot generate the import migration:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const lines = [
  '-- Blackshear PTA - the five announcements that were markdown files in git.',
  '--',
  '-- GENERATED by scripts/build-import-migration.mjs from',
  '-- src/content/announcements/*.md. Do not hand-edit: regenerate it.',
  '--',
  '-- Safe to re-run. The posts are OR IGNORE on the slug primary key and the',
  '-- audit rows are guarded by NOT EXISTS, so a second application is a no-op.',
  '-- Note that OR IGNORE does not disarm the schema triggers: a post with a',
  '-- missing alt text or a cover that is not one of its own images still fails',
  '-- loudly rather than arriving half-formed.',
  '--',
  '-- Slugs are the markdown filenames minus ".md", so every URL is unchanged.',
  '',
];

for (const row of rows) {
  lines.push(
    `-- ${row.source}`,
    'INSERT OR IGNORE INTO posts',
    '  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)',
    'VALUES (',
    `  ${q(row.slug)},`,
    `  ${q(row.title)},`,
    `  ${q(row.date)},`,
    `  ${qOrNull(row.href)},`,
    `  ${qOrNull(row.linkLabel)},`,
    `  ${q(row.images)},`,
    `  ${qOrNull(row.cover)},`,
    `  ${q(row.grades)},`,
    `  ${row.pinned},`,
    `  ${row.draft},`,
    `  ${q(row.body)},`,
    `  ${q(row.stamp)},`,
    `  ${q(row.stamp)}`,
    ');',
    '',
    'INSERT INTO edits (at, editor, action, slug, title, detail)',
    `SELECT ${q(row.stamp)}, ${q(IMPORTER)}, 'import', ${q(row.slug)}, ${q(row.title)},`,
    `       ${q(JSON.stringify({ source: row.source }))}`,
    `WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = ${q(row.slug)} AND action = 'import');`,
    '',
  );
}

writeFileSync(TARGET, lines.join('\n'));
console.log(`Wrote ${TARGET.replace(`${root}/`, '')}`);
console.log(`  ${rows.length} posts: ${rows.map((r) => r.slug).join(', ')}`);
console.log(`  pinned: ${pinned.length ? pinned[0].slug : 'none'}`);
console.log(`  drafts: ${rows.filter((r) => r.draft).map((r) => r.slug).join(', ') || 'none'}`);
