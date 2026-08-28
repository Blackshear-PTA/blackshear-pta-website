/**
 * Blackshear PTA — theme registry (PROJECT-BRIEF §5.4).
 *
 * A theme is a token set AND a structure. Pairing them here is deliberate: it
 * makes a token-only recolor impossible to ship by accident, which is the
 * failure mode §5.1 warns about — six palettes on one layout still reads as
 * one generic template.
 *
 * SCAFFOLD STATE: one placeholder theme and one placeholder structure, enough
 * to prove the wiring builds. The six real directions (Civic Letterpress, Warm
 * Editorial, Schoolyard Bold, East Austin Print Shop, Quiet Utility, Jacket)
 * are listed in PROJECT-BRIEF §5.3 and are a separate task.
 *
 * ADDING A THEME — three steps, in this order:
 *   1. src/themes/<id>.css      — define every --pta-* token under [data-theme="<id>"]
 *   2. src/themes/themes.css    — add the @import so the CSS actually ships
 *   3. this file                — add the entry below
 * Miss step 2 and the theme silently falls back to the :root defaults.
 */

/** Structural arrangements. §5.4 calls for 3–4 genuinely different ones. */
export const structureIds = ['stacked-rules'] as const;
export type StructureId = (typeof structureIds)[number];

export interface Theme {
  /** Kebab-case. Must match the [data-theme="..."] selector and the CSS filename. */
  id: string;
  /** Shown in the theme switcher on /preview. */
  name: string;
  /** One line on the design tradition this is anchored to. */
  description: string;
  /** Which layout arrangement this theme renders through. */
  structure: StructureId;
}

export const themes: readonly Theme[] = [
  {
    id: 'civic-letterpress',
    name: 'Civic Letterpress',
    description:
      'WPA and municipal print. Condensed display, thick rules, flat two-ink, zero shadows or rounded corners.',
    structure: 'stacked-rules',
  },
];

export const defaultThemeId = 'civic-letterpress';

/** Throws rather than returning undefined — a bad theme id is a build-time bug. */
export function getTheme(id: string): Theme {
  const theme = themes.find((t) => t.id === id);
  if (!theme) {
    throw new Error(
      `Unknown theme id "${id}". Known ids: ${themes.map((t) => t.id).join(', ')}`,
    );
  }
  return theme;
}
