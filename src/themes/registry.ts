/**
 * Blackshear PTA - theme registry (PROJECT-BRIEF §5.4).
 *
 * A theme is a token set AND a structure. Pairing them here is deliberate: it
 * makes a token-only recolor impossible to ship by accident, which is the
 * failure mode §5.1 warns about - six palettes on one layout still reads as
 * one generic template. Six themes across four structures.
 *
 * ADDING A THEME - three steps, in this order:
 *   1. src/themes/<id>.css - define every --pta-* token under [data-theme="<id>"]
 *   2. src/themes/themes.css - add the @import so the CSS actually ships
 *   3. this file - add the entry below
 * Miss step 2 and the theme silently falls back to the :root defaults.
 *
 * Then run `npm run check:contrast`. AA is a hard gate, not a preference.
 *
 * WHEN A WINNER IS PICKED: delete the five losing CSS files, their imports,
 * their entries here, any structure left with no themes, and src/pages/preview.astro.
 */

/** Structural arrangements - the ARRANGEMENT, not the skin. */
export const structureIds = ['stacked-rules', 'editorial', 'blocks', 'utility'] as const;
export type StructureId = (typeof structureIds)[number];

export interface Theme {
  /** Kebab-case. Must match the [data-theme="..."] selector and the CSS filename. */
  id: string;
  /** Shown in the theme switcher on /preview. */
  name: string;
  /** One line on the design tradition this is anchored to. Shown in the switcher. */
  description: string;
  /** Which layout arrangement this theme renders through. */
  structure: StructureId;
}

export const themes: readonly Theme[] = [
  {
    id: 'civic-letterpress',
    name: 'Civic Letterpress',
    description:
      'WPA and municipal print. Slab display, heavy rules, two inks, no radius or shadow anywhere.',
    structure: 'stacked-rules',
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    description:
      'A well-made local-nonprofit annual report. Warm paper, serif throughout, asymmetric grid.',
    structure: 'editorial',
  },
  {
    id: 'schoolyard-bold',
    name: 'Schoolyard Bold',
    description:
      'A modern summer-camp brand. Saturated blocks, thick keylines, hard shadows. Energetic.',
    structure: 'blocks',
  },
  {
    id: 'print-shop',
    name: 'East Austin Print Shop',
    description:
      'Screenprint and wood type on newsprint. Flat overprinted colour.',
    structure: 'editorial',
  },
  {
    id: 'quiet-utility',
    name: 'Quiet Utility',
    description:
      'The anti-decoration option. Links first, above the hero. Built to find one thing fast on a phone.',
    structure: 'utility',
  },
  {
    id: 'jacket',
    name: 'Jacket',
    description:
      'The branding and color design as the main focus. Black and gold banding, the only dark theme in the set.',
    structure: 'blocks',
  },
];

export const defaultThemeId = 'civic-letterpress';

/** Throws rather than returning undefined - a bad theme id is a build-time bug. */
export function getTheme(id: string): Theme {
  const theme = themes.find((t) => t.id === id);
  if (!theme) {
    throw new Error(
      `Unknown theme id "${id}". Known ids: ${themes.map((t) => t.id).join(', ')}`,
    );
  }
  return theme;
}
