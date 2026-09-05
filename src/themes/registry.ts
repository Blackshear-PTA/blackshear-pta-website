/**
 * Blackshear PTA - theme registry (PROJECT-BRIEF §5.4).
 *
 * A theme is a token set AND a structure. Pairing them here is deliberate: it
 * makes a token-only recolor impossible to ship by accident, which is the
 * failure mode §5.1 warns about - six palettes on one layout still reads as
 * one generic template.
 *
 * DECIDED 2026-08-31: Civic Letterpress A is the site's design language. The
 * board cut six to two, Civic then split into A and B for a second look, and A
 * won. B and East Austin Print Shop are HELD IN RESERVE rather than deleted -
 * they still build, still pass the contrast gate, and still render at /preview,
 * so reversing the decision is a one-line change and not a rebuild.
 *
 * Two exports, deliberately kept apart:
 *   siteThemeId    - what every real page renders in. Changing it re-skins the
 *                    live site.
 *   defaultThemeId - which panel /preview opens on. Changing it affects nothing
 *                    a visitor to the site itself sees.
 * They name the same theme today. Keeping them separate means someone can point
 * the preview at B for a second opinion without silently re-skinning the
 * homepage - the kind of divergence that is very easy to ship and hard to spot.
 *
 * ADDING A THEME - three steps, in this order:
 *   1. src/themes/<id>.css - define every --pta-* token under [data-theme="<id>"]
 *   2. src/themes/themes.css - add the @import so the CSS actually ships
 *   3. this file - add the entry below
 * Miss step 2 and the theme silently falls back to the :root defaults.
 *
 * Then run `npm run check:contrast`. AA is a hard gate, not a preference.
 *
 * RETIRING THE RESERVES - when they are no longer wanted, delete their CSS
 * files, their imports in themes.css, their entries below, any structure left
 * with no themes, and src/pages/preview.astro. Nothing else imports the
 * preview page.
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
  /**
   * Kept for reference only; not the site's design. Shown as such at /preview
   * so nobody mistakes a reserve for a live option.
   */
  reserve?: boolean;
  /**
   * The --font-* variables this theme's tokens resolve to, display first.
   *
   * Used by BaseLayout to preload only the faces a page will actually paint
   * with. Every face ships @font-face rules regardless; this decides which get
   * a <link rel="preload">, and preloading a face the page never uses is just
   * wasted bytes on a phone.
   *
   * Must match the var(--font-*) references in this theme's CSS file.
   * `npm run check:fonts` fails the build if it drifts.
   */
  fonts: readonly string[];
}

export const themes: readonly Theme[] = [
  {
    id: 'civic-letterpress-a',
    name: 'Civic Letterpress A',
    description:
      'WPA and municipal print. Slab display, heavy rules, two inks, no radius or shadow anywhere.',
    structure: 'stacked-rules',
    fonts: ['--font-bevan', '--font-archivo'],
  },
  {
    id: 'civic-letterpress-b',
    name: 'Civic Letterpress B',
    description:
      'Civic Letterpress with a blue masthead, and the school video sitting between the quote and the intro line. Everything else is identical to A.',
    structure: 'stacked-rules',
    video: true,
    reserve: true,
    fonts: ['--font-bevan', '--font-archivo'],
  },
  {
    id: 'print-shop',
    name: 'East Austin Print Shop',
    description:
      'Screenprint and wood type on newsprint. Flat overprinted color.',
    structure: 'editorial',
    reserve: true,
    fonts: ['--font-alfa', '--font-karla'],
  },
];

/** The design every real page renders in. This is the live site's look. */
export const siteThemeId = 'civic-letterpress-a';

/** Which panel /preview opens on. Preview-only - see the note at the top. */
export const defaultThemeId = siteThemeId;

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
