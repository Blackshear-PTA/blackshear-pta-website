-- Blackshear PTA - announcements move out of git and into D1.
--
-- WHY THIS EXISTS: announcements used to be one markdown file per post in
-- src/content/announcements/, published by committing through the GitHub
-- Contents API. Every save was a commit, every commit was a full rebuild, and
-- publishing took 60-90 seconds. See docs/ADMIN.md and finding F41 in TASKS.md
-- for the full accounting.
--
-- Apply with:  npx wrangler d1 migrations apply blackshear-pta [--local|--remote]
--
-- SHAPE: one row per post, with `images` and `grades` as JSON columns rather
-- than join tables. Justified by size and by access pattern - there are five
-- posts with a handful of images each, every read wants the whole post, and
-- nothing ever asks "which posts contain image X". Join tables would add two
-- tables, two inserts and a GROUP_CONCAT to every read in exchange for
-- normalisation nobody here will use. The JSON is the same shape the markdown
-- frontmatter carried, which is what makes the import and the export both
-- one-liners. If a feature ever does need to query inside these, SQLite's
-- json_each() reaches them without a schema change.

CREATE TABLE posts (
  -- The URL. Stored rather than regenerated from the title, because posts are
  -- already linked from elsewhere and a title edit must not move a page. This
  -- is exactly the markdown filename, minus ".md".
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  -- YYYY-MM-DD. Text, not a timestamp: a publication date is a square on a
  -- calendar, not an instant (F26), and this sorts correctly as text.
  date        TEXT NOT NULL,
  href        TEXT,
  link_label  TEXT,
  -- JSON array of {key, alt}. `key` is an R2 object key; see src/worker/images.ts.
  images      TEXT NOT NULL DEFAULT '[]',
  cover       TEXT,
  -- JSON array of grade slugs. Empty means the whole school.
  grades      TEXT NOT NULL DEFAULT '[]',
  pinned      INTEGER NOT NULL DEFAULT 0,
  draft       INTEGER NOT NULL DEFAULT 0,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

  CONSTRAINT slug_shape   CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  CONSTRAINT title_length CHECK (length(title) BETWEEN 1 AND 140),
  CONSTRAINT date_shape   CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  CONSTRAINT images_json  CHECK (json_valid(images) AND json_type(images) = 'array'),
  CONSTRAINT grades_json  CHECK (json_valid(grades) AND json_type(grades) = 'array'),
  CONSTRAINT pinned_bool  CHECK (pinned IN (0, 1)),
  CONSTRAINT draft_bool   CHECK (draft IN (0, 1))
);

-- THE SINGLE-PIN INVARIANT.
--
-- At most one post is pinned. This used to be a read-modify-write across two
-- markdown files that hoped nothing went wrong in between; a partial unique
-- index makes two pinned posts unrepresentable. Rows with pinned = 0 are not in
-- the index at all, so any number of them coexist.
--
-- The consequence for callers: pinning B while A is pinned must unpin A in the
-- SAME transaction, or the second statement fails. setPinned() in
-- src/lib/posts.mjs does exactly that, in one D1 batch.
CREATE UNIQUE INDEX posts_one_pin ON posts (pinned) WHERE pinned = 1;

-- The public ordering, in one index: published posts, pinned first, then newest.
CREATE INDEX posts_feed ON posts (draft, pinned DESC, date DESC, slug ASC);

-- BOTH .refine() RULES FROM THE CONTENT SCHEMA, MOVED INTO THE DATABASE.
--
-- They were Zod refinements in src/content.config.ts, which meant they were
-- enforced at build time against files in git. Nothing rebuilds on a publish
-- any more, so a build-time check is a check that no longer runs. validate() in
-- src/worker/admin.ts still states both rules in sentences a board member can
-- act on - that is the copy people see. These are the copy that cannot be
-- bypassed, including by someone typing `wrangler d1 execute` at 11pm.
--
-- Triggers rather than CHECK constraints because SQLite forbids subqueries in a
-- CHECK, and both rules are statements about the contents of a JSON array.

-- Rule 1: every image needs non-empty alt text.
CREATE TRIGGER posts_alt_required_insert BEFORE INSERT ON posts
WHEN EXISTS (
  SELECT 1 FROM json_each(NEW.images)
  WHERE trim(coalesce(json_extract(value, '$.alt'), '')) = ''
)
BEGIN
  SELECT RAISE(ABORT, 'every image needs alt text');
END;

CREATE TRIGGER posts_alt_required_update BEFORE UPDATE OF images ON posts
WHEN EXISTS (
  SELECT 1 FROM json_each(NEW.images)
  WHERE trim(coalesce(json_extract(value, '$.alt'), '')) = ''
)
BEGIN
  SELECT RAISE(ABORT, 'every image needs alt text');
END;

-- Rule 2: cover must be the key of one of this post's own images.
CREATE TRIGGER posts_cover_valid_insert BEFORE INSERT ON posts
WHEN NEW.cover IS NOT NULL AND NEW.cover <> '' AND NOT EXISTS (
  SELECT 1 FROM json_each(NEW.images) WHERE json_extract(value, '$.key') = NEW.cover
)
BEGIN
  SELECT RAISE(ABORT, 'cover must be the key of one of this post''s images');
END;

CREATE TRIGGER posts_cover_valid_update BEFORE UPDATE OF images, cover ON posts
WHEN NEW.cover IS NOT NULL AND NEW.cover <> '' AND NOT EXISTS (
  SELECT 1 FROM json_each(NEW.images) WHERE json_extract(value, '$.key') = NEW.cover
)
BEGIN
  SELECT RAISE(ABORT, 'cover must be the key of one of this post''s images');
END;

-- THE AUDIT TRAIL.
--
-- `git log src/content/announcements/` was the record of who changed what, and
-- docs/ADMIN.md promised it in writing. This migration ends that record, so
-- this table replaces it. The editor's address comes from the verified
-- Cloudflare Access JWT (src/worker/access.ts), never from the client.
--
-- Deliberately NOT foreign-keyed to posts: the history of a deleted post is the
-- history most worth keeping, and `detail` holds the whole row as JSON on a
-- delete, so a post removed by mistake can be put back.
CREATE TABLE edits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  editor  TEXT NOT NULL,
  action  TEXT NOT NULL,
  slug    TEXT NOT NULL,
  title   TEXT,
  -- JSON. Which fields changed on an update; the whole post on a delete.
  detail  TEXT,

  CONSTRAINT action_known CHECK (action IN ('create', 'update', 'delete', 'pin', 'unpin', 'import'))
);

CREATE INDEX edits_recent ON edits (at DESC, id DESC);
CREATE INDEX edits_slug ON edits (slug, at DESC);
