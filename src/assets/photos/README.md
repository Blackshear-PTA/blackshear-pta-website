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
| `blackshear-front.jpg` | Staff Appreciation committee | The E 11th St frontage. Same shot as `assets/from-weebly/top-image.jpeg` but larger. |
| `header-blackshear.jpg` | Decorative masthead strip | Flagpole, building and the "Best School" banner. Shown only in themes whose nav wraps below the wordmark and therefore have an empty top-right corner: Civic Letterpress, East Austin Print Shop, Jacket. Controlled by `--pta-header-art`. |
| `bake-sale.jpg` | Fundraising committee | A monthly snack sale table. No faces. Replaced a drawn icon, which never sat right next to three photographs. |
| `little-east-alt.jpg` | unused | Second Little EAST option. |
| `garden-alt.jpg` | unused | Second garden option. |

Committee thumbnails pass a square `width`/`height` against non-square sources.
Astro centre-crops rather than squashing when you do that, which is what a
thumbnail grid wants.
