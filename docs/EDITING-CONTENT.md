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
    email: "blackshearpta@gmail.com"
    note: "Anything else worth saying."
```

`backdrop` must be one of the slugs listed in `src/content.config.ts`. Using one
that does not exist fails the build with a message naming the valid options.

**Then add it to the menu**, if it belongs there, in `src/content/site.yaml`:

```yaml
    - label: "Book Fair"
      href: "/book-fair"
```

Menu entries pointing somewhere outside this site need `external: true`, which
adds the little arrow and opens a new tab.

## Adding a photo

1. Put the file in `src/assets/photos/`.
2. Add a row to `src/assets/photos/README.md` saying what it shows and where it
   is used. This is not bureaucracy: it is how the next person knows whether
   they can move it.
3. Reference it from the component that needs it.

Photos have to be *imported* rather than referenced by a path string, because
that is what lets the build resize and re-compress them. A path string ships the
original: several of ours are 4MB phone photos, which on a phone connection is
the difference between a page loading and a parent giving up.

Two standing rules:

- **Nothing goes up without the family being happy for it to be there.** Most
  current photos deliberately contain no children's faces.
- **Every photo needs a written description** (`alt` text) saying what is in it,
  for anyone using a screen reader. Write what you would say describing the
  photo to someone on the phone. Not "photo1.jpg".

## Editing without installing anything

Every file above can be edited in a browser on GitHub: open it, click the pencil
icon, edit, and describe the change at the bottom.

Nothing you do there is permanent in the bad sense. Every change is recorded
with who made it and when, and any change can be undone. The worst realistic
outcome is a failed build and a site that keeps showing yesterday's version.

## Where this is going

The plan is an editing page at `blackshearpta.org/admin` where a board member
signs in with the PTA Google account and edits through a form, with no YAML at
all. It is tracked as A23 in [`../TASKS.md`](../TASKS.md) and it is the most
important thing left to build.

The reasoning is on the record as F18: the old Weebly site went a year out of
date because updating it was harder than not updating it. A site nobody can
update is a site that goes stale, however well built it is.
