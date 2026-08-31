/**
 * The single list of typefaces, imported by BOTH astro.config.mjs (which
 * downloads and subsets them) and BaseLayout.astro (which renders an
 * <Font> per family to inject the @font-face rules and define the CSS
 * variable). Declaring them in one place is not tidiness - miss the layout
 * side and --font-* is undefined, the whole var() chain goes invalid, and
 * every theme silently falls back to the browser default. That is a hard bug
 * to see, because the page still looks fine.
 *
 * .mjs, not .ts, because astro.config.mjs cannot import TypeScript.
 *
 * PROJECT-BRIEF §5.1 - the typeface is most of what separates one theme from
 * another, so each gets its own pairing.
 *
 * Trimmed from ten families to four when the board narrowed the six designs to
 * two. Fraunces, Newsreader, Bricolage Grotesque, Figtree, Public Sans and
 * Sriracha went with the themes that used them.
 */
export const fontFamilies = [
  // Civic Letterpress - slab display, workhorse grotesque underneath.
  { name: 'Bevan', cssVariable: '--font-bevan', weights: [400] },
  { name: 'Archivo', cssVariable: '--font-archivo', weights: [400, 600, 900] },

  // East Austin Print Shop - wood-type poster slab over a quirky grotesque.
  { name: 'Alfa Slab One', cssVariable: '--font-alfa', weights: [400] },
  { name: 'Karla', cssVariable: '--font-karla', weights: [400, 700] },

  // Jacket - script accent lifted from the original logo, which is set in
  // Sriracha (see assets/brand/README.md). Reproduces it rather than guessing.
];
