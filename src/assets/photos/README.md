# Photos used by the site

These live under `src/` because components import them: Astro's image pipeline
resizes, re-encodes and fingerprints anything imported from here at build time,
so the 4MB originals never reach a phone.

`assets/` at the repo root is the other half of the split; it holds source and
reference material nothing imports (brand originals, the Weebly salvage).

| File | Used for | Notes |
|---|---|---|
| `little-east.jpg` | Fine Arts / Little EAST committee | Student work on the wall. No faces, so no release question. |
| `garden.jpg` | Garden committee | Raised bed, black-eyed Susans. Happens to sit right on the brand palette. |
| `campus-flagpole.jpg` | Staff Appreciation committee | Flagpole, building and the "Best School" banner. The flagpole is vertical, so it reads better squared off than stretched wide. |
| `campus-frontage.jpg` | unused | Was a decorative strip in the top-right of the header. Both themes dropped it: the crop was not liked on Civic, and Print Shop followed. The whole feature came out rather than being switched off, because an `<img>` inside a `display:none` container is still downloaded. |
| `bake-sale.jpg` | Fundraising committee | A monthly snack sale table. No faces. Replaced a drawn icon, which never sat right next to three photographs. |
| `campus-front-walk.jpg` | Source for the top-band backdrop | Front walkway and entrance. Landscape and center-weighted, which is why it survives the narrow crop a phone gives a full-bleed band. 3000x2000, 6.3MB - **not** imported by a page; see the row below. |
| `campus-front-walk-band.webp` | Top-band backdrop, **both** themes | **Derived** from `campus-front-walk.jpg`. 1200x800, quality 45, 180KB. Sits under a scrim; see below. Why it is a committed file rather than a `getImage()` call is in the next section. |
| `campus-front-walk-social.jpg` | `og:image` link-preview card, every page | **Derived** from `campus-front-walk.jpg`. 1200x630, quality 72, 208KB. JPEG, not WebP - some scrapers still will not render WebP. Same reasoning as the row above. |
| `campus-side-entrance.jpg` | unused | Was Civic's backdrop. Portrait, so on a phone `cover` scaled it to height and the visible strip was mostly sky. Replaced by `campus-front-walk.jpg` on both themes. |
| `little-east-alt.jpg` | unused | Second Little EAST option. |
| `garden-alt.jpg` | unused | Second garden option. |

Committee thumbnails pass a square `width`/`height` against non-square sources.
Astro center-crops rather than squashing when you do that, which is what a
thumbnail grid wants.

Files are named for what they show rather than where they are used, so moving
one between slots does not leave a misleading name behind.

## Why some photos are pre-sized files

Every other photo here is imported at full size and resized by Astro at build
time. **`campus-front-walk-band.webp` and `campus-front-walk-social.jpg` are the
exceptions**, and the reason is that four routes stopped being prerendered.

`/`, `/announcements/`, `/announcements/<slug>/` and `/preview` now render **on
demand** so announcements can be current (see finding F41 in `TASKS.md`). Astro's
image pipeline needs sharp, sharp does not run in a Worker, and
`@astrojs/cloudflare`'s fallback image endpoint does not resize anything - it
streams the source file back with its original bytes. So any `getImage()` call
reached from one of those pages silently stops resizing and starts serving the
6.3MB original.

That happened twice:

| Where | Symptom |
|---|---|
| Top-band backdrop | The homepage shipped 6.3MB instead of 180KB. Caught before release. |
| `og:image` in `BaseLayout` | Every on-demand page advertised a 6.3MB link-preview image. **Shipped to production.** Scrapers cap what they will fetch - X at about 5MB - so sharing an announcement produced a card with no image. |

The second one is the instructive one. The same tag on a *prerendered* page
resolved to a correct 207KB build-time asset, so it was right on most of the
site and wrong on exactly the four pages people are most likely to share. Both
were found by fetching the URL and reading `Content-Length`, never by looking at
a page - the page is identical either way.

A file that is already the right size cannot have that problem: a plain ESM
import is emitted to `_astro/` untouched and works the same whether the page was
built an hour ago or rendered a second ago.

To regenerate them after replacing the source photo - sharp comes with Astro, so
there is nothing to install:

```
node -e "import('sharp').then(m => m.default('src/assets/photos/campus-front-walk.jpg').resize(1200).webp({quality:45}).toFile('src/assets/photos/campus-front-walk-band.webp'))"
```

```
node -e "import('sharp').then(m => m.default('src/assets/photos/campus-front-walk.jpg').resize(1200,630,{fit:'cover'}).jpeg({quality:72}).toFile('src/assets/photos/campus-front-walk-social.jpg'))"
```

The social card is JPEG rather than WebP because some scrapers still will not
render WebP, and 1200x630 because Facebook, Slack, LinkedIn and X all crop
`og:image` to roughly 1.91:1 - a different shape just gets cropped by them
instead of by us.

`npm run check:images` fails if either derived file is missing, the wrong size,
or larger than it should be, so a bad regeneration cannot pass quietly. **If you
add another pre-sized photo, add it to that list too** - the backdrop was guarded and the
social card was not, which is the only reason one of them reached production.

## The top-band scrim

Both themes put text over `campus-front-walk.jpg` in a full-bleed band. The
scrim alpha (`--pta-topband-alpha`) is **not** a taste setting: the photo
contains true black, so the value is the point at which body text over the
darkest possible pixel still clears WCAG AA. `npm run check:contrast` composites
the scrim over black and fails the build if it does not.

Civic scrims with white at 0.80, Print Shop with newsprint at 0.83 - the
newsprint starts darker than white, so it needs more of itself to reach the same
effective luminance. Lowering either to make the photo read more strongly is the
change that breaks AA, and it breaks it only on the crops where a shadow happens
to land under a paragraph.
