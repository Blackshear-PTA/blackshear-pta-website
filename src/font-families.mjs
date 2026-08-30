/**
 * The single list of typefaces, imported by BOTH astro.config.mjs (which
 * downloads and subsets them) and BaseLayout.astro (which renders an
 * <Font> per family to inject the @font-face rules and define the CSS
 * variable). Declaring them in one place is not tidiness — miss the layout
 * side and --font-* is undefined, the whole var() chain goes invalid, and
 * every theme silently falls back to the browser default. That is a hard bug
 * to see, because the page still looks fine.
 *
 * .mjs, not .ts, because astro.config.mjs cannot import TypeScript.
 *
 * PROJECT-BRIEF §5.1 — the typeface is most of what separates six themes from
 * six recolors, so each theme gets its own pairing.
 */
export const fontFamilies = [
  // Civic Letterpress — slab display, workhorse grotesque underneath.
  { name: 'Bevan', cssVariable: '--font-bevan', weights: [400] },
  { name: 'Archivo', cssVariable: '--font-archivo', weights: [400, 600, 900] },

  // Warm Editorial — characterful variable serif over a reading serif.
  { name: 'Fraunces', cssVariable: '--font-fraunces', weights: [400, 700] },
  { name: 'Newsreader', cssVariable: '--font-newsreader', weights: [400, 600] },

  // Schoolyard Bold — wide and a little odd, over something round and friendly.
  { name: 'Bricolage Grotesque', cssVariable: '--font-bricolage', weights: [700, 800] },
  { name: 'Figtree', cssVariable: '--font-figtree', weights: [400, 600] },

  // East Austin Print Shop — wood-type poster slab over a quirky grotesque.
  { name: 'Alfa Slab One', cssVariable: '--font-alfa', weights: [400] },
  { name: 'Karla', cssVariable: '--font-karla', weights: [400, 700] },

  // Quiet Utility — one family, no decoration. Public Sans is the US Web
  // Design System face, which is exactly the register this theme wants.
  { name: 'Public Sans', cssVariable: '--font-public', weights: [400, 600, 700] },

  // Jacket — script accent lifted from the original logo, which is set in
  // Sriracha (see assets/brand/README.md). Reproduces it rather than guessing.
  { name: 'Sriracha', cssVariable: '--font-sriracha', weights: [400] },
];
