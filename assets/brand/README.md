# Brand assets

Provided by Jon 2026-08-28. These are **Blackshear Fine Arts Academy** (school)
marks, not PTA-specific marks; see "Open question" below.

| File | What it is | Verdict |
|---|---|---|
| `crest-1color.jpg` | Circular crest: varsity block **B**, two flanking yellow jackets, "BLACKSHEAR FINE ARTS ACADEMY", "Est. 1891". Pure black on white, 2000×2000. | **The strongest asset.** Single-color, high contrast, scales to a favicon, screenprint-ready. Anchors Civic Letterpress and East Austin Print Shop, the two surviving designs. Worth tracing to SVG. |
| `buzz-mascot.jpg` | "Buzz" standing, hands on hips, sneakers. Clean line art, black on white, 2000×2000. | Great. Traces to SVG cleanly. The mascot without the lockup - usable as a standalone accent. |
| `logo-square-blue.jpg` | Blue/white split square, color Buzz with a megaphone, wordmark, "Growing Stronger Together". 1080×1080. | Social-media lockup. Source of the blue. Raster only, awkward aspect for web. |
| `logo-original-vector.pdf` | Full original crest - color Buzz with an artist's palette on an open book, color wheel, motto ring, blue banner. **Vector, 810×810.** | The only vector file we have. Contains a raster mascot XObject, so it's partially vector. Fonts: **Hussar Bold** and **Sriracha** (both open-source). Sriracha was used by the Jacket theme, which was cut on 2026-08-31; the observation is kept because it is the only record of what the original logo is set in. |

## Palette

Sampled from the logos, not invented.

| Token | Hex | Notes |
|---|---|---|
| `--blue` | `#0048A8` | Strong cobalt. Dominant color in both lockups. |
| `--yellow` | `#F0E430` | Bright **lemon**, not amber or gold. Corrects an earlier assumption in `PROJECT-BRIEF.md` §5.2. |
| `--black` | `#000000` | Outlines, crest, mascot banding. |
| `--white` | `#FFFFFF` | |

Secondary colors appear in the original crest's color wheel (red, green, magenta,
cyan) and in the Field Day flyer (grass green). Treat those as an accent set for
event material, not core brand.

### Contrast (WCAG 2.1)

| Pairing | Ratio | AA body | AA large |
|---|---|---|---|
| Blue on white | 8.43 | ✅ | ✅ |
| White on blue | 8.43 | ✅ | ✅ |
| Blue on yellow | 6.36 | ✅ | ✅ |
| Black on yellow | 15.85 | ✅ | ✅ |
| Black on white | 21.00 | ✅ | ✅ |
| **Yellow on white** | **1.33** | ❌ | ❌ |

The palette is accessible in every combination except yellow-on-white. **Yellow is
an accent and background color, never text on white.** Yellow text requires a
black or blue ground.

## Copy worth reusing

- Motto: **"Together we EDUCATE, ENRICH, and EXERCISE to EXCEL"**
- Tagline: **"Growing Stronger Together"**
- Jersey reads **"YELLOW JACKETS"**; the mascot is named **Buzz**
- **Est. 1891**: confirms the 135th anniversary the current site celebrates

## Open question

Every one of these is a *school* mark. The PTA is a legally separate organization,
and a PTA site fronted entirely by school branding can blur that line - it matters
for donations, tax receipts, and the fact that the PTA speaks for itself (the
"Let's Keep Blackshear where it is!" advocacy on the current site is a PTA voice,
not an AISD one).

Worth confirming with the board and possibly the principal whether the PTA should
use these marks directly or carry a distinct PTA lockup that references them.
Tracked as A11 in `TASKS.md`.
