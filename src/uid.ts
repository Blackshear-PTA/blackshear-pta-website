/**
 * Build-scoped unique ids for elements that aria-labelledby points at.
 *
 * /preview renders every design onto one page, so any component with a
 * hardcoded id ships as many copies of it as there are designs. That is
 * invalid HTML, and it gives assistive tech an ambiguous target: the label for
 * one design's "What's happening" may resolve to another's.
 *
 * A counter rather than a random id, so the same source produces the same HTML
 * and the built output stays diffable. Ids are stable for a given render
 * order, which is all aria-labelledby needs - nothing links to them.
 */
const counters = new Map<string, number>();

export function uid(prefix: string): string {
  const next = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, next);
  return `${prefix}-${next}`;
}
