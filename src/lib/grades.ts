/**
 * Grades a post can be aimed at. Empty or absent means the whole school, which
 * is the common case - so the default costs nobody a decision.
 *
 * Stored as slugs and rendered through GRADE_LABELS, because "1" sorts and
 * compares sanely while "1st Grade" does not, and because a later notification
 * feature will want to match on a stable value rather than display text.
 *
 * WHY THIS IS ITS OWN FILE. These three exports lived in src/content.config.ts,
 * which is a build-time module: it imports Astro's `glob` loader, which pulls
 * in tinyglobby, which pulls in fdir and picomatch, which call
 * `createRequire(import.meta.url)` and walk a filesystem. Importing one
 * constant from there dragged all of it into the Worker bundle, where
 * `createRequire` fails at module scope - so every on-demand announcement route
 * answered 500 with `The argument 'path' ... Received 'undefined'` and a stack
 * pointing at picomatch.
 *
 * The rule worth keeping: anything a request-time route imports must not reach
 * a build-time module, however small the thing being imported looks. A named
 * import is not a promise that the rest of the file stays behind.
 */
export const gradeSlugs = ['pre-k-3', 'pre-k-4', 'kinder', '1', '2', '3', '4', '5'] as const;
export type GradeSlug = (typeof gradeSlugs)[number];

export const GRADE_LABELS: Record<GradeSlug, string> = {
  'pre-k-3': 'Pre-K 3',
  'pre-k-4': 'Pre-K 4',
  kinder: 'Kinder',
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '4': '4th',
  '5': '5th',
};
