# Instagram posts on `/gallery`

Up to six posts from [@blackshearpta](https://www.instagram.com/blackshearpta/)
are embedded on `/gallery`, above the PTA's own photo grid.

**They are chosen in the editor.** Open `/admin`, scroll to **Instagram posts**,
and paste an address. There is no separate publish step, no account to connect,
and nothing that expires.

## Adding a post

1. Open the post on instagram.com. It has to be **public** — a private or
   followers-only post shows as an empty box to everyone else.
2. Copy the address from the browser bar. It looks like
   `https://www.instagram.com/p/ABC123/` or `.../reel/ABC123/`.
3. Paste it into the box in `/admin` and press **Add**.

The arrows reorder, **✕** removes. Every change saves immediately, and the live
page catches up in about a minute — same as an announcement.

A wrong address is refused on the spot with a message saying what to paste
instead. A profile link, a share link with a `?` in it, or a story all fail
there rather than becoming a blank rectangle on the live page.

## Why six, and why chosen rather than automatic

**Six** because each post is an iframe loaded from instagram.com. Six is already
a slow page on a phone in the school pickup line, and the PTA's own photo grid
sits right underneath doing much the same job for free. The number lives in
`MAX_POSTS` in `src/worker/instagram.mjs`.

**Chosen rather than automatic** because of a split worth understanding:

- **Displaying** a post needs nothing at all. Instagram renders any public post
  from its address. That is what this does.
- **Finding out which posts are the most recent** needs a Meta app, a Business
  account, and an access token that expires every 60 days. There is no
  unauthenticated way to ask "what did this account post lately?"

An automatic version was built and then removed. The token was the reason: it
has to be reissued through Meta's developer console every couple of months, and
that is not a task anyone inherits successfully at board turnover. The gallery
would have gone quietly empty some summer with nobody left who knew why. Picking
six posts a few times a year is less work than that, and it cannot break.

## Where it lives

One row in the site's database, the table `instagram_list`
(`migrations/0004_instagram_list.sql`), next to the announcements. So:

- **A save shows straight away.** `/gallery` itself is prerendered, so its
  photos stay resized, but the Instagram block is a *server island*
  (`src/components/InstagramWall.astro`) that reads the list on every visit.
  There is no rebuild to wait for.
- **History** on `/admin` records who changed it and when, with the whole list
  each time, so a mistake can be put back by hand.
- `npm run export:posts -- --remote` writes it to `exports/instagram.json`
  along with the announcements.

Until [A52](../TASKS.md) it was `src/content/instagram.yaml`, saved as a commit
through a GitHub token, and a change appeared only after the site rebuilt.

The address pattern and the maximum are defined once in
`src/worker/instagram.mjs` and used by the editor and the API. The table holds
the shape too: at most six entries, always a JSON list, only ever one row.
`npm run check:instagram` asserts every refusal, including lookalike hosts like
`instagram.com.evil.test`; `npm run check:d1` covers saving, conflicts and the
history row.

## Turning it off

Remove every post in `/admin`. The embeds and
Instagram's script both disappear — nothing is loaded from instagram.com when
the list is empty — leaving the photo grid and the follow link.
