-- Blackshear PTA - the PTA Weekly Buzz, #1 to #9 (August 24 to October 19,
-- 2026), and one older announcement, into the announcements table.
--
-- Asked for by Jon 2026-10-23 (TASKS.md A46). The Weekly Buzz went out on
-- ClassDojo and on a blog page of the old Weebly site, never here. The text
-- is the PTA's ClassDojo post for each week, which is fuller than the Weebly
-- copy; the flyer is the one Weebly published, served from
-- public/weekly-buzz/. Changes from the originals, all small:
--   - The WhatsApp invitation links are left out (Jon, 2026-10-23: not
--     published yet). Those lines say to email hello@ instead.
--   - #8's Microsoft Teams link for the 2026-10-13 meeting is left out: it
--     carried the meeting's passcode, and the meeting is over.
--   - #4 names the student who placed in Math Kangaroo on ClassDojo only; the
--     public Weebly post did not, so this does not either.
--   - BlackshearPTA@gmail.com becomes hello@blackshearpta.org, the PTA's
--     public address since A34. The Gmail forwards there anyway.
--   - "Keep swiping" lines, which refer to ClassDojo's slides, are gone.
--   - #8 has no flyer: Weebly's copy for that week was an early draft of #9's.
--
-- The older one is the grants video the old site's homepage carried: "we won
-- TWO grants last year", dated to the video's upload, 2025-03-05.
--
-- Safe to re-run, like 0002: posts are OR IGNORE on the slug primary key and
-- the audit rows are guarded by NOT EXISTS.
--
-- APPLY ONLY AFTER the PR that adds public/weekly-buzz/ has deployed, or the
-- flyers will be broken images: npm run db:migrate:remote

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2025-03-05-austin-ed-fund-grants',
  'We won two Austin Ed Fund grants',
  '2025-03-05',
  'https://www.youtube.com/watch?v=jRViMuKLDmE',
  'Watch the video',
  '[]',
  NULL,
  '[]',
  0,
  0,
  'Psst... we won TWO Austin Ed Fund grants this school year! Take a look at what they made possible for Blackshear students during 2024-2025.',
  '2025-03-05T00:00:00Z',
  '2025-03-05T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2025-03-05T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2025-03-05-austin-ed-fund-grants', 'We won two Austin Ed Fund grants',
       '{"source": "blackshearpta.weebly.com homepage; date from the YouTube upload"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2025-03-05-austin-ed-fund-grants' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-08-24-weekly-buzz-1',
  'PTA Weekly Buzz #1: August 24 to 30',
  '2026-08-24',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for August 24 to 30, 2026](/weekly-buzz/2026-08-24.jpg)

Welcome new and old Yellowjackets! Your PTA is excited to meet you - we''re always trying new ways to connect with our families.

Introducing our PTA Weekly Buzz:

- The week''s events
- What''s new & important
- Upcoming events
- Other important info

This week''s post also includes:

- August monthly calendar: [tinyurl.com/BlackshearAugustCalendar](https://tinyurl.com/BlackshearAugustCalendar)
- Fine Arts Fee Donation: Blackshear students receive two additional classes per week in the fine arts (dance, theater, film, music, visual arts, and more). This donation goes to support this amazing programming. [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, Drop-off/Pickup info, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)

Last year, we created a WhatsApp Community so our families could connect with one another. Over the summer, we created groups for each grade level. To join, email us at [hello@blackshearpta.org](mailto:hello@blackshearpta.org).',
  '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-08-24T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-08-24-weekly-buzz-1', 'PTA Weekly Buzz #1: August 24 to 30',
       '{"source": "ClassDojo, Ms. PTA, 2026-08-24; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-08-24-weekly-buzz-1' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-08-31-weekly-buzz-2',
  'PTA Weekly Buzz #2: August 31 to September 6',
  '2026-08-31',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for August 31 to September 6, 2026](/weekly-buzz/2026-08-31.jpg)

PTA Weekly Buzz #2 is here! Join us tomorrow after drop off for our First PTA Meeting of the Year! We''ll share some of the things we have planned for the year. We also want to hear from you! You don''t have to be a member to attend.

If you want to join, visit our Blackshear Store: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)

This week''s post also includes:

- Monthly calendar: [tinyurl.com/BlackshearSeptemberCalendar](https://tinyurl.com/BlackshearSeptemberCalendar)
- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, Drop-off/Pickup info, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- Thank you Buzz Mill and Squatch Fitness for the school supplies! This amazing group of people, including Blackshear parents, Edna Yang (Dakari - 1st grade, Kaia - 5th grade) and Jeany Choi (Moon - 5th grade) did a ruck, where they loaded up backpacks and wagons and hiked to our school!

Reminder: please pay your student''s fine arts fee - we have a Pay What You Can option. Every dollar counts! [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)',
  '2026-08-31T00:00:00Z',
  '2026-08-31T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-08-31T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-08-31-weekly-buzz-2', 'PTA Weekly Buzz #2: August 31 to September 6',
       '{"source": "ClassDojo, Ms. PTA, 2026-08-31; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-08-31-weekly-buzz-2' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-09-07-weekly-buzz-3',
  'PTA Weekly Buzz #3: September 7 to 13',
  '2026-09-07',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for September 7 to 13, 2026](/weekly-buzz/2026-09-07.jpg)

PTA Weekly Buzz #3 is here!

We had a great turnout for our first PTA meeting! We were able to share what we did last year. We heard from our Committee chairs and learned how to get involved. You can see the slide deck here: [tinyurl.com/BlackshearSlideDeck](https://tinyurl.com/BlackshearSlideDeck)

Join our PTA by visiting our Blackshear Store: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
Membership is $11.50; we also have Membership scholarships.

We have 68 members so far - we''d love to match last year''s membership of 85 by the end of the month! Let''s Go Yellowjackets!

This week''s post also includes:

- Volunteers are needed this Thursday to help clean and refresh our Teachers Lounge. Meet in the front office after drop off. Check in at the Front Office AND submit your background check: [austinisd.voly.org](https://austinisd.voly.org)
- Blackshear received TWO grants this past week - both written by PTA on behalf of the school. Learn more: [tinyurl.com/BlackshearGrants](https://tinyurl.com/BlackshearGrants)
- Updated monthly calendar: [tinyurl.com/BlackshearSeptemberCalendar](https://tinyurl.com/BlackshearSeptemberCalendar)

Reminders:

- Please pay your student''s fine arts fee - we have a Pay What You Can option. Every dollar counts! [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
- Back to School Night is 9/17, 5pm-7pm
- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- Mark your calendars: Little EAST is on Saturday, 11/14 from 11am-3pm. This is our biggest Community event!',
  '2026-09-07T00:00:00Z',
  '2026-09-07T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-09-07T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-09-07-weekly-buzz-3', 'PTA Weekly Buzz #3: September 7 to 13',
       '{"source": "ClassDojo, Ms. PTA, 2026-09-07; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-07-weekly-buzz-3' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-09-14-weekly-buzz-4',
  'PTA Weekly Buzz #4: September 14 to 20',
  '2026-09-14',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for September 14 to 20, 2026](/weekly-buzz/2026-09-14.jpg)

PTA Weekly Buzz #4 is here!

Fine Arts is starting this week! This is one of the many things that makes Blackshear such a gem! Learn more: [tinyurl.com/BlackshearFineArtsInfo](https://tinyurl.com/BlackshearFineArtsInfo)

Math Kangaroo is a nonprofit that is dedicated to helping kids love math. Last year''s Austin Ed Fund Grant allowed over 60 students to participate in this International Math Competition. Our students did fantastic, and one of them ranked 9th as a Grade 4 National Winner!!! We''re excited to participate again this year and they even have a team competition. More info coming. Learn more: [mathkangaroo.org](https://mathkangaroo.org)

Join our PTA by visiting our Blackshear Store: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
Membership is $11.50; we also have Membership scholarships.

We have 71 members so far - we''d love to match last year''s membership of 85 by the end of the month! Let''s Go Yellowjackets!

This week''s post also includes:

- Info about the David Phillips Foundation (DPF)''s after school clubs. Blackshear PTA reached out to DPF two summers ago and they were able to start a Skateboarding Club last Fall. In addition, DPF was able to start a Karate Club for our younger students this year! Learn more: [www.davidphillipsfoundation.org](https://www.davidphillipsfoundation.org)
- Back to School Night is this Thursday, 9/17, 5pm-7pm. Come meet your student''s teacher(s) and see what they''re up to for the year! Light refreshments served while supplies last.
- Bike to School Day is Wednesday, October 7. In the past, we''ve organized THREE bike trains from the neighborhood. These trains meet up with our students that commute by car and we bike together around the school. With more bus riders this year, we need to re-think how we can safely host this fun event. Learn more: [tinyurl.com/BlackshearBikeDayInfo](https://tinyurl.com/BlackshearBikeDayInfo)
  If anyone has ideas, please reach out to [hello@blackshearpta.org](mailto:hello@blackshearpta.org). We''d also love ideas on how our bus riders might participate or how we might add a fourth bike train that comes down Rosewood - maybe this gets planned for Bike to School Day in May.

Reminders:

- Please pay your student''s fine arts fee - we have a Pay What You Can option. Every dollar counts! [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- September monthly calendar: [tinyurl.com/BlackshearSeptemberCalendar](https://tinyurl.com/BlackshearSeptemberCalendar)
- Mark your calendars: Little EAST is on Saturday, 11/14 from 11am-3pm. Little EAST is less than 9 weeks away - if you''re interested in helping, please send us an email: [hello@blackshearpta.org](mailto:hello@blackshearpta.org)',
  '2026-09-14T00:00:00Z',
  '2026-09-14T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-09-14T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-09-14-weekly-buzz-4', 'PTA Weekly Buzz #4: September 14 to 20',
       '{"source": "ClassDojo, Ms. PTA, 2026-09-14; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-14-weekly-buzz-4' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-09-22-weekly-buzz-5',
  'PTA Weekly Buzz #5: September 21 to 27',
  '2026-09-22',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for September 21 to 27, 2026](/weekly-buzz/2026-09-22.jpg)

PTA Weekly Buzz #5 is here!

You all brought the energy last Thursday - Back to School was a success! Thanks for coming out.

Hopefully, you had some time to flip through our Neon Flip Book - we have a lot of amazing things happening here! If you didn''t get one, stop by the front office or let us know your student''s name - we''ll send one home this week.

One simple thing you can do to support us is to join our PTA by visiting our Blackshear Store: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
Membership is $11.50; we also have Membership scholarships.

We have 79 members so far - we''re so close to matching last year''s membership of 85! Let''s Go Yellowjackets!

This week''s post also includes:

- Our Campus Beautification/Garden Committee is meeting this evening at 6pm (front of school). Come hear what''s going on and learn how you can help. Can''t make it? Sign up to volunteer: workdays [tinyurl.com/BlackshearGardenDays](https://tinyurl.com/BlackshearGardenDays), weekly watering [tinyurl.com/BlackshearWateringHelp](https://tinyurl.com/BlackshearWateringHelp)
- Bike to School Day is Wednesday, October 7. In the past, we''ve organized THREE bike trains from the neighborhood. These trains meet up with our students that commute by car and we bike together around the school. RSVP if you plan on participating: [tinyurl.com/YellowJacketBikeDay](https://tinyurl.com/YellowJacketBikeDay)
- CatchALL Night is coming up on 10/22, 5:00pm-6:30pm

Reminders:

- Please pay your student''s fine arts fee - we have a Pay What You Can option. Every dollar counts! [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
- Linktree: this is our new Information Hub. You''ll find links to important things like our PTA website, our Instagram, our WhatsApp, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- Little EAST is on Saturday, 11/14 from 11am-3pm. If you''re interested in helping, please send us an email: [hello@blackshearpta.org](mailto:hello@blackshearpta.org)',
  '2026-09-22T00:00:00Z',
  '2026-09-22T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-09-22T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-09-22-weekly-buzz-5', 'PTA Weekly Buzz #5: September 21 to 27',
       '{"source": "ClassDojo, Ms. PTA, 2026-09-22; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-22-weekly-buzz-5' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-09-28-weekly-buzz-6',
  'PTA Weekly Buzz #6: September 28 to October 4',
  '2026-09-28',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for September 28 to October 4, 2026](/weekly-buzz/2026-09-28.jpg)

PTA Weekly Buzz #6 is here! Can you believe October is almost here?! This means we''re getting close to our favorite annual PTA sponsored event, Little EAST! See last year''s event video: [tinyurl.com/12LEvideo](https://tinyurl.com/12LEvideo)

On 11/14, we''ll transform our school into a student art gallery for the day, with student music and dance performances, craft and activity tables, an interactive art station, a Silent Auction, 5th grade Bake Sale and a Trashion Fashion Show. This is our biggest Community event of the year. If you''re considering volunteering, this is THE event to do it!

Please join our PTA! We''re close to matching last year''s member total of 85. If a few more join by Tuesday, we''ll receive one of TxPTA''s monthly awards! Let''s Go Yellowjackets! Pay your membership dues here: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
We also have Membership scholarships.

This week''s post also includes:

- Bike to School Day is next week - Wednesday, October 7. RSVP for fun prizes and breakfast: [tinyurl.com/YellowJacketBikeDay](https://tinyurl.com/YellowJacketBikeDay)
  Our THREE bike trains will still go on like always. More info here: [tinyurl.com/BlackshearBikeDayInfo](https://tinyurl.com/BlackshearBikeDayInfo)
  We''re trying to figure out how we can safely ride together at school given that the buses often arrive at 7:20am/7:25am. Stay tuned!
- CatchALL Night is coming up on 10/22, 5:00pm-6:30pm - this event brings our community together to learn about health, literacy, and STEAM. Light refreshments served.
- Monthly calendar: [tinyurl.com/BlackshearOctoberCalendar](https://tinyurl.com/BlackshearOctoberCalendar)

Reminders:

- Please pay your student''s fine arts fee - we have a Pay What You Can option. Every dollar counts! [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- Garden Workday is on Sunday, 10/18, 9am to Noon, volunteer here: [tinyurl.com/BlackshearGardenDays](https://tinyurl.com/BlackshearGardenDays)
- Little EAST is on Saturday, 11/14 from 11am-3pm. If you''re interested in helping, please send us an email: [hello@blackshearpta.org](mailto:hello@blackshearpta.org)',
  '2026-09-28T00:00:00Z',
  '2026-09-28T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-09-28T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-09-28-weekly-buzz-6', 'PTA Weekly Buzz #6: September 28 to October 4',
       '{"source": "ClassDojo, Ms. PTA, 2026-09-28; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-09-28-weekly-buzz-6' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-10-05-weekly-buzz-7',
  'PTA Weekly Buzz #7: October 5 to 11',
  '2026-10-05',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for October 5 to 11, 2026](/weekly-buzz/2026-10-05.jpg)

PTA Weekly Buzz #7 is here!

It''s October and we''re well into football season (and festival season). Did you know that before EVERY UT home football game, there are FREE carnival games, rides and a free live concert? 10/17, 10/24, 10/31, 11/21 [texaslonghorns.com/sports/2026/8/28/texas-football-signature-pregame-destinations](https://texaslonghorns.com/sports/2026/8/28/texas-football-signature-pregame-destinations)

On 10/22, our Community will gather for our CatchALL Night. This is our Catch + Literacy Night with a little STEAM added... Don''t miss this fun event - light dinner will be served.

There will be an increase in bike (skateboard, scooter) traffic on WEDNESDAY for Bike to School Day. Please be aware that morning drop off will be affected! Don''t forget to RSVP for the event so your kiddo can get fun prizes and breakfast: [tinyurl.com/YellowJacketBikeDay](https://tinyurl.com/YellowJacketBikeDay)

We matched last year''s PTA membership count of 85 members! Thank you to everyone that joined. We''d love to increase this - teachers, staff, parents, grandparents... please consider joining. Pay your membership dues here: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
We also have Membership scholarships. Let''s Go Yellowjackets!

This week''s post also includes:

- Volunteers Needed: Bike to School Day (Wed 10/7): [tinyurl.com/BlackshearBikeVolunteer](https://tinyurl.com/BlackshearBikeVolunteer) AND Garden Workday (Sun, 10/18, 9am to Noon): [tinyurl.com/BlackshearGardenDays](https://tinyurl.com/BlackshearGardenDays)
- Monthly calendar: [tinyurl.com/BlackshearOctoberCalendar](https://tinyurl.com/BlackshearOctoberCalendar)

Reminders:

- This is the last week to pay your student''s fine arts fee - we have a Pay What You Can option. Every dollar counts! [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- Garden Workday is on Sunday, 10/18, 9am to Noon, volunteer here: [tinyurl.com/BlackshearGardenDays](https://tinyurl.com/BlackshearGardenDays)
- Little EAST is on Saturday, 11/14 from 11am-3pm. If you''re interested in helping, please send us an email: [hello@blackshearpta.org](mailto:hello@blackshearpta.org). ALL PK4, Kinder and 1st graders will perform. 2nd & 3rd graders in Ukulele and Drumming will perform. 4th & 5th graders in Violin will perform.',
  '2026-10-05T00:00:00Z',
  '2026-10-05T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-10-05T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-10-05-weekly-buzz-7', 'PTA Weekly Buzz #7: October 5 to 11',
       '{"source": "ClassDojo, Ms. PTA, 2026-10-05; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-05-weekly-buzz-7' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-10-12-weekly-buzz-8',
  'PTA Weekly Buzz #8: October 12 to 18',
  '2026-10-12',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  'PTA Weekly Buzz #8 is here!

We hope everyone was able to spend some time outdoors over the long weekend. The weather was especially nice in the evenings! Tomorrow we''ll be hosting a virtual PTA meeting - ALL are welcome: 6pm-7:30pm.

We had a fun Bike to School Day and are already thinking about how we can get more students on bikes in May!

We matched last year''s PTA membership count of 85 members! Thank you to everyone that joined. We''d love to increase this - teachers, staff, parents, grandparents... please consider joining. Pay your membership dues here: [tinyurl.com/BlackshearStore](https://tinyurl.com/BlackshearStore)
We also have Membership scholarships. Let''s Go Yellowjackets!

This week''s post also includes:

- A call for volunteers!
- CatchALL Night: light dinner served, health resources and info, afterschool clubs, Peace Corner make and take activities, FREE books, literacy activities and more!
- Little EAST: all students K-5th will have artwork displayed. Kinder and 1st graders will perform (correction: PK will not be performing). 2nd & 3rd graders in Ukulele and Drumming will perform. 4th & 5th graders in Violin will perform.
- Monthly calendar: [tinyurl.com/BlackshearOctoberCalendar](https://tinyurl.com/BlackshearOctoberCalendar)

Reminders:

- Linktree: this is our new Information Hub. You''ll find links to important things like our Family Handbook, our website, our Instagram, volunteer opportunities and so much more! [linktr.ee/blackshearpta](https://linktr.ee/blackshearpta)
- Garden Workday is on Sunday, 10/18, 9am to Noon, volunteer here: [tinyurl.com/BlackshearGardenDays](https://tinyurl.com/BlackshearGardenDays)
- Little EAST is on Saturday, 11/14 from 11am-3pm: [tinyurl.com/BlackshearLEVolunteer](https://tinyurl.com/BlackshearLEVolunteer)',
  '2026-10-12T00:00:00Z',
  '2026-10-12T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-10-12T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-10-12-weekly-buzz-8', 'PTA Weekly Buzz #8: October 12 to 18',
       '{"source": "ClassDojo, Ms. PTA, 2026-10-12; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-12-weekly-buzz-8' AND action = 'import');

INSERT OR IGNORE INTO posts
  (slug, title, date, href, link_label, images, cover, grades, pinned, draft, body, created_at, updated_at)
VALUES (
  '2026-10-19-weekly-buzz-9',
  'PTA Weekly Buzz #9: October 19 to 25',
  '2026-10-19',
  NULL,
  NULL,
  '[]',
  NULL,
  '[]',
  0,
  0,
  '![The Weekly Buzz List flyer for October 19 to 25, 2026](/weekly-buzz/2026-10-19.jpg)

PTA Weekly Buzz #9 is here!

Hoping this beautiful weather is here to stay! There is no shortage of fun things to do - if you''re looking for activities, join our WhatsApp Community: email us at [hello@blackshearpta.org](mailto:hello@blackshearpta.org) and we''ll add you.

Let''s get involved!

- Donate an item for next week''s Staff Treat Cart: [tinyurl.com/BlackshearStaff](https://tinyurl.com/BlackshearStaff)
- Volunteer for a shift at our biggest event, Little EAST. This year''s theme is Time Warp. [tinyurl.com/BlackshearLEVolunteer](https://tinyurl.com/BlackshearLEVolunteer)
- We also need bakers for the Little EAST Bake Sale benefiting our 5th graders: [tinyurl.com/Blackshear5thBakeSale](https://tinyurl.com/Blackshear5thBakeSale)

Reminders:

- Picture Day is TOMORROW!! Tuesday, 10/20
- Thursday, 10/22: CatchALL Night: light dinner served, health resources and info, afterschool clubs, Peace Corner make and take activities, FREE books, literacy activities and more!
- Saturday, 11/14: Little EAST: all students K-5th will have artwork displayed, all Kinder and 1st graders will perform. 2nd & 3rd graders in Ukulele and Drumming will perform. 4th & 5th graders in Violin will perform.
- Monthly calendar: [tinyurl.com/BlackshearOctoberCalendar](https://tinyurl.com/BlackshearOctoberCalendar)',
  '2026-10-19T00:00:00Z',
  '2026-10-19T00:00:00Z'
);
INSERT INTO edits (at, editor, action, slug, title, detail)
SELECT '2026-10-19T00:00:00Z', 'Weekly Buzz import (ClassDojo and blackshearpta.weebly.com)', 'import', '2026-10-19-weekly-buzz-9', 'PTA Weekly Buzz #9: October 19 to 25',
       '{"source": "ClassDojo, Ms. PTA, 2026-10-19; flyer from blackshearpta.weebly.com/weekly-buzz"}'
WHERE NOT EXISTS (SELECT 1 FROM edits WHERE slug = '2026-10-19-weekly-buzz-9' AND action = 'import');
