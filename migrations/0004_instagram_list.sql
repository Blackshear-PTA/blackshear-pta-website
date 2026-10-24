-- Blackshear PTA - the Instagram posts on /gallery, out of git and into D1.
--
-- Until now /admin saved the list as src/content/instagram.yaml, committed
-- through the GitHub Contents API, so a change appeared only after a rebuild,
-- needed the GITHUB_TOKEN secret, and put the token owner's GitHub user into
-- public commits. Announcements left that path for this database in
-- migration 0001 (TASKS.md A41); this does the same for the last thing on it
-- (A52, Jon, 2026-10-23).
--
-- ONE ROW, holding the whole list as a JSON array of post addresses in display
-- order. The list is at most six entries and is only ever read and written
-- whole, so a row per post would add ordering columns and a multi-statement
-- save for nothing. updated_at is the optimistic-concurrency check, as on
-- posts: a save says which version it started from, and loses if somebody else
-- saved first.
--
-- The rules the editor checks (src/worker/instagram.mjs) are repeated here so
-- a hand-run statement cannot store something the gallery cannot show.
CREATE TABLE instagram_list (
  id          INTEGER PRIMARY KEY,
  urls        TEXT NOT NULL DEFAULT '[]',
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

  CONSTRAINT one_row    CHECK (id = 1),
  CONSTRAINT urls_json  CHECK (json_valid(urls) AND json_type(urls) = 'array'),
  CONSTRAINT urls_max   CHECK (json_array_length(urls) <= 6)
);

-- Seeded with what src/content/instagram.yaml held when it was retired: the six
-- newest @blackshearpta posts, newest first (2026-10-23). Safe to re-run.
INSERT OR IGNORE INTO instagram_list (id, urls, updated_at)
VALUES (1, '["https://www.instagram.com/p/DehjUoYlTlY/", "https://www.instagram.com/p/DehT8aJREFE/", "https://www.instagram.com/p/DdCDwa8FSiu/", "https://www.instagram.com/p/Da55QewlcsH/", "https://www.instagram.com/p/DY8cRDulcH1/", "https://www.instagram.com/p/DYc60BsFT4E/"]', '2026-10-24T00:00:00Z');
