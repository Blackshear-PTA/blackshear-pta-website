-- Blackshear PTA - the PTA Weekly Buzz #11 (November 2 to 8, 2026) and #12
-- (November 9 to 15, 2026).
--
-- Asked for by Jon 2026-11-10: catch the announcements up with the Weekly
-- Buzz posts since #10. Both are from the PTA's ClassDojo posts (Ms. PTA,
-- 2026-11-04 and 2026-11-09). Neither went out on Instagram; the account's
-- recent posts there are separate Little EAST ones.
--
-- The pictures are the posts' own, in their order, each shrunk the way /admin
-- shrinks a picture kept whole (at most 1600px on its longer side, JPEG 0.82)
-- and kept in assets/announcements/. Each week's flyer is its post's cover.
-- They were put in the photo bucket before this was written
-- (scripts/upload-photos.mjs --upload, then --verify), so each key is that
-- file's content hash. #11's Little EAST poster is the official poster file
-- already in the bucket for 0007; #12's Pies & Sides flyer and November
-- calendar are the same pictures #11 has, so they share its files.
--
-- Changes from the originals, the same kinds 0003 and 0006 made:
--   - The "keep swiping" lines are gone; they refer to ClassDojo's slides.
--   - No child is named who was not named publicly (0003's rule for #4).
--     #11 lists the ten 5th graders chosen for the All-City Choral Festival
--     by name, in its text and on one of its slides; the text here
--     congratulates them without names, and that slide is left out. So is the
--     slide thanking Mina for the ofrenda, which names her children; the
--     ofrenda photo after it stays, and the text still thanks her. "Mom to
--     Lila in 4th grade" becomes "a 4th-grade mom".
--   - "back pack" becomes "backpack", and "PTA members, Anne" loses its comma.
--   - Each opening line goes on with one sentence of what is in that week's
--     post, so /announcements has a real preview, as 0005 and 0006 did.
--   - tinyurl and Instagram addresses become links.
--
-- The pin: the newest Weekly Buzz is pinned (Jon, 2026-10-24), and #12 takes
-- it from #10, but only while #10 still holds it. If anything else has been
-- pinned in /admin since, that stays pinned and #12 goes in unpinned.
--
-- Safe to re-run, like 0006: the posts are OR IGNORE on their slugs, the pin
-- moves only while #12 is not in yet, and the history rows are guarded by
-- NOT EXISTS.
--
-- Nothing in public/ is involved, so this does not wait for a deploy. Apply it
-- with Jon's OK in chat: npm run db:migrate:remote

-- #12 takes the pin from #10 (recorded first, while the condition still holds).
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz import (migration 0009, at Jon''s request)', 'unpin', slug, title, '{"reason": "Weekly Buzz #12 is the newest"}'
FROM posts
WHERE slug = '2026-10-26-weekly-buzz-10'
  AND pinned = 1
  AND NOT EXISTS (SELECT 1 FROM posts WHERE slug = '2026-11-09-weekly-buzz-12');
UPDATE posts
SET pinned = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = '2026-10-26-weekly-buzz-10'
  AND pinned = 1
  AND NOT EXISTS (SELECT 1 FROM posts WHERE slug = '2026-11-09-weekly-buzz-12');

-- #11
INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-11-04-weekly-buzz-11',
  'PTA Weekly Buzz #11: November 2 to 8',
  '2026-11-04',
  NULL,
  NULL,
  '[{"key":"05fcdc888f708564f76600ea89946bc2.jpg","alt":"The Weekly Buzz List flyer for November 2 to 8, 2026","width":1237,"height":1600},{"key":"dced7132f925a926288f828550b7525c.jpg","alt":"The official 13th annual Little EAST poster, Time Warp: Saturday, November 14th, 2026, 11am to 3pm, 1712 E. 11th St., free and open to the public","width":1143,"height":1600},{"key":"d5377283801546ba387586f41340db70.jpg","alt":"The Treat Cart, a bolt of energy for our amazing staff: Blackshear teachers and staff picking snacks, drinks and candy from a cart decorated for Halloween","width":1600,"height":1600},{"key":"6308ecadacfe1b92220a6306e80fd50b.jpg","alt":"Día de los Muertos: the ofrenda in the front hallway, with marigolds, papel picado and paper butterflies","width":1600,"height":1600},{"key":"91af51d27f50914056ca9758cedf1429.jpg","alt":"Pies and Sides Buffet for our teachers and staff, Thursday, 11/19, with a QR code to sign up at tinyurl.com/BlackshearBuffet","width":1600,"height":1600},{"key":"19587069eb2e2a59c2ffa6884abd1ea7.jpg","alt":"The November 2026 calendar, also at tinyurl.com/BlackshearNovemberCalendar","width":1600,"height":1600}]',
  '05fcdc888f708564f76600ea89946bc2.jpg',
  '[]',
  0,
  0,
  'PTA Weekly Buzz #11 is here! Little EAST is Saturday, 11/14, so check your student’s backpack for the flyer, and our teachers’ Pies & Sides Buffet on 11/19 needs pies and sides.

Hope everyone had a fun, candy-filled Halloween and a restful 4 day weekend!

This week’s post includes:

- Thank you Lucy Begg (a 4th-grade mom) for taking Mr. B’s sketch and turning it into yet another amazing poster. Check your student’s backpack for your 13th Annual Little EAST flyer! Little EAST is Saturday, 11/14 - your student(s) might be performing! Read the post for more info - we’ll also be sending important flyers and Dojo messages to you. Get on Dojo so you don’t miss out AND check your student’s backpack!
- Last week we spoiled our teachers and staff: Daybreak Hospitality that owns Paperboy (yum!) brought breakfast tacos and Rice Krispie treats, while PTA brought in coffee k-cups and juices. PTA also created a Treat Cart complete with snacks, energy drinks and candy so the teachers and staff could go “trick-or-treating!”
- Special thanks to Mina Loder, who decorated our front hallway and created our beautiful ofrenda last month.
- Congratulations to the ten 5th graders selected by Dr. G to represent Blackshear at this Saturday’s AISD All-City Choral Festival! They’ll spend the day rehearsing, followed by a performance at 2pm (AISD Performing Arts Center).
- Volunteers needed! Our next Staff Appreciation event is on Thursday, 11/19. Please sign up to bring a pie or a side for our annual Pies & Sides Buffet: [tinyurl.com/BlackshearBuffet](https://tinyurl.com/BlackshearBuffet)

Reminders:

- PTA Meeting #2 is on Tuesday, 11/10
- We need Little EAST volunteers on Saturday, 11/14: [tinyurl.com/BlackshearLEVolunteer](https://tinyurl.com/BlackshearLEVolunteer)
- Thanksgiving Lunch will be on Thursday, 11/19 - more details coming!
- Staff Appreciation Pies & Sides event is on Thursday, 11/19
- Tea with Tiona is on Thursday, 11/19
- Monthly calendar: [tinyurl.com/BlackshearNovemberCalendar](https://tinyurl.com/BlackshearNovemberCalendar)',
  '2026-11-04T00:00:00Z',
  '2026-11-04T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-11-04T00:00:00Z', 'Weekly Buzz import (ClassDojo)', 'import', '2026-11-04-weekly-buzz-11', 'PTA Weekly Buzz #11: November 2 to 8',
       '{"source": "ClassDojo, Ms. PTA, 2026-11-04; pictures from the same post, less the two that name children (migration 0009)"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-11-04-weekly-buzz-11' AND action = 'import');

-- #12, pinned unless something other than #10 holds the pin.
INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
SELECT
  '2026-11-09-weekly-buzz-12',
  'PTA Weekly Buzz #12: November 9 to 15',
  '2026-11-09',
  NULL,
  NULL,
  '[{"key":"84a14f75a0243c00b02433d23021f160.jpg","alt":"The Weekly Buzz List flyer for November 9 to 15, 2026","width":1237,"height":1600},{"key":"f260cf163950e4d56b4b8454f71b49c6.jpg","alt":"The Little EAST poster on the school’s front fence, beside the Austin Studio Tour sign for Blackshear Elementary Fine Arts Academy, stop 303","width":1201,"height":1600},{"key":"656a8a717a3b6c7e1c2a43489035bc81.jpg","alt":"The 13th Little EAST Silent Auction is live, with a QR code to bid","width":1080,"height":1080},{"key":"1403b27f759074f65f1e26a5b568e529.jpg","alt":"Two Trashion outfits on dress forms in the hallway: one made of bubble wrap and snack wrappers, one of black and silver plastic","width":1600,"height":1600},{"key":"d4fea1fe0321f7490f754012f5db6660.jpg","alt":"Time Warp, the Little EAST Trashion Show, Saturday, Nov 14th, 2:30pm at Blackshear: create an outfit from things headed to the trash or recycle bin, at home or at Little EAST. Prizes for most creative, most sustainable, best time warp, best runway strut and best in show. A QR code to learn more","width":1600,"height":1600},{"key":"f94c03ac00b2b97d481056f54bcfc852.jpg","alt":"The Trashion schedule: design and make trashion in the art room 11am to 2pm, show meeting at 2:00, get dressed at 2:10, line up in the main hallway at 2:20, the show starts on the front walkway at 2:30pm, awards by 3pm. Below, students on the runway at past Trashion Shows","width":1600,"height":1600},{"key":"f77b55408c5de646b0dab0535e2e1800.jpg","alt":"Team PTA: PTA Meeting #2A, Tuesday at 7:40am. Come hear how you can help with last minute to-dos for Little EAST!","width":1600,"height":1600},{"key":"87f58a317ed2da8abce70a3cc09a80a4.jpg","alt":"Little EAST, Saturday, 11/14, 11am to 3pm: volunteers needed, with a QR code to sign up","width":1600,"height":1600},{"key":"91af51d27f50914056ca9758cedf1429.jpg","alt":"Pies and Sides Buffet for our teachers and staff, Thursday, 11/19, with a QR code to sign up at tinyurl.com/BlackshearBuffet","width":1600,"height":1600},{"key":"19587069eb2e2a59c2ffa6884abd1ea7.jpg","alt":"The November 2026 calendar, also at tinyurl.com/BlackshearNovemberCalendar","width":1600,"height":1600},{"key":"820d357e2b917d876d92f160f6d36861.jpg","alt":"The 13th annual Little EAST poster, Time Warp: Saturday, November 14th, 2026, 11am to 3pm, 1712 E. 11th St., free and open to the public","width":1080,"height":1080}]',
  '84a14f75a0243c00b02433d23021f160.jpg',
  '[]',
  CASE WHEN EXISTS (SELECT 1 FROM posts WHERE pinned = 1) THEN 0 ELSE 1 END,
  0,
  'PTA Weekly Buzz #12 is here! Little EAST is this Saturday, 11/14, the Silent Auction is live, and students can walk the runway in our 4th Trashion Show.

The countdown to Little EAST has officially started! The Silent Auction is LIVE and bidding (and outbidding) has started! [tinyurl.com/13thLittleEAST](https://tinyurl.com/13thLittleEAST). Follow us on Instagram for all the latest info! [@BlackshearPTA](https://www.instagram.com/blackshearpta/)

This week’s post includes:

- Make sure to check your child’s backpack. PTA members Anne, Lennie and Tony filled out over 150 “student performer” flyers. They even stapled sibling forms together to make it easier on families!
- Trashion Show: learn more about this super fun activity we do at Little EAST: [tinyurl.com/LETrashionShow](https://tinyurl.com/LETrashionShow)
- We need Volunteers! Little EAST on Saturday, 11/14: [tinyurl.com/BlackshearLEVolunteer](https://tinyurl.com/BlackshearLEVolunteer) AND for our upcoming Staff Appreciation event (Pies & Sides Buffet) on Thursday, 11/19: [tinyurl.com/BlackshearBuffet](https://tinyurl.com/BlackshearBuffet)
- PTA Meeting #2 is tomorrow - Tuesday, 11/10! Meet after drop off in the front conference room.

Reminders:

- We need Volunteers! Little EAST on Saturday, 11/14: [tinyurl.com/BlackshearLEVolunteer](https://tinyurl.com/BlackshearLEVolunteer)
- Reading Rock Stars is on Friday, 11/13
- Math Kangaroo Team Competition is on Tuesday, 11/17
- Thanksgiving Lunch will be on Thursday, 11/19 - more details coming!
- Staff Appreciation Pies & Sides event is on Thursday, 11/19: [tinyurl.com/BlackshearBuffet](https://tinyurl.com/BlackshearBuffet)
- Tea with Tiona is on Thursday, 11/19
- Picture Retakes on Thursday, 11/19
- Fall Break is 11/23-11/27
- Monthly calendar: [tinyurl.com/BlackshearNovemberCalendar](https://tinyurl.com/BlackshearNovemberCalendar)',
  '2026-11-09T00:00:00Z',
  '2026-11-09T00:00:00Z';
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-11-09T00:00:00Z', 'Weekly Buzz import (ClassDojo)', 'import', '2026-11-09-weekly-buzz-12', 'PTA Weekly Buzz #12: November 9 to 15',
       '{"source": "ClassDojo, Ms. PTA, 2026-11-09; pictures from the same post"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-11-09-weekly-buzz-12' AND action = 'import');
INSERT INTO edits (editor, action, slug, title, detail)
SELECT 'Weekly Buzz import (migration 0009, at Jon''s request)', 'pin', slug, title, '{"reason": "Weekly Buzz #12 is the newest"}'
FROM posts
WHERE slug = '2026-11-09-weekly-buzz-12'
  AND pinned = 1
  AND NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-11-09-weekly-buzz-12' AND action = 'pin');
