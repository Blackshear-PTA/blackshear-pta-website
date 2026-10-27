-- Blackshear PTA - each Weekly Buzz's flyer becomes the post's photo and cover.
--
-- Asked for by Jon 2026-10-27. The Weekly Buzz posts were imported (0003,
-- 0006) with their flyers written into the text as pictures, because a photo
-- uploaded through /admin was always cropped to a wide 3:2 band, which cuts a
-- flyer's words off. So none of them had a cover, and /announcements and the
-- homepage showed them as text alone. Photos can be kept whole now, at their
-- own shape, and Jon wants posters and flyers like these to be the covers.
--
-- For each of the nine posts that has one (#8 has no flyer):
--   - its pictures become its photos, in the same order, with the same
--     descriptions and their sizes, and the first, the flyer, is the cover;
--   - the same pictures come out of the top of its text, where they would
--     otherwise show twice.
-- #10 has three: the flyer is the cover, and the Little EAST volunteers poster
-- and Tea with Tiona move to the photos after the text.
--
-- The files are the ones already served from public/weekly-buzz/, unchanged,
-- and each key is that file's content hash (scripts/upload-photos.mjs). The
-- public/weekly-buzz/ copies stay, since 0003 and 0006 still point at them.
--
-- Each post changes only if it still has no photos and its text still opens
-- with exactly these pictures, so a post reworked in /admin in the meantime is
-- left as it is. Safe to re-run: a second run matches nothing, and the history
-- rows are guarded by NOT EXISTS.
--
-- APPLY ONLY AFTER both of these, or the covers are broken images:
--   1. the PR that teaches the pages to draw a whole photo has deployed;
--   2. the eleven pictures are in the photo bucket:
--        fnm exec --using 22.22.3 -- node scripts/upload-photos.mjs --upload \
--          public/weekly-buzz/2026-08-24.jpg public/weekly-buzz/2026-08-31.jpg \
--          public/weekly-buzz/2026-09-07.jpg public/weekly-buzz/2026-09-14.jpg \
--          public/weekly-buzz/2026-09-22.jpg public/weekly-buzz/2026-09-28.jpg \
--          public/weekly-buzz/2026-10-05.jpg public/weekly-buzz/2026-10-19.jpg \
--          public/weekly-buzz/2026-10-26.jpg public/weekly-buzz/2026-10-26-little-east.jpg \
--          public/weekly-buzz/2026-10-26-tea-with-tiona.jpg
--      and the same command with --verify instead of --upload passes;
-- then: npm run db:migrate:remote (with Jon's OK in chat).

-- #1
UPDATE posts
SET images = '[{"key":"199e24e9da5eb41bc2ba50175b3a420d.jpg","alt":"The Weekly Buzz List flyer for August 24 to 30, 2026","width":618,"height":800}]',
    cover = '199e24e9da5eb41bc2ba50175b3a420d.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for August 24 to 30, 2026](/weekly-buzz/2026-08-24.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-08-24-weekly-buzz-1'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for August 24 to 30, 2026](/weekly-buzz/2026-08-24.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for August 24 to 30, 2026](/weekly-buzz/2026-08-24.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-08-24-weekly-buzz-1'
  AND cover = '199e24e9da5eb41bc2ba50175b3a420d.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-08-24-weekly-buzz-1' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #2
UPDATE posts
SET images = '[{"key":"d12093af1b761b3dd5dc0f0b65ed33a9.jpg","alt":"The Weekly Buzz List flyer for August 31 to September 6, 2026","width":618,"height":800}]',
    cover = 'd12093af1b761b3dd5dc0f0b65ed33a9.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for August 31 to September 6, 2026](/weekly-buzz/2026-08-31.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-08-31-weekly-buzz-2'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for August 31 to September 6, 2026](/weekly-buzz/2026-08-31.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for August 31 to September 6, 2026](/weekly-buzz/2026-08-31.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-08-31-weekly-buzz-2'
  AND cover = 'd12093af1b761b3dd5dc0f0b65ed33a9.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-08-31-weekly-buzz-2' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #3
UPDATE posts
SET images = '[{"key":"cdffe53723b9993ee2fc8430a771be88.jpg","alt":"The Weekly Buzz List flyer for September 7 to 13, 2026","width":618,"height":800}]',
    cover = 'cdffe53723b9993ee2fc8430a771be88.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for September 7 to 13, 2026](/weekly-buzz/2026-09-07.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-07-weekly-buzz-3'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for September 7 to 13, 2026](/weekly-buzz/2026-09-07.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for September 7 to 13, 2026](/weekly-buzz/2026-09-07.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-09-07-weekly-buzz-3'
  AND cover = 'cdffe53723b9993ee2fc8430a771be88.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-07-weekly-buzz-3' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #4
UPDATE posts
SET images = '[{"key":"e31d4a1f564aa19c1df4d2ee026b6edc.jpg","alt":"The Weekly Buzz List flyer for September 14 to 20, 2026","width":618,"height":800}]',
    cover = 'e31d4a1f564aa19c1df4d2ee026b6edc.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for September 14 to 20, 2026](/weekly-buzz/2026-09-14.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-14-weekly-buzz-4'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for September 14 to 20, 2026](/weekly-buzz/2026-09-14.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for September 14 to 20, 2026](/weekly-buzz/2026-09-14.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-09-14-weekly-buzz-4'
  AND cover = 'e31d4a1f564aa19c1df4d2ee026b6edc.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-14-weekly-buzz-4' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #5
UPDATE posts
SET images = '[{"key":"88b518eed9c17724f29d04f6282877cb.jpg","alt":"The Weekly Buzz List flyer for September 21 to 27, 2026","width":618,"height":800}]',
    cover = '88b518eed9c17724f29d04f6282877cb.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for September 21 to 27, 2026](/weekly-buzz/2026-09-22.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-22-weekly-buzz-5'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for September 21 to 27, 2026](/weekly-buzz/2026-09-22.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for September 21 to 27, 2026](/weekly-buzz/2026-09-22.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-09-22-weekly-buzz-5'
  AND cover = '88b518eed9c17724f29d04f6282877cb.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-22-weekly-buzz-5' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #6
UPDATE posts
SET images = '[{"key":"960c83b0e2d66d3367b3968b49a266e8.jpg","alt":"The Weekly Buzz List flyer for September 28 to October 4, 2026","width":618,"height":800}]',
    cover = '960c83b0e2d66d3367b3968b49a266e8.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for September 28 to October 4, 2026](/weekly-buzz/2026-09-28.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-09-28-weekly-buzz-6'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for September 28 to October 4, 2026](/weekly-buzz/2026-09-28.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for September 28 to October 4, 2026](/weekly-buzz/2026-09-28.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-09-28-weekly-buzz-6'
  AND cover = '960c83b0e2d66d3367b3968b49a266e8.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-28-weekly-buzz-6' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #7
UPDATE posts
SET images = '[{"key":"f43abde016114b8c4aac2065b1c6e7a9.jpg","alt":"The Weekly Buzz List flyer for October 5 to 11, 2026","width":618,"height":800}]',
    cover = 'f43abde016114b8c4aac2065b1c6e7a9.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for October 5 to 11, 2026](/weekly-buzz/2026-10-05.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-05-weekly-buzz-7'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for October 5 to 11, 2026](/weekly-buzz/2026-10-05.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for October 5 to 11, 2026](/weekly-buzz/2026-10-05.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-10-05-weekly-buzz-7'
  AND cover = 'f43abde016114b8c4aac2065b1c6e7a9.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-05-weekly-buzz-7' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #9
UPDATE posts
SET images = '[{"key":"c99cc5bb2398283c4bc1baa90282694f.jpg","alt":"The Weekly Buzz List flyer for October 19 to 25, 2026","width":618,"height":800}]',
    cover = 'c99cc5bb2398283c4bc1baa90282694f.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for October 19 to 25, 2026](/weekly-buzz/2026-10-19.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-19-weekly-buzz-9'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for October 19 to 25, 2026](/weekly-buzz/2026-10-19.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for October 19 to 25, 2026](/weekly-buzz/2026-10-19.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-10-19-weekly-buzz-9'
  AND cover = 'c99cc5bb2398283c4bc1baa90282694f.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-19-weekly-buzz-9' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');

-- #10: the flyer is the cover, and the other 2 pictures follow the text
UPDATE posts
SET images = '[{"key":"497b881397938e304c2ccf2679f78144.jpg","alt":"The Weekly Buzz List flyer for October 26 to November 1, 2026","width":1000,"height":1294},{"key":"dadf4a67c442a540ca94371a45dd414e.jpg","alt":"The 13th annual Little EAST poster, Time Warp: Saturday, 11/14, 11am to 3pm, with a QR code to volunteer","width":900,"height":900},{"key":"942110ddbbff15b23e52aae422a833d1.jpg","alt":"Tea with Tiona, Thursday morning at 7:40am: join our principal, Ms. Bell, for a casual Q&A about campus updates and events","width":900,"height":900}]',
    cover = '497b881397938e304c2ccf2679f78144.jpg',
    body = substr(body, length('![The Weekly Buzz List flyer for October 26 to November 1, 2026](/weekly-buzz/2026-10-26.jpg)' || char(10) || char(10) || '![The 13th annual Little EAST poster, Time Warp: Saturday, 11/14, 11am to 3pm, with a QR code to volunteer](/weekly-buzz/2026-10-26-little-east.jpg)' || char(10) || char(10) || '![Tea with Tiona, Thursday morning at 7:40am: join our principal, Ms. Bell, for a casual Q&A about campus updates and events](/weekly-buzz/2026-10-26-tea-with-tiona.jpg)' || char(10) || char(10)) + 1),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-26-weekly-buzz-10'
  AND images = '[]'
  AND substr(body, 1, length('![The Weekly Buzz List flyer for October 26 to November 1, 2026](/weekly-buzz/2026-10-26.jpg)' || char(10) || char(10) || '![The 13th annual Little EAST poster, Time Warp: Saturday, 11/14, 11am to 3pm, with a QR code to volunteer](/weekly-buzz/2026-10-26-little-east.jpg)' || char(10) || char(10) || '![Tea with Tiona, Thursday morning at 7:40am: join our principal, Ms. Bell, for a casual Q&A about campus updates and events](/weekly-buzz/2026-10-26-tea-with-tiona.jpg)' || char(10) || char(10))) = '![The Weekly Buzz List flyer for October 26 to November 1, 2026](/weekly-buzz/2026-10-26.jpg)' || char(10) || char(10) || '![The 13th annual Little EAST poster, Time Warp: Saturday, 11/14, 11am to 3pm, with a QR code to volunteer](/weekly-buzz/2026-10-26-little-east.jpg)' || char(10) || char(10) || '![Tea with Tiona, Thursday morning at 7:40am: join our principal, Ms. Bell, for a casual Q&A about campus updates and events](/weekly-buzz/2026-10-26-tea-with-tiona.jpg)' || char(10) || char(10);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)', 'update', slug, title, '{"fields": ["images", "cover", "body"]}'
FROM posts
WHERE slug = '2026-10-26-weekly-buzz-10'
  AND cover = '497b881397938e304c2ccf2679f78144.jpg'
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-26-weekly-buzz-10' AND editor = 'Weekly Buzz flyers as photos (migration 0008, at Jon''s request)');
