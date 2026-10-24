/**
 * Types for instagram-list.mjs. Plain .mjs so scripts/check-d1.mjs can run it
 * against real SQLite; this gives the TypeScript callers real types. Same
 * arrangement as posts.d.mts.
 */

export declare const HISTORY_SLUG: 'instagram';

export interface InstagramList {
  /** Post addresses, in the order the gallery shows them. */
  urls: string[];
  /** The version a save must name, or null before the first save. */
  updatedAt: string | null;
  /** True when migration 0004 has not been applied yet. */
  missing: boolean;
}

export declare function getInstagramList(db: D1Database): Promise<InstagramList>;

export declare function saveInstagramList(
  db: D1Database,
  options: { urls: string[]; editor: string; expectedUpdatedAt?: string; at?: string },
): Promise<{ urls: string[]; updatedAt: string } | 'conflict'>;
