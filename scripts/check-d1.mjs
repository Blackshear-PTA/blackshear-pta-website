/**
 * Blackshear PTA - the D1 layer gate.
 *
 * Run: npm run check:d1
 *
 * WHY THIS EXISTS. Moving announcements into D1 took two build-time guarantees
 * away. The content schema's Zod refinements ran on every build against files
 * in git, and `astro build` would not finish if a post was malformed; now
 * nothing rebuilds on a publish, so nothing re-checks. Worse, the failure mode
 * moved: a bad post used to be a red build before anyone saw it, and would now
 * be a live page.
 *
 * So the rules moved into the database (migrations/0001) and this runs them.
 * Not a mock - node:sqlite is the same SQLite engine D1 is built on, so the
 * partial unique index, the triggers and the window function are exercised
 * exactly as written, against the migration files the deploy will apply. The
 * shim below is thirty lines of shape adaptation, not behaviour.
 *
 * Same lesson as F32 and F38: when a thing is hard to verify in place, move it
 * somewhere it can be verified deterministically rather than re-running a flaky
 * check until it agrees.
 *
 * node:sqlite is experimental in Node 22 and prints a warning; the runner
 * passes --experimental-sqlite and the warning is expected.
 */
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listPublished,
  getPublished,
  listAll,
  getAny,
  listEdits,
  createPost,
  updatePost,
  setPinned,
  deletePost,
  slugFor,
  toPost,
  nowStamp,
} from '../src/lib/posts.mjs';
import { renderMarkdown } from '../src/lib/markdown.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(root, 'migrations');

let failures = 0;
const pass = (name) => console.log(`  ok   ${name}`);
const fail = (name, detail) => {
  failures += 1;
  console.error(`  FAIL ${name}\n       ${detail}`);
};
const eq = (name, got, want) => {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (same) pass(name);
  else fail(name, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

/** Runs `fn` and reports whether it threw, and with what. */
async function rejects(name, fn, matcher) {
  try {
    await fn();
  } catch (error) {
    const message = String(error?.message ?? error);
    if (!matcher || matcher.test(message)) return pass(`${name} (rejected: ${message.slice(0, 60)})`);
    return fail(name, `threw, but with an unexpected message: ${message}`);
  }
  fail(name, 'expected this to be rejected, and it was allowed');
}

// --------------------------------------------------------------- the D1 shim

/**
 * A D1Database-shaped wrapper over node:sqlite.
 *
 * Deliberately minimal. Everything with behaviour worth testing - the index,
 * the triggers, the transaction, the SQL itself - is SQLite's, not this. The
 * only real decision here is that batch() is one transaction that rolls back on
 * any failure, which is what D1 documents batch() to do and what the single-pin
 * swap depends on.
 */
class ShimStatement {
  constructor(db, sql, values) {
    this.db = db;
    this.sql = sql;
    this.values = values ?? [];
  }
  bind(...values) {
    return new ShimStatement(this.db, this.sql, values);
  }
  async all() {
    return { results: this.db.prepare(this.sql).all(...this.values) };
  }
  async first() {
    return this.db.prepare(this.sql).get(...this.values) ?? null;
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

class ShimDb {
  constructor(db) {
    this.db = db;
  }
  prepare(sql) {
    return new ShimStatement(this.db, sql);
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.db.exec('COMMIT');
      return results;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

/** Applies every migration in order, exactly as wrangler would. */
function migrationFiles() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function fresh({ withImport = true } = {}) {
  const raw = new DatabaseSync(':memory:');
  for (const name of migrationFiles()) {
    if (!withImport && name.startsWith('0002_')) continue;
    raw.exec(readFileSync(join(MIGRATIONS, name), 'utf8'));
  }
  return new ShimDb(raw);
}

const EDITOR = 'board@blackshearpta.org';
const write = { editor: EDITOR };

// ------------------------------------------------------- schema and the import

console.log('schema and migrations:');
{
  try {
    fresh();
    pass(`every migration applies (${migrationFiles().join(', ')})`);
  } catch (error) {
    fail('every migration applies', String(error?.message ?? error));
  }
}

{
  // Re-running the import must change nothing. wrangler will not apply a
  // migration twice, but a person pasting the file into `wrangler d1 execute`
  // is exactly the situation where this needs to hold.
  const db = fresh();
  const before = await listAll(db);
  db.db.exec(readFileSync(join(MIGRATIONS, '0002_import_existing_announcements.sql'), 'utf8'));
  const after = await listAll(db);
  eq('the import is safe to re-run', after.length, before.length);
  const imports = (await listEdits(db, 500)).filter((e) => e.action === 'import');
  eq('re-running does not duplicate audit rows', imports.length, before.length);
}

console.log('\nthe five posts that were markdown files:');
{
  const db = fresh();
  const all = await listAll(db);
  eq('all five imported', all.length, 5);

  // URLS MUST NOT CHANGE. These are the paths that were live as markdown.
  eq(
    'slugs are the filenames, so URLs are unchanged',
    all.map((p) => p.slug).sort(),
    [
      '2026-07-30-save-blackshear',
      '2026-08-05-no-sting-3',
      '2026-08-14-buzz-bowl',
      '2026-08-20-135-years',
      '2026-09-02-test-post-garden',
    ],
  );

  const pinnedPost = all.filter((p) => p.pinned);
  eq('one post is pinned', pinnedPost.map((p) => p.slug), ['2026-07-30-save-blackshear']);

  const buzz = await getAny(db, '2026-08-14-buzz-bowl');
  eq('grades survived the import', buzz.grades, ['3', '4', '5']);

  const save = await getAny(db, '2026-07-30-save-blackshear');
  eq('href survived', save.href, 'https://www.saveblackshear.org');
  eq('linkLabel survived', save.linkLabel, 'Read more at saveblackshear.org');
  eq('an apostrophe in a title survived', save.title, "Let's keep Blackshear where it is");
  eq('body survived intact', save.body.startsWith('Our campus has been part'), true);
  eq('body keeps its paragraph breaks', save.body.split(/\n\s*\n/).length, 3);

  const garden = await getAny(db, '2026-09-02-test-post-garden');
  eq('the draft is still a draft', garden.draft, true);
  eq('images survived', garden.images.length, 3);
  eq('image alt text survived', garden.images[0].alt, 'Garden day');
  eq('cover survived', garden.cover, '0022d9a93370c18877eac7661bb92a93.jpg');
}

// ----------------------------------------------------------------- draft leak

console.log('\ndrafts appear nowhere:');
{
  const db = fresh();
  const { posts } = await listPublished(db);
  eq('not in the list', posts.some((p) => p.draft), false);
  eq('the list is the four published ones', posts.length, 4);

  // The leak that was real: filtered from every listing, still had its own page.
  eq('not at its own URL', await getPublished(db, '2026-09-02-test-post-garden'), null);

  // ...while /admin can still open it to work on it.
  const viaAdmin = await getAny(db, '2026-09-02-test-post-garden');
  eq('but /admin can still open it', viaAdmin?.slug, '2026-09-02-test-post-garden');

  const { total } = await listPublished(db, 2);
  eq('the total counts published posts only', total, 4);
  const limited = await listPublished(db, 2);
  eq('a limit limits the rows, not the total', limited.posts.length, 2);
}

// ------------------------------------------------------------------- ordering

console.log('\nordering - pinned first, then newest:');
{
  const db = fresh();
  const { posts } = await listPublished(db);
  eq(
    'pinned first, then date descending',
    posts.map((p) => p.slug),
    [
      '2026-07-30-save-blackshear', // pinned, and the OLDEST - so this proves the pin wins
      '2026-08-20-135-years',
      '2026-08-14-buzz-bowl',
      '2026-08-05-no-sting-3',
    ],
  );
}

{
  // Same-date posts need a deterministic order or the list reshuffles between
  // two page loads for no visible reason.
  const db = fresh({ withImport: false });
  await createPost(db, { fields: { slug: '2026-05-01-beta', title: 'B', date: '2026-05-01', body: 'b' }, ...write });
  await createPost(db, { fields: { slug: '2026-05-01-alpha', title: 'A', date: '2026-05-01', body: 'a' }, ...write });
  const { posts } = await listPublished(db);
  eq('same date falls back to slug ascending', posts.map((p) => p.slug), ['2026-05-01-alpha', '2026-05-01-beta']);
}

// --------------------------------------------------------- the pin invariant

console.log('\nthe single-pin invariant:');
{
  const db = fresh();
  await rejects(
    'raw SQL cannot pin a second post',
    async () =>
      db.prepare('UPDATE posts SET pinned = 1 WHERE slug = ?').bind('2026-08-14-buzz-bowl').run(),
    /UNIQUE|constraint/i,
  );
}

{
  const db = fresh();
  eq('pinning another post swaps', await setPinned(db, '2026-08-14-buzz-bowl', true, write), 'ok');
  const all = await listAll(db);
  eq('exactly one is pinned', all.filter((p) => p.pinned).map((p) => p.slug), ['2026-08-14-buzz-bowl']);
  eq('the old pin is cleared', (await getAny(db, '2026-07-30-save-blackshear')).pinned, false);
}

{
  const db = fresh();
  eq('unpinning works', await setPinned(db, '2026-07-30-save-blackshear', false, write), 'ok');
  eq('nothing is pinned', (await listAll(db)).filter((p) => p.pinned).length, 0);

  // With nothing pinned, any number of posts stay unpinned - the partial index
  // must not have turned pinned = 0 into a unique column.
  eq('many posts can be unpinned at once', (await listAll(db)).length, 5);
}

{
  // Atomicity, tested by making the second statement of a batch fail: the
  // unpin happens first, so if the batch is not a transaction the site is left
  // with nothing pinned and no new post either.
  const db = fresh();
  await rejects(
    'a failed create rolls back its own unpin',
    () =>
      createPost(db, {
        fields: { slug: '2026-08-14-buzz-bowl', title: 'Clash', date: '2026-08-14', body: 'x', pinned: true },
        ...write,
      }),
    /UNIQUE|constraint/i,
  );
  const all = await listAll(db);
  eq('the incumbent is still pinned', all.filter((p) => p.pinned).map((p) => p.slug), ['2026-07-30-save-blackshear']);
  eq('and nothing was inserted', all.length, 5);
}

// ------------------------------------------------- field-level writes (the point)

console.log('\nfield-level writes - an absent field is left alone:');
{
  const db = fresh();
  const before = await getAny(db, '2026-07-30-save-blackshear');
  eq('starts pinned', before.pinned, true);

  // THE BUG THIS MIGRATION EXISTS TO KILL. The Contents API wrote whole
  // documents, so a save that omitted `pinned` wrote it as false. Here a save
  // that omits it must not touch it.
  eq(
    'saving a title does not unpin',
    await updatePost(db, '2026-07-30-save-blackshear', {
      fields: { title: 'A new title' },
      ...write,
    }),
    'ok',
  );
  const after = await getAny(db, '2026-07-30-save-blackshear');
  eq('the title changed', after.title, 'A new title');
  eq('and the pin survived', after.pinned, true);
  eq('and so did href', after.href, 'https://www.saveblackshear.org');
  eq('and so did the body', after.body, before.body);
}

{
  const db = fresh();
  const before = await getAny(db, '2026-09-02-test-post-garden');
  await updatePost(db, '2026-09-02-test-post-garden', { fields: { body: 'Rewritten.' }, ...write });
  const after = await getAny(db, '2026-09-02-test-post-garden');
  eq('editing a body keeps the photos', after.images, before.images);
  eq('and the cover', after.cover, before.cover);
  eq('and the draft flag', after.draft, true);
}

{
  const db = fresh();
  eq(
    'clearing an optional field is explicit, and works',
    await updatePost(db, '2026-08-05-no-sting-3', { fields: { href: '', linkLabel: '' }, ...write }),
    'ok',
  );
  const post = await getAny(db, '2026-08-05-no-sting-3');
  eq('href is null, not the empty string', post.href, null);
  eq('linkLabel is null too', post.linkLabel, null);
}

console.log('\noptimistic concurrency:');
{
  const db = fresh();
  const post = await getAny(db, '2026-08-14-buzz-bowl');
  eq(
    'a stale timestamp is a conflict',
    await updatePost(db, '2026-08-14-buzz-bowl', {
      fields: { title: 'Second writer' },
      expectedUpdatedAt: '2000-01-01T00:00:00Z',
      ...write,
    }),
    'conflict',
  );
  eq('and the post is untouched', (await getAny(db, '2026-08-14-buzz-bowl')).title, post.title);

  eq(
    'the current timestamp is accepted',
    await updatePost(db, '2026-08-14-buzz-bowl', {
      fields: { title: 'First writer' },
      expectedUpdatedAt: post.updatedAt,
      ...write,
    }),
    'ok',
  );

  eq(
    'a post that is gone reports missing, not conflict',
    await updatePost(db, 'no-such-post', { fields: { title: 'x' }, ...write }),
    'missing',
  );
}

// ------------------------------------------------- the two .refine() rules

console.log('\nboth .refine() rules, now enforced by the database:');
{
  const db = fresh({ withImport: false });
  await rejects(
    'an image with no alt text is refused on insert',
    () =>
      createPost(db, {
        fields: {
          slug: '2026-06-01-x', title: 'X', date: '2026-06-01', body: 'b',
          images: [{ key: 'a.jpg', alt: '' }],
        },
        ...write,
      }),
    /alt text/i,
  );
  await rejects(
    'alt text of only spaces is refused too',
    () =>
      createPost(db, {
        fields: {
          slug: '2026-06-02-x', title: 'X', date: '2026-06-02', body: 'b',
          images: [{ key: 'a.jpg', alt: '   ' }],
        },
        ...write,
      }),
    /alt text/i,
  );
  await rejects(
    'a cover that is not one of the post\'s images is refused',
    () =>
      createPost(db, {
        fields: {
          slug: '2026-06-03-x', title: 'X', date: '2026-06-03', body: 'b',
          images: [{ key: 'a.jpg', alt: 'A' }], cover: 'b.jpg',
        },
        ...write,
      }),
    /cover/i,
  );
}

{
  const db = fresh();
  await rejects(
    'and on update: alt text cannot be emptied',
    () =>
      updatePost(db, '2026-09-02-test-post-garden', {
        // Keeps the existing cover key present, so this input violates the alt
        // rule and ONLY the alt rule. SQLite does not define which of two
        // eligible triggers fires first, so a case that breaks both rules
        // cannot assert on the message - and the message is the part a board
        // member reads.
        fields: { images: [{ key: '0022d9a93370c18877eac7661bb92a93.jpg', alt: '' }] },
        ...write,
      }),
    /alt text/i,
  );
  await rejects(
    'and on update: the cover cannot be orphaned by removing its image',
    () =>
      updatePost(db, '2026-09-02-test-post-garden', {
        fields: { images: [{ key: 'other.jpg', alt: 'Other' }] },
        ...write,
      }),
    /cover/i,
  );
  // Removing every photo has to remain possible - clear the cover with them.
  eq(
    'removing all photos and the cover together is allowed',
    await updatePost(db, '2026-09-02-test-post-garden', { fields: { images: [], cover: '' }, ...write }),
    'ok',
  );
}

console.log('\nother column constraints:');
{
  const db = fresh({ withImport: false });
  const base = { title: 'X', date: '2026-06-01', body: 'b' };
  await rejects('a slug with a slash is refused', () =>
    createPost(db, { fields: { ...base, slug: 'a/b' }, ...write }), /constraint|CHECK/i);
  await rejects('an uppercase slug is refused', () =>
    createPost(db, { fields: { ...base, slug: 'Abc' }, ...write }), /constraint|CHECK/i);
  await rejects('a date that is not YYYY-MM-DD is refused', () =>
    createPost(db, { fields: { ...base, slug: 'ok-slug', date: '9/1/26' }, ...write }), /constraint|CHECK/i);
  await rejects('a title over 140 characters is refused', () =>
    createPost(db, { fields: { ...base, slug: 'ok-slug-2', title: 'x'.repeat(141) }, ...write }),
    /constraint|CHECK/i);
  await rejects('a duplicate slug is refused', () =>
    createPost(db, { fields: { ...base, slug: 'dupe' }, ...write }).then(() =>
      createPost(db, { fields: { ...base, slug: 'dupe' }, ...write })), /UNIQUE|constraint/i);
}

// -------------------------------------------------------------- audit trail

console.log('\nthe audit trail:');
{
  const db = fresh({ withImport: false });
  await createPost(db, {
    fields: { slug: '2026-06-10-a', title: 'A post', date: '2026-06-10', body: 'Body.' },
    editor: 'alice@blackshearpta.org',
  });
  await updatePost(db, '2026-06-10-a', { fields: { title: 'A better post' }, editor: 'bob@blackshearpta.org' });
  await setPinned(db, '2026-06-10-a', true, { editor: 'carol@blackshearpta.org' });
  await setPinned(db, '2026-06-10-a', false, { editor: 'carol@blackshearpta.org' });

  const edits = await listEdits(db);
  eq('every action is recorded', edits.map((e) => e.action), ['unpin', 'pin', 'update', 'create']);
  eq('with who did it', edits.map((e) => e.editor), [
    'carol@blackshearpta.org', 'carol@blackshearpta.org', 'bob@blackshearpta.org', 'alice@blackshearpta.org',
  ]);
  eq('an update records which fields changed', JSON.parse(edits[2].detail).fields, ['title']);
  eq('a pin is recorded as a pin, not an update', edits[1].action, 'pin');

  // A pin carries no title in its payload, so the row has to find one. Without
  // this the history reads "pinned 2026-06-10-a" among rows that name the post.
  eq('a pin still names the post', edits[1].title, 'A better post');
  eq('...and so does a delete', (await listEdits(db)).length, 4);
}

{
  // The promise docs/ADMIN.md makes: a deleted post can be brought back.
  // `git revert` used to be that, and this migration takes it away.
  const db = fresh();
  const before = await getAny(db, '2026-08-14-buzz-bowl');
  eq('delete succeeds', await deletePost(db, '2026-08-14-buzz-bowl', { editor: EDITOR }), 'ok');
  eq('and it is gone', await getAny(db, '2026-08-14-buzz-bowl'), null);

  const [record] = await listEdits(db, 1);
  eq('the delete is recorded', record.action, 'delete');
  const recovered = JSON.parse(record.detail).post;
  eq('with the whole post, so it can be put back', recovered, before);

  // And prove it: put it back from the audit row alone.
  await createPost(db, { fields: recovered, editor: EDITOR });
  const again = await getAny(db, '2026-08-14-buzz-bowl');
  eq('restored title', again.title, before.title);
  eq('restored body', again.body, before.body);
  eq('restored grades', again.grades, before.grades);
  eq('restored date', again.date, before.date);

  eq(
    'deleting something absent reports missing',
    await deletePost(db, 'no-such-post', { editor: EDITOR }),
    'missing',
  );
}

// ----------------------------------------------------------------- round trip

console.log('\nfield round trip:');
{
  const db = fresh({ withImport: false });
  const fields = {
    slug: '2026-06-20-everything',
    title: 'Everything: "quoted", & escaped \\ here',
    date: '2026-06-20',
    href: 'https://example.org/a?b=1&c=2',
    linkLabel: 'Read: more',
    images: [{ key: 'a.jpg', alt: 'Jardín 🐝' }, { key: 'b.png', alt: 'Note: a "garden"' }],
    cover: 'b.png',
    grades: ['pre-k-3', 'kinder', '5'],
    draft: true,
    body: 'para one\n\npara two with **bold**\n\npara three',
  };
  await createPost(db, { fields, editor: EDITOR });
  const post = await getAny(db, '2026-06-20-everything');
  for (const key of ['title', 'date', 'href', 'linkLabel', 'images', 'cover', 'grades', 'draft', 'body']) {
    eq(`round trip: ${key}`, post[key], fields[key]);
  }
  eq('round trip: pinned defaults false', post.pinned, false);
  eq('created_at and updated_at are set', Boolean(post.createdAt && post.updatedAt), true);
}

{
  // A row hand-edited into invalid JSON must cost one field, not the page.
  const db = fresh({ withImport: false });
  await createPost(db, { fields: { slug: 'x-1', title: 'X', date: '2026-06-01', body: 'b' }, ...write });
  db.db.exec("UPDATE posts SET grades = '[\"1\",\"2\"]' WHERE slug = 'x-1'");
  eq('valid JSON reads back', (await getAny(db, 'x-1')).grades, ['1', '2']);
  eq('a malformed row degrades to empty, not a crash', toPost({ slug: 's', grades: 'not json', images: '{' }).grades, []);
  eq('...and images too', toPost({ slug: 's', images: 'not json' }).images, []);
}

// --------------------------------------------------------- rendering a body

/**
 * Bodies are stored in D1 and turned into HTML on every request, so the
 * renderer is part of this layer now rather than part of the build. It is also
 * the only place a database value becomes markup, which makes it the place
 * worth being sure about.
 */
console.log('\npost bodies render:');
{
  const html = (text) => renderMarkdown(text).trim();

  eq('paragraphs', html('one\n\ntwo'), '<p>one</p>\n<p>two</p>');
  eq('a wrapped paragraph stays one paragraph', html('one\ntwo'), '<p>one\ntwo</p>');
  eq('bold', html('**bold**'), '<p><strong>bold</strong></p>');
  eq('italic', html('*it*'), '<p><em>it</em></p>');
  eq('a link', html('[a](https://example.org/)'), '<p><a href="https://example.org/">a</a></p>');
  eq('a list', html('- a\n- b'), '<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
  eq('a heading', html('## Hi'), '<h2>Hi</h2>');

  // THE ONE THAT MATTERS. A body used to reach a reader only by way of a git
  // diff somebody merged; it now goes from a form straight to a page.
  eq(
    'raw HTML is escaped, not passed through',
    html('<script>alert(1)</script>'),
    '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
  );
  eq('an inline tag is escaped too', html('a <b>b</b> c'), '<p>a &lt;b&gt;b&lt;/b&gt; c</p>');
  eq(
    'a javascript: link is dropped',
    /href="javascript/.test(html('[click](javascript:alert(1))')),
    false,
  );

  // Ampersands and angle brackets in ordinary prose must survive as text.
  eq('an ampersand is escaped', html('Teachers & staff'), '<p>Teachers &amp; staff</p>');

  // And the real thing: an imported post's body renders as the paragraphs it was.
  const db = fresh();
  const save = await getAny(db, '2026-07-30-save-blackshear');
  eq('an imported body renders as three paragraphs', (html(save.body).match(/<p>/g) ?? []).length, 3);
}

// ------------------------------------------------------------------- helpers

console.log('\nslugFor - the URL a new post gets:');
{
  const cases = [
    [['2026-09-01', 'Bake sale Friday'], '2026-09-01-bake-sale-friday'],
    [['2026-09-01', "Let's go!"], '2026-09-01-let-s-go'],
    [['2026-09-01', 'Jardín y café'], '2026-09-01-jardin-y-cafe'],
    [['2026-09-01', '🐝🐝🐝'], '2026-09-01-post'],
    [['2026-09-01', '   '], '2026-09-01-post'],
    [['2026-09-01', 'Reminder: the meeting moved'], '2026-09-01-reminder-the-meeting-moved'],
  ];
  for (const [[date, title], want] of cases) eq(`slugFor(${JSON.stringify(title)})`, slugFor(date, title), want);

  // The slug is the URL, so it must match the schema's CHECK or the insert dies
  // with a constraint error rather than a sentence.
  for (const [[date, title]] of cases) {
    const slug = slugFor(date, title);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail(`slugFor produces a legal slug for ${title}`, slug);
  }
  pass('every generated slug satisfies the schema CHECK');
}

{
  eq('nowStamp matches the SQL DEFAULT format', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(nowStamp()), true);
}

console.log(`\n${failures ? `${failures} failing` : 'all D1 checks passed'}.`);
process.exit(failures ? 1 : 0);
