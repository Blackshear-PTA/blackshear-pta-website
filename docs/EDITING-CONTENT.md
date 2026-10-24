# Editing content

Nothing on this page needs a developer. If you can fill in a form you can change
the words on this site.

Everything the site says lives in three YAML files plus one generated JSON file.
YAML is a plain-text format designed for people: mostly `label: "the text"`, one
per line, with indentation showing what belongs to what.

| File | Controls |
|---|---|
| `src/content/home.yaml` | The homepage |
| `src/content/site.yaml` | The menu, the Donate button, the social links: everything that appears on *every* page |
| `src/content/pages.yaml` | Every other page |
| `src/data/events.json` | The calendar. **Generated. Never edit by hand** - see [CALENDAR.md](CALENDAR.md) |

## The safety net

`src/content.config.ts` defines the shape each file must have, and the build
checks every file against it. A typo, a missing field, a link where a heading
belongs: **the build fails and nothing is published.** You cannot break the live
site with a bad edit, only fail to update it.

If a build fails, the error names the file and the field.

## Changing words

Open the file, find the text, change it between the quotes, save. That is the
whole procedure.

```yaml
hero:
  headline: "Alone we can do so little, together we can do so much"
  subhead: "Blackshear Elementary PTA is a community of parents..."
```

Two things to watch:

- **Keep the quotes.** `headline: "New text"`, not `headline: New text`. It
  usually works without them and then mysteriously does not the day your text
  contains a colon.
- **Keep the indentation.** YAML uses spaces to show nesting. If `headline:` is
  indented two spaces under `hero:`, leave it that way. Never use tabs.

## Adding a page

Add a block to `src/content/pages.yaml`. **The top-level key becomes the web
address**, so `volunteer:` publishes `blackshearpta.org/volunteer`.

```yaml
book-fair:
  meta:
    title: "Book Fair - Blackshear PTA"
    description: "One sentence. This is what shows in Google results."
  title: "Book Fair"
  lede: "One line under the title, over the photo."
  backdrop: little-east          # which photo sits behind the title
  body:
    - "First paragraph."
    - "Second paragraph."
  cta:                            # optional, the one main button
    label: "Sign up to help"
    href: "https://example.com/signup"
  sections:                       # optional, as many as you like
    - heading: "What we need"
      body:
        - "A paragraph inside this section."
      links:
        - label: "Volunteer sign-up sheet"
          href: "https://example.com"
          note: "Opens SignUpGenius"     # optional small print
      names: []                   # plain names, no links: sponsor lists
  contact:                        # optional
    email: "hello@blackshearpta.org"
    note: "Anything else worth saying."
```

`backdrop` must be one of the slugs listed in `src/content.config.ts`. Using one
that does not exist fails the build with a message naming the valid options.

### Sections that fold, with videos and photos

A section can also carry videos and pictures, and can fold shut under its
heading. `/little-east` uses all of it, one section per year:

```yaml
    - heading: "2025 - the 12th Little EAST"
      expanded: true              # folds: true starts open, false starts closed
      body:
        - "One line about the year."
      videos:
        - youtubeId: "LSkAJ5eusCo"   # the part after watch?v= or youtu.be/
          title: "The 12th Little EAST, 2025"
        # or a TikTok: the number at the end of its address
        # - tiktokId: "7165672308009422123"
        #   title: "The 9th Little EAST, 2022"
      figures:                    # shown whole, never cropped: posters, banners
        - src: "../assets/little-east/2025/poster.jpg"
          alt: "What the poster shows, for a screen reader"
          caption: "The poster"   # optional, shown under it
      photos:                     # square thumbnails that open full size
        - src: "../assets/little-east/2025/photo-01.jpg"
          alt: "What is in the photo"
```

Leave `expanded` out and the section is always shown, as on every other page.
Picture paths are relative to `pages.yaml`, so they start `../assets/`. A path
to a file that is not there fails the build and names the file.

**When a new Little EAST year goes on top,** give it `expanded: true` and change
last year's to `false`, so only the newest year opens by default. Its pictures
go in a new `src/assets/little-east/<year>/` folder.

### Sponsor logos

`/sponsors` shows business sponsors as a row of logos, loose on the page with
no boxes around them, each linking to the sponsor's website. The 2026-2027 sponsorship levels promise "logo and link" on
this site from Community Buzz up, so a new business sponsor needs both:

```yaml
      logos:
        - src: "../assets/sponsors/2026-2027/butler.png"
          name: "Butler"                  # what a screen reader says
          href: "https://withbutler.com"  # optional: leave out if there is none
```

Put the file in `src/assets/sponsors/<year>/`. **No size to set:** every logo
gets about the same area on the page, worked out from its own proportions, up
to 11 × 5.5 rem (about 176 × 88 pixels). So a wide wordmark and a square badge
come out looking the same size.

- **Crop off any margin first**, white or transparent. A margin counts as part
  of the logo and makes it look small.
- **The file to ask a sponsor for:** PNG or SVG, ideally with a transparent
  background, at least 400 pixels across. Anything smaller looks soft on a
  phone or a high-resolution screen.

Family sponsors are plain names, in `names:`.

### The homepage's Helpful Links

The handbook, drop-off and pick-up, supply lists and the rest live under
`helpfulLinks:` in `src/content/home.yaml`, in groups. Each link takes a
`label`, an `href` and an optional `note`, like the Start Here tiles above it.
Several are tinyurls on purpose: whoever runs the tinyurl points it at next
year's document, and the site follows without an edit.

**Then add it to the menu**, if it belongs there, in `src/content/site.yaml`:

```yaml
    - label: "Book Fair"
      href: "/book-fair"
```

Menu entries pointing somewhere outside this site need `external: true`, which
adds the little arrow and opens a new tab.

## Adding a photo

For a picture in a page section (a year of Little EAST, say), put the file
under `src/assets/` and list it in `pages.yaml` as above. Nothing else is needed.

For anywhere else on the site:

1. Put the file in `src/assets/photos/`.
2. Add a row to `src/assets/photos/README.md` saying what it shows and where it
   is used. This is not bureaucracy: it is how the next person knows whether
   they can move it.
3. Reference it from the component that needs it.

Photos have to be *imported* (or listed through `pages.yaml`'s `src:`, which
imports them for you) rather than referenced by a path string, because that is
what lets the build resize and re-compress them. A path string ships the
original: several of ours are 4MB phone photos, which on a phone connection is
the difference between a page loading and a parent giving up.

Two standing rules:

- **Nothing goes up without the family being happy for it to be there.** Most
  current photos deliberately contain no children's faces. The Little EAST
  archive is the exception: its photos were already public on the old Weebly
  page for years, and were carried over as they were at Jon's direction (A40).
- **Every photo needs a written description** (`alt` text) saying what is in it,
  for anyone using a screen reader. Write what you would say describing the
  photo to someone on the phone. Not "photo1.jpg".

## Editing without installing anything

Every file above can be edited in a browser on GitHub: open it, click the pencil
icon, edit, and describe the change at the bottom.

Nothing you do there is permanent in the bad sense. Every change is recorded
with who made it and when, and any change can be undone. The worst realistic
outcome is a failed build and a site that keeps showing yesterday's version.

## Announcements: use the editor, not the files

Announcements have their own editor at
[blackshearpta.org/admin](https://blackshearpta.org/admin). Sign in with your
PTA account, write a title and a paragraph, save. **It is live straight away** -
reload the announcements page and it is there.

You can pin a post to the top, or save it as a **draft** to finish later - a
draft is invisible on the site, the homepage and the feed.

Announcements are the one kind of content that is **not** a file in this
repository. They are rows in a database, which is what makes saving instant:
everything else here needs the site rebuilt before a change shows up, and that
is the minute you would otherwise be waiting.

Nothing is lost by that. Every change is listed under **History** at the bottom
of the editor, with who made it and when, and a deleted post is kept there in
full so it can be put back. You do not need git or a terminal to read it.

The markdown files the posts used to live in, `src/content/announcements/*.md`,
were deleted on 2026-10-15, once saving through the editor had been proven on
the live site. For a copy of the current posts as markdown, run
`npm run export:posts -- --remote`.

Setup and troubleshooting are in [ADMIN.md](ADMIN.md).

## Where this is going

The editor currently covers announcements, which is the content that actually
changes week to week. Page copy and the homepage are still YAML files.

The reasoning is on the record as F18: the old Weebly site went a year out of
date because updating it was harder than not updating it. A site nobody can
update is a site that goes stale, however well built it is. Announcements were
the first target because they are the part that goes stale fastest and most
visibly.
