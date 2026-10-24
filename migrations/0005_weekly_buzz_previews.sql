-- Blackshear PTA - a one-sentence preview for six Weekly Buzz posts.
--
-- Asked for by Jon 2026-10-24. /announcements shows each post's first paragraph
-- as its preview, and in #3, #4, #5, #7, #8 and #9 that paragraph was only
-- "PTA Weekly Buzz #N is here!", because the ClassDojo originals open that way
-- (migrations/0003). Each now goes on with one sentence drawn from that week's
-- own post, the way #2 and #6 already read. Nothing else in the posts changes.
--
-- Guarded, so it is safe to re-run and cannot overwrite an edit made in
-- /admin: a post changes only while its opening line still stands alone,
-- followed directly by a line break. A post somebody has already reworded is
-- left as it is, and gets no history row.
--
-- Not named _import_: on a database without the 0003 posts, which is what
-- check-d1 builds by default, it matches nothing and changes nothing.

-- #3
UPDATE posts
SET body = replace(body, 'PTA Weekly Buzz #3 is here!' || char(10), 'PTA Weekly Buzz #3 is here! A great turnout at our first PTA meeting, 68 members so far, and two new grants for Blackshear.' || char(10)),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-07-weekly-buzz-3'
  AND instr(body, 'PTA Weekly Buzz #3 is here!' || char(10)) > 0;
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz previews (migration 0005, at Jon''s request)', 'update', slug, title, '{"fields": ["body"]}'
FROM posts
WHERE slug = '2026-09-07-weekly-buzz-3'
  AND instr(body, 'PTA Weekly Buzz #3 is here! A great turnout at our first PTA meeting, 68 members so far, and two new grants for Blackshear.') > 0
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-07-weekly-buzz-3' AND editor = 'Weekly Buzz previews (migration 0005, at Jon''s request)');

-- #4
UPDATE posts
SET body = replace(body, 'PTA Weekly Buzz #4 is here!' || char(10), 'PTA Weekly Buzz #4 is here! Fine Arts starts this week, Math Kangaroo is back, and Back to School Night is Thursday, 9/17.' || char(10)),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-14-weekly-buzz-4'
  AND instr(body, 'PTA Weekly Buzz #4 is here!' || char(10)) > 0;
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz previews (migration 0005, at Jon''s request)', 'update', slug, title, '{"fields": ["body"]}'
FROM posts
WHERE slug = '2026-09-14-weekly-buzz-4'
  AND instr(body, 'PTA Weekly Buzz #4 is here! Fine Arts starts this week, Math Kangaroo is back, and Back to School Night is Thursday, 9/17.') > 0
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-14-weekly-buzz-4' AND editor = 'Weekly Buzz previews (migration 0005, at Jon''s request)');

-- #5
UPDATE posts
SET body = replace(body, 'PTA Weekly Buzz #5 is here!' || char(10), 'PTA Weekly Buzz #5 is here! Thanks for a great Back to School Night! We''re six members away from last year''s 85, and Bike to School Day is Wednesday, 10/7.' || char(10)),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-22-weekly-buzz-5'
  AND instr(body, 'PTA Weekly Buzz #5 is here!' || char(10)) > 0;
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz previews (migration 0005, at Jon''s request)', 'update', slug, title, '{"fields": ["body"]}'
FROM posts
WHERE slug = '2026-09-22-weekly-buzz-5'
  AND instr(body, 'PTA Weekly Buzz #5 is here! Thanks for a great Back to School Night! We''re six members away from last year''s 85, and Bike to School Day is Wednesday, 10/7.') > 0
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-22-weekly-buzz-5' AND editor = 'Weekly Buzz previews (migration 0005, at Jon''s request)');

-- #7
UPDATE posts
SET body = replace(body, 'PTA Weekly Buzz #7 is here!' || char(10), 'PTA Weekly Buzz #7 is here! Bike to School Day is Wednesday, CatchALL Night is 10/22, and we''ve matched last year''s 85 PTA members.' || char(10)),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-05-weekly-buzz-7'
  AND instr(body, 'PTA Weekly Buzz #7 is here!' || char(10)) > 0;
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz previews (migration 0005, at Jon''s request)', 'update', slug, title, '{"fields": ["body"]}'
FROM posts
WHERE slug = '2026-10-05-weekly-buzz-7'
  AND instr(body, 'PTA Weekly Buzz #7 is here! Bike to School Day is Wednesday, CatchALL Night is 10/22, and we''ve matched last year''s 85 PTA members.') > 0
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-05-weekly-buzz-7' AND editor = 'Weekly Buzz previews (migration 0005, at Jon''s request)');

-- #8
UPDATE posts
SET body = replace(body, 'PTA Weekly Buzz #8 is here!' || char(10), 'PTA Weekly Buzz #8 is here! A virtual PTA meeting tomorrow at 6pm, a look back at Bike to School Day, and what to expect at CatchALL Night and Little EAST.' || char(10)),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-12-weekly-buzz-8'
  AND instr(body, 'PTA Weekly Buzz #8 is here!' || char(10)) > 0;
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz previews (migration 0005, at Jon''s request)', 'update', slug, title, '{"fields": ["body"]}'
FROM posts
WHERE slug = '2026-10-12-weekly-buzz-8'
  AND instr(body, 'PTA Weekly Buzz #8 is here! A virtual PTA meeting tomorrow at 6pm, a look back at Bike to School Day, and what to expect at CatchALL Night and Little EAST.') > 0
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-12-weekly-buzz-8' AND editor = 'Weekly Buzz previews (migration 0005, at Jon''s request)');

-- #9
UPDATE posts
SET body = replace(body, 'PTA Weekly Buzz #9 is here!' || char(10), 'PTA Weekly Buzz #9 is here! Picture Day is tomorrow, CatchALL Night is Thursday, and Little EAST needs volunteers and bakers.' || char(10)),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-19-weekly-buzz-9'
  AND instr(body, 'PTA Weekly Buzz #9 is here!' || char(10)) > 0;
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz previews (migration 0005, at Jon''s request)', 'update', slug, title, '{"fields": ["body"]}'
FROM posts
WHERE slug = '2026-10-19-weekly-buzz-9'
  AND instr(body, 'PTA Weekly Buzz #9 is here! Picture Day is tomorrow, CatchALL Night is Thursday, and Little EAST needs volunteers and bakers.') > 0
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-19-weekly-buzz-9' AND editor = 'Weekly Buzz previews (migration 0005, at Jon''s request)');
