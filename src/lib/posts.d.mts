/**
 * Types for posts.mjs.
 *
 * The implementation is plain .mjs so scripts/check-d1.mjs can import and
 * exercise it directly against a real SQLite database with no build step. This
 * gives the TypeScript callers - the Astro routes and the /admin API - real
 * types rather than the `{}` that JSDoc alone infers, which silently swallows
 * every property access. Same arrangement as frontmatter.d.mts.
 */

export interface PostImage {
  key: string;
  alt: string;
}

/** A post as every consumer sees it. Nulls, not undefineds: these are columns. */
export interface Post {
  /** The URL segment. `/announcements/<slug>/`. */
  slug: string;
  title: string;
  /** YYYY-MM-DD. */
  date: string;
  href: string | null;
  linkLabel: string | null;
  images: PostImage[];
  cover: string | null;
  grades: string[];
  pinned: boolean;
  draft: boolean;
  /** Markdown. Rendered at request time; see src/lib/markdown.mjs. */
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Edit {
  id: number;
  at: string;
  editor: string;
  action: 'create' | 'update' | 'delete' | 'pin' | 'unpin' | 'import' | string;
  slug: string;
  title: string;
  /** JSON text: which fields changed, or the whole post on a delete. */
  detail: string;
}

/** The subset of a post a caller may write. Absent keys are left alone. */
export interface PostFields {
  slug?: string;
  title?: string;
  date?: string;
  href?: string | null;
  linkLabel?: string | null;
  images?: PostImage[];
  cover?: string | null;
  grades?: string[];
  pinned?: boolean;
  draft?: boolean;
  body?: string;
}

/** What a write reports back. */
export type WriteResult = 'ok' | 'missing' | 'conflict';

/**
 * The database these take.
 *
 * Typed as D1Database rather than as a hand-written structural interface,
 * because that is what every caller in the site actually passes and a looser
 * type would only be looser. scripts/check-d1.mjs passes a node:sqlite shim of
 * the same shape instead - it is .mjs, so it is not type-checked against this,
 * which is the honest arrangement: the shim is thirty lines of shape adaptation
 * and the gate's job is to prove the SQL, not the typing.
 */
export type PostsDb = D1Database;

export function nowStamp(date?: Date): string;
export function slugFor(date: string, title: string): string;
export function toPost(row: Record<string, unknown>): Post;

export function listPublished(db: PostsDb, limit?: number): Promise<{ posts: Post[]; total: number }>;
export function getPublished(db: PostsDb, slug: string): Promise<Post | null>;
export function listAll(db: PostsDb): Promise<Post[]>;
export function getAny(db: PostsDb, slug: string): Promise<Post | null>;
export function listEdits(db: PostsDb, limit?: number): Promise<Edit[]>;

export function createPost(
  db: PostsDb,
  options: { fields: PostFields; editor: string; at?: string },
): Promise<string>;

export function updatePost(
  db: PostsDb,
  slug: string,
  options: { fields: PostFields; editor: string; expectedUpdatedAt?: string; at?: string },
): Promise<WriteResult>;

export function setPinned(
  db: PostsDb,
  slug: string,
  pinned: boolean,
  options?: { editor: string; at?: string },
): Promise<WriteResult>;

export function deletePost(
  db: PostsDb,
  slug: string,
  options: { editor: string; at?: string },
): Promise<WriteResult>;
