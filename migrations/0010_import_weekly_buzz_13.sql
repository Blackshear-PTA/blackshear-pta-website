-- Blackshear PTA - the PTA Weekly Buzz #13 (November 16 to 22, 2026).
--
-- Asked for by Jon 2026-11-16, the day it went out: from the PTA's ClassDojo
-- post (Ms. PTA, 2026-11-16), the same way 0009 brought in #11 and #12.
--
-- The pictures are the post's own eight, in its order, each shrunk the way
-- /admin shrinks a picture kept whole (at most 1600px on its longer side, JPEG
-- 0.82) and kept in assets/announcements/. The flyer is the cover. They were
-- put in the photo bucket before this was written (scripts/upload-photos.mjs
-- --upload, then --verify), so each key is that file's content hash. None of
-- them repeats an earlier file: this week's Pies & Sides flyer has a Donate
-- button that #11's and #12's did not, and the Tea with Tiona picture is a
-- larger copy than #10's.
--
-- Two of the pictures show students' faces: the choir and the dancers
-- performing, and the crowd at the Trashion Show. #12's Trashion schedule
-- already did the same, and no child is named in either, so they are in. To
-- take one out, remove it in /admin.
--
-- Changes from the original, the same kinds 0003, 0006 and 0009 made:
--   - The "keep swiping" line is gone; it refers to ClassDojo's slides.
--   - "you student" and "Get you last bids in" become "your".
--   - The reminders the post ran together on two lines are one to a line.
--   - The opening line goes on with one sentence of what is in the post, so
--     /announcements has a real preview, as 0005, 0006 and 0009 did.
--   - tinyurl addresses become links.
-- The auction's "until 9am this morning" stays as posted: the post is dated
-- the day it went out.
--
-- The pin: the newest Weekly Buzz is pinned (Jon, 2026-10-24), and #13 takes
-- it from #12, but only while #12 still holds it. If anything else has been
-- pinned in /admin since, that stays pinned and #13 goes in unpinned.
--
-- Safe to re-run, like 0009: the post is OR IGNORE on its slug, the pin moves
-- only while #13 is not in yet, and the history rows are guarded by NOT EXISTS.
--
-- Nothing in public/ is involved, so this does not wait for a deploy. Apply it
-- with Jon's OK in chat: npm run db:migrate:remote

-- #13 takes the pin from #12 (recorded first, while the condition still holds).
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz import (migration 0010, at Jon''s request)', 'unpin', slug, title, '{"reason": "Weekly Buzz #13 is the newest"}'
FROM posts
WHERE slug = '2026-11-09-weekly-buzz-12'
  AND pinned = 1
  AND NOT EXISTS (SELECT 1 FROM posts WHERE slug = '2026-11-16-weekly-buzz-13');
UPDATE posts
SET pinned = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-11-09-weekly-buzz-12'
  AND pinned = 1
  AND NOT EXISTS (SELECT 1 FROM posts WHERE slug = '2026-11-16-weekly-buzz-13');

-- #13, pinned unless something other than #12 holds the pin.
INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
SELECT
  '2026-11-16-weekly-buzz-13',
  'PTA Weekly Buzz #13: November 16 to 22',
  '2026-11-16',
  NULL,
  NULL,
  '[{"key":"ec686f09060982bcfc6b99e4aa47831e.jpg","alt":"The Weekly Buzz List flyer for November 16 to 22, 2026","width":1237,"height":1600},{"key":"45ec5e9546f9bda9581e25f7f2ee1719.jpg","alt":"Student artwork at Little EAST: kindergarten color-block paintings, black-and-white portrait drawings, a big yellow B, a Yellow Jackets collage and a wall of rainbow trout","width":1600,"height":1600},{"key":"29fce74fa819c5194a2815102af26bbf.jpg","alt":"Little EAST performances: students in black choir T-shirts singing in the cafeteria, and young dancers in black performing on the grass beside the school","width":1600,"height":1600},{"key":"ba5c9b4e164d5d4d9f3d3dacd16a73c8.jpg","alt":"More Little EAST artwork, insect paintings, feathered paper monsters and 3rd grade’s Over/Under Frogs, and a crowd at the school’s front doors watching the Trashion Show","width":1600,"height":1600},{"key":"428ff2eda965d20a01cf3fe8e2d86e31.jpg","alt":"Silent Auction ends at 9AM today: last chance to bid in the 13th annual Little EAST auction, with a QR code to tinyurl.com/13thLittleEAST","width":1600,"height":1600},{"key":"bbc13eba165b1c8fcc8f1a6ec6d5d61d.jpg","alt":"Thanksgiving Lunch, Thursday, 11/19, $5.50 per person, tickets at tinyurl.com/BlackshearTurkey. Lunch schedule: ECSE, PK3 and PK4 10:30 to 11:00am, Kinder 11:00 to 11:30am, 1st grade 11:30am to noon, 2nd grade 11:50am to 12:20pm, 3rd grade 12:10 to 12:40pm, 4th grade 12:30 to 1:00pm, 5th grade 12:50 to 1:20pm","width":1080,"height":1080},{"key":"09b4ddaa802be7d7227b7fc1f351eb9a.jpg","alt":"Pies and Sides Buffet for our teachers and staff, Thursday, 11/19, with a QR code to donate and sign up at tinyurl.com/BlackshearBuffet","width":1600,"height":1600},{"key":"3868ed595bb5c755f8e3c2f529c39935.jpg","alt":"Tea with Tiona, Thursday morning at 7:40am: join our principal, Ms. Bell, for a casual Q&A about campus updates and events","width":1600,"height":1600}]',
  'ec686f09060982bcfc6b99e4aa47831e.jpg',
  '[]',
  CASE WHEN EXISTS (SELECT 1 FROM posts WHERE pinned = 1) THEN 0 ELSE 1 END,
  0,
  'PTA Weekly Buzz #13 is here! Little EAST was a blast, and this Thursday, 11/19, brings Thanksgiving Lunch and our teachers’ Pies & Sides Buffet.

We had a blast at our 13th annual Little EAST - we were so lucky the rain held off! Thank you to everyone that came. The Silent Auction is still LIVE until 9am this morning! Get your last bids in! [tinyurl.com/13thLittleEAST](https://tinyurl.com/13thLittleEAST)

This week’s post includes:

- Thanksgiving Lunch: Come have lunch with your student this Thursday! $5.50 per person - buy your ticket here: [tinyurl.com/BlackshearTurkey](https://tinyurl.com/BlackshearTurkey)
- Please help us say Thank You to our teachers & staff by bringing in a pie or a side. Our annual Staff Appreciation event (Pies & Sides Buffet) is on Thursday, 11/19: [tinyurl.com/BlackshearBuffet](https://tinyurl.com/BlackshearBuffet)

Reminders:

- Math Kangaroo Team Competition is on Wednesday, 11/18
- Thanksgiving Lunch will be on Thursday, 11/19
- Staff Appreciation Pies & Sides event is on Thursday, 11/19: [tinyurl.com/BlackshearBuffet](https://tinyurl.com/BlackshearBuffet)
- Tea with Tiona is on Thursday, 11/19
- Picture Retakes on Thursday, 11/19
- Fall Break is 11/23-11/27
- Monthly calendar: [tinyurl.com/BlackshearNovemberCalendar](https://tinyurl.com/BlackshearNovemberCalendar)',
  '2026-11-16T00:00:00Z',
  '2026-11-16T00:00:00Z';
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-11-16T00:00:00Z', 'Weekly Buzz import (ClassDojo)', 'import', '2026-11-16-weekly-buzz-13', 'PTA Weekly Buzz #13: November 16 to 22',
       '{"source": "ClassDojo, Ms. PTA, 2026-11-16; pictures from the same post"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-11-16-weekly-buzz-13' AND action = 'import');
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz import (migration 0010, at Jon''s request)', 'pin', slug, title, '{"reason": "Weekly Buzz #13 is the newest"}'
FROM posts
WHERE slug = '2026-11-16-weekly-buzz-13'
  AND pinned = 1
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-11-16-weekly-buzz-13' AND action = 'pin');
