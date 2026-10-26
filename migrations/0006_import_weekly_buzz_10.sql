-- Blackshear PTA - the PTA Weekly Buzz #10 (October 26 to November 1, 2026).
--
-- Asked for by Jon 2026-10-26, from the Fundraising chair's ClassDojo post of
-- that day. The three pictures are the post's own, in its order: the Weekly
-- Buzz List flyer, the Little EAST volunteers poster, then Tea with Tiona,
-- served from public/weekly-buzz/. Changes from the original, all small, the
-- same kinds 0003 made:
--   - The "keep swiping" line is gone; it refers to ClassDojo's slides.
--   - The ClassDojo post opens with a correction to the No School dates. The
--     flyer here is the corrected one (Mon 11/2 and Tue 11/3), so the
--     correction is left out rather than contradicting the picture above it.
--   - "missyour" becomes "miss your", a stray ")" is dropped, and the
--     asterisk before the Little EAST date is gone.
--   - The opening line goes on with one sentence of what is in this week's
--     post, so /announcements has a real preview, as 0005 did for #3 to #9.
--
-- Safe to re-run, like 0003: the post is OR IGNORE on its slug and the history
-- row is guarded by NOT EXISTS.
--
-- APPLY ONLY AFTER the PR that adds the three pictures has deployed, or they
-- will be broken images: npm run db:migrate:remote

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-10-26-weekly-buzz-10',
  'PTA Weekly Buzz #10: October 26 to November 1',
  '2026-10-26',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for October 26 to November 1, 2026](/weekly-buzz/2026-10-26.jpg)

![The 13th annual Little EAST poster, Time Warp: Saturday, 11/14, 11am to 3pm, with a QR code to volunteer](/weekly-buzz/2026-10-26-little-east.jpg)

![Tea with Tiona, Thursday morning at 7:40am: join our principal, Ms. Bell, for a casual Q&A about campus updates and events](/weekly-buzz/2026-10-26-tea-with-tiona.jpg)

PTA Weekly Buzz #10 is here! Little EAST is Saturday, 11/14, Tea with Tiona is Thursday, and we’re nine members away from 100.

Did you know that Blackshear is AISD’s first and only fine arts academy?! Students in PK, Kinder and 1st grades participate in dance and movement classes with Ms. Toni Bravo (DiverseSpace Dance Studio) and Ms. Rebecca (Ballet Austin). 2nd, 3rd, 4th and 5th graders opt into Fine Arts classes that include drums, ukulele, violin, visual arts, film production, songwriting, and more. Don’t miss your student’s art work and/or performance(s) - take a few minutes to learn about Little EAST: [tinyurl.com/LittleEastFAQ](https://tinyurl.com/LittleEastFAQ) Saturday, 11/14, 11am to 3pm.

Reminders:

- 10/29: Tea with Tiona - join this informal meetup with Ms. Bell - she’ll share Campus updates and answer questions.
- We need Little EAST volunteers: [tinyurl.com/BlackshearLEVolunteer](https://tinyurl.com/BlackshearLEVolunteer)
- Monthly calendar: [tinyurl.com/BlackshearOctoberCalendar](https://tinyurl.com/BlackshearOctoberCalendar)

It’s not too late to join our PTA - next meeting is Tuesday, 11/10. Visit our Blackshear Store: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
Membership is $11.50; We also have FREE Memberships!

We have 91 members - 9 more and we’ll make it to 100. Can we do it by Friday?! Let’s Go Yellowjackets!',
  '2026-10-26T00:00:00Z',
  '2026-10-26T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-10-26T00:00:00Z', 'Weekly Buzz import (ClassDojo)', 'import', '2026-10-26-weekly-buzz-10', 'PTA Weekly Buzz #10: October 26 to November 1',
       '{"source": "ClassDojo, Ms. PTA, 2026-10-26; pictures from the same post"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-26-weekly-buzz-10' AND action = 'import');
