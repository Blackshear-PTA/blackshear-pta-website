# Blackshear PTA website

This is the website for the **Blackshear Elementary Fine Arts Academy PTA** in
East Austin. It is built and maintained by parent volunteers.

If you are a developer and want the technical documentation, it is all in
[`docs/`](docs/) and the map is [`docs/README.md`](docs/README.md). The rest of
this page is written for everyone else.

---

## Where the website is right now

| | |
|---|---|
| **The site parents use today** | <https://blackshearpta.weebly.com> |
| **The new site** | <https://blackshearpta.org> |
| **Can the public see the new one?** | **No.** It is behind a password until we launch |

The new site is finished enough to look at but is not open yet. Anyone who finds
`blackshearpta.org` gets a short "we're still building, here's our current site"
page instead. Board members and reviewers have a password that gets them in.

Ask Jon Flowers (Communications) for the password.

---

## How the site works, in plain terms

Most websites you have used are built on something like Weebly, Wix or
Squarespace: you log into a control panel, drag things around, and the company
charges a monthly fee for keeping it running. Our old site works that way.

This one is different, and the difference is the whole point.

**The words on the site live in a few plain text files.** Not in a database, not
behind a login. Just files, the way a Word document is a file. You can read them
without any special software.

**Changing a file republishes the site by itself.** When someone saves a change,
a service called Cloudflare notices within a few seconds, rebuilds the site, and
puts the new version online. It takes about a minute and nobody has to do
anything else.

**There is nothing running that can break.** The site is what is called a
*static* site, which means every page is prepared in advance and then just sat
there being served. There is no server doing work when you visit, no database
that can fall over, no software that needs updating for security.

That gives us three things the PTA specifically needs:

1. **It costs nothing.** Every service we use has a free tier, and this site is
   nowhere near any of the limits.
2. **It cannot really break.** There is no moving part to go wrong at 9pm the
   night before an event.
3. **It survives handover.** Every decision and its reasoning is written down in
   this repository. When the board turns over, the next person inherits the
   explanation, not just the files.

---

## Where the words live

Almost everything you would want to change is in one of four files.

| File | What it controls |
|---|---|
| `src/content/home.yaml` | Everything on the homepage: the quote, the buttons, the news items, the committee descriptions |
| `src/content/site.yaml` | The bits on *every* page: the menu at the top, the Donate button, the social links |
| `src/content/pages.yaml` | The other pages: Volunteer, Calendar, Sponsors, Little EAST, Staff Appreciation, Campus Beautification, Contact, Gallery |
| `src/data/events.json` | The calendar. **Do not edit this one by hand**, see below |

These are YAML files. YAML is a format designed to be read and written by
people: it is mostly `label: "the text"`, one per line, with indentation showing
what belongs to what. If you can fill in a form you can edit one.

**Adding a whole new page** means adding a block to `pages.yaml`. No programming
involved, and no developer needed.

---

## The calendar is a special case

The calendar is **still kept in Google Calendar**, exactly as it always has been,
on the PTA's `blackshearpta@gmail.com` account. Board members add events there
from the phone app, the same as before.

The website reads that calendar automatically once a day and redraws its own
calendar page to match. So:

- **To add or change an event, use Google Calendar.** Never edit the website.
- A change made this morning shows on the website by tomorrow.
- Parents can subscribe to the calendar from the website and get events straight
  into their own phone.

We chose this because the calendar should live where the people updating it
already are. Asking volunteers to learn a second system to add a bake sale is
how a calendar goes stale.

---

## Photos

Photos live in `src/assets/photos/`. Every one is described in the README in
that folder: what it shows, where it is used, and whether there is anything to
know about it.

Two rules we hold to:

- **Nothing goes up without the family being happy for it to be there.** Most of
  our current photos deliberately contain no children's faces.
- **Photos get described in words.** Every photo on the site has a written
  description attached for people using a screen reader. It is a few seconds of
  work and it is the difference between the site working for someone and not.

We are short of photos. If you have good ones from an event, send them to
`blackshearpta@gmail.com`.

---

## How to change something

**Today:** ask Jon. Send the change and it will be live shortly after.

**If you are comfortable trying it yourself:** every file above can be edited
directly on GitHub in a web browser. Open the file, click the pencil icon, make
the change, and describe what you changed at the bottom. Nothing you do there
can break the site permanently: every change is recorded, and any change can be
undone.

**Eventually:** the plan is a proper editing page at `blackshearpta.org/admin`,
where a board member signs in with the PTA Google account and edits the site
through a form. That is the single most important thing left to build, and the
reason is on the wall behind us: the old Weebly site went a year out of date
because updating it was harder than not updating it.

---

## Who runs this

The website is maintained by the PTA's Communications role, currently **Jon
Flowers**. The GitHub organisation and every account are owned by the PTA's own
`blackshearpta@gmail.com`, not by any individual, so nothing is lost when a
volunteer moves on.

Questions, corrections, or an offer to help: **blackshearpta@gmail.com**

---

## For developers

Everything technical is in [`docs/`](docs/):

| Document | What is in it |
|---|---|
| [`docs/README.md`](docs/README.md) | Index of everything below |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Getting it running, project layout, the rules that will bite you |
| [`docs/EDITING-CONTENT.md`](docs/EDITING-CONTENT.md) | The content files in detail, and how to add a page |
| [`docs/DEPLOYS.md`](docs/DEPLOYS.md) | How deploys work, build settings, the domain watch |
| [`docs/PRE-LAUNCH-GATE.md`](docs/PRE-LAUNCH-GATE.md) | The password gate, and how to remove it at launch |
| [`docs/CALENDAR.md`](docs/CALENDAR.md) | How the Google Calendar sync actually works |
| [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md) | Architecture and the reasoning behind every locked decision |

[`TASKS.md`](TASKS.md) in this folder is the live task board: what is done, what
is next, what is blocked and on whom. **Read it before planning anything.**
