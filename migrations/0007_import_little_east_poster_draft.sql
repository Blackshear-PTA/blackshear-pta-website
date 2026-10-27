-- Blackshear PTA - a DRAFT announcement: the official Little EAST 2026 poster.
--
-- Asked for by Jon 2026-10-27, when the poster arrived: a short post saying the
-- official poster is out, with the poster itself showing on /announcements. A
-- draft, so he can read it over and publish it from /admin; drafts appear
-- nowhere on the public site until then.
--
-- The poster is the post's photo and its cover, uploaded whole rather than
-- cropped, with its size recorded so the pages draw it at its own shape. The
-- file is assets/announcements/2026-10-27-little-east-poster.jpg, the poster
-- shrunk to 1600px on its longer side the way /admin shrinks a whole picture,
-- and the key below is that file's content hash.
--
-- Safe to re-run: the post is OR IGNORE on its slug and the history row is
-- guarded by NOT EXISTS.
--
-- APPLY ONLY AFTER both of these, or the cover is a broken image:
--   1. the PR that teaches the pages to draw a whole photo has deployed;
--   2. the poster is in the photo bucket:
--        fnm exec --using 22.22.3 -- node scripts/upload-photos.mjs --upload \
--          assets/announcements/2026-10-27-little-east-poster.jpg
-- then: npm run db:migrate:remote (with Jon's OK in chat).

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body)
VALUES (
  '2026-10-27-little-east-poster',
  'The official Little EAST 2026 poster is here',
  '2026-10-27',
  '/little-east',
  'More about Little EAST',
  '[{"key":"dced7132f925a926288f828550b7525c.jpg","alt":"The 2026 Little EAST poster, Time Warp: Blackshear''s yellowjacket mascot stands at the mouth of a school hallway drawn as a portal, among melting clocks and hourglasses. Join us for the 13th annual Little EAST, Blackshear Fine Arts Academy. Saturday, November 14th, 2026, 11am to 3pm, 1712 E. 11th St., free and open to the public. Student performances, Trashion Show, screen printing, craft activities, student art and a silent auction. Along the bottom, the logos of the event''s partners and a QR code for the silent auction.","width":1143,"height":1600}]',
  'dced7132f925a926288f828550b7525c.jpg',
  '[]',
  0,
  1,
  'The official poster for Little EAST 2026 is here! Join us for the 13th annual Little EAST, Time Warp: Saturday, November 14, 11am to 3pm, at Blackshear Elementary, 1712 E. 11th St. Free and open to everyone.

Please share it with friends and neighbors.'
);
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Little EAST poster draft (migration 0007, at Jon''s request)', 'create',
       '2026-10-27-little-east-poster', 'The official Little EAST 2026 poster is here',
       '{"source": "the official poster, from the Little EAST committee, 2026-10-27"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-27-little-east-poster' AND action = 'create');
