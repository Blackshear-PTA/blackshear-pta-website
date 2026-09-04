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
| `campus-front-walk.jpg` | Top-band backdrop, **both** themes | Front walkway and entrance. Landscape and center-weighted, which is why it survives the narrow crop a phone gives a full-bleed band. Sits under a scrim; see below. |
| `campus-side-entrance.jpg` | unused | Was Civic's backdrop. Portrait, so on a phone `cover` scaled it to height and the visible strip was mostly sky. Replaced by `campus-front-walk.jpg` on both themes. |
| `little-east-alt.jpg` | unused | Second Little EAST option. |
| `garden-alt.jpg` | unused | Second garden option. |

Committee thumbnails pass a square `width`/`height` against non-square sources.
Astro center-crops rather than squashing when you do that, which is what a
thumbnail grid wants.

Files are named for what they show rather than where they are used, so moving
one between slots does not leave a misleading name behind.

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
