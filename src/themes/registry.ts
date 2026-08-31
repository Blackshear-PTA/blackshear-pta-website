/**
 * Blackshear PTA - theme registry (PROJECT-BRIEF §5.4).
 *
 * A theme is a token set AND a structure. Pairing them here is deliberate: it
 * makes a token-only recolor impossible to ship by accident, which is the
 * failure mode §5.1 warns about - six palettes on one layout still reads as
 * one generic template.
 *
 * NARROWED 2026-08-31: the board cut the original six to these two after a
 * first look. The four that lost are gone from git history's tip but remain in
 * the history if a direction needs revisiting.
 *
 * ADDING A THEME - three steps, in this order:
 *   1. src/themes/<id>.css - define every --pta-* token under [data-theme="<id>"]
 *   2. src/themes/themes.css - add the @import so the CSS actually ships
 *   3. this file - add the entry below
 * Miss step 2 and the theme silently falls back to the :root defaults.
 *
 * Then run `npm run check:contrast`. AA is a hard gate, not a preference.
 *
 * WHEN A WINNER IS PICKED: set defaultThemeId below to the winner, then delete
 * the losing CSS file, their imports in themes.css, their entries here,
 * any structure left with no themes, src/pages/preview.astro, and
 * public/_redirects (which sends / to /preview for the duration of the vote).
 */

/** Structural arrangements - the ARRANGEMENT, not the skin. */
export const structureIds = ['stacked-rules', 'editorial'] as const;
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
  /**
   * Render the homepage video, if the content has one. A theme-level flag
   * rather than a content-level one: the video exists in home.yaml either way,
   * and this decides whether this particular design shows it. Only structures
   * that accept a `video` prop honour it.
   */
  video?: boolean;
}

export const themes: readonly Theme[] = [
  {
    id: 'civic-letterpress-a',
    name: 'Civic Letterpress A',
    description:
      'WPA and municipal print. Slab display, heavy rules, two inks, no radius or shadow anywhere.',
    structure: 'stacked-rules',
  },
  {
    id: 'civic-letterpress-b',
    name: 'Civic Letterpress B',
    description:
      'Civic Letterpress with a blue masthead, and the school video sitting between the quote and the intro line. Everything else is identical to A.',
    structure: 'stacked-rules',
    video: true,
  },
  {
    id: 'print-shop',
    name: 'East Austin Print Shop',
    description:
      'Screenprint and wood type on newsprint. Flat overprinted colour.',
    structure: 'editorial',
  },
];

export const defaultThemeId = 'civic-letterpress-a';

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
