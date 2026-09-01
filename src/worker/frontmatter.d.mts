/**
 * Types for frontmatter.mjs.
 *
 * The implementation is plain .mjs so scripts/check-frontmatter.mjs can import
 * and exercise it directly under node with no build step. This gives the
 * TypeScript callers in the Worker real types instead of `{}`, which is what
 * they inferred from the JSDoc alone - and `{}` silently swallowed every
 * property access.
 */
export interface PostMeta {
  title: string;
  date: string;
  href?: string;
  linkLabel?: string;
  pinned?: boolean;
  draft?: boolean;
}

export function yamlString(value: string): string;
export function stringifyPost(meta: PostMeta, body: string): string;
export function parsePost(text: string): { meta: PostMeta; body: string } | null;
export function filenameFor(date: string, title: string): string;
