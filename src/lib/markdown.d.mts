/**
 * Types for markdown.mjs. Plain .mjs so scripts/check-d1.mjs can exercise the
 * real renderer - the escaping rule in particular - without a build step.
 */
export function renderMarkdown(text: string): string;
