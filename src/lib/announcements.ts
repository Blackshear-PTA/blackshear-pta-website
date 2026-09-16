import { env } from 'cloudflare:workers';
import { listPublished, getPublished } from './posts.mjs';
import type { Post, PostImage } from './posts.mjs';
import { GRADE_LABELS, type GradeSlug } from './grades';

export type { Post, PostImage };

/**
 * Announcements, as the public site sees them.
 *
 * Posts used to be a content collection - one markdown file per post, read at
 * build time by getCollection(). They are rows in D1 now and these four routes
 * render on demand:
 *
 *   src/pages/index.astro                 the homepage block
 *   src/pages/announcements/index.astro   the list
 *   src/pages/announcements/[slug].astro  the post
 *   src/pages/rss.xml.ts                  the feed
 *
 * Still one module rather than the same query copied into four callers, and
 * still for the reason it was one before: four copies of the draft filter is
 * four chances for a draft to leak into one of them, and the feed is the copy
 * where that mistake is permanent - subscribers have already pulled it by the
 * time anyone notices. The filter now lives one level further down again, in
 * the SQL in posts.mjs, where listPublished() cannot be asked to include them.
 */

/**
 * The D1 binding.
 *
 * From `cloudflare:workers` rather than from Astro.locals. Astro used to expose
 * bindings as `Astro.locals.runtime.env`; that was removed in Astro v6 and the
 * adapter now throws a message saying so if anything reaches for it. Reading
 * the module-scoped `env` is the supported way, and it has the nice property of
 * working identically in a route, in a component and in a plain .ts module -
 * there is no request object to thread through.
 *
 * Throws when the binding is absent rather than returning null. A missing
 * binding is a deployment fault, not a content state: an announcements list
 * that silently rendered empty would look exactly like a PTA that has not
 * posted anything, which is the wrong thing to tell a parent and the wrong
 * thing to tell whoever has to debug it. Resource bindings fail hard here for
 * the same reason F29 found they fail hard at deploy.
 */
export function announcementsDb(): D1Database {
  const db = env.DB;
  if (!db) {
    throw new Error(
      'No D1 binding named DB. Locally, run `npx wrangler d1 migrations apply ' +
        'blackshear-pta --local` and start the Worker; in production, check the ' +
        'd1_databases block in wrangler.jsonc.',
    );
  }
  return db;
}

/**
 * Published announcements, pinned first then newest, with the total.
 *
 * The total is the count of everything published, not of what came back, so the
 * homepage can say "see all 12" while showing four. It costs nothing extra:
 * both arrive on one query.
 */
export async function getAnnouncements(limit?: number): Promise<{ posts: Post[]; total: number }> {
  return listPublished(announcementsDb(), limit);
}

/** One published announcement, or null. A draft is null - it has no page. */
export async function getAnnouncement(slug: string): Promise<Post | null> {
  return getPublished(announcementsDb(), slug);
}

/**
 * A stored YYYY-MM-DD as a Date at UTC midnight.
 *
 * A publication date is a square on a calendar, not an instant. Anchoring it to
 * a timezone is what moved all-day calendar events a day in F26, and the same
 * trap is here: parsing "2026-09-07" with `new Date(...)` and no zone gives
 * local midnight, which is the 6th in UTC.
 */
export function postDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * Fixed locale and time zone, so the machine rendering the page cannot shift a
 * date across a day boundary. Formatting UTC midnight in America/Chicago turns
 * it into 7pm the previous evening, and the post reads as a day early.
 */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
    postDate(date),
  );
}

/**
 * Where a post lives. Derived once so nothing hand-builds this path.
 *
 * The slug is a stored column, not something regenerated from the title, so
 * these URLs are the same strings the markdown filenames produced and anything
 * already linking to a post still resolves.
 */
export function postPath(post: Post): string {
  return `/announcements/${post.slug}/`;
}

/** Serving URL for an R2 object key. */
export function imageUrl(key: string): string {
  return `/images/${key}`;
}

/**
 * The image that represents a post in a list.
 *
 * Falls back to the first image when `cover` is unset, so a post with one photo
 * never has to nominate it. Returns null rather than throwing if `cover` names
 * something absent - the database refuses that combination outright, and a list
 * page is the wrong place to discover it anyway.
 */
export function coverImage(post: Post): PostImage | null {
  const { images, cover } = post;
  if (images.length === 0) return null;
  return images.find((image) => image.key === cover) ?? images[0] ?? null;
}

/** Display labels for a post's grades. Empty means the whole school. */
export function gradeLabels(grades: readonly string[]): string[] {
  return grades.map((slug) => GRADE_LABELS[slug as GradeSlug] ?? slug);
}

/**
 * First paragraph, for a listing. The body is markdown, so this strips the
 * handful of inline markers that would otherwise show up as literal asterisks
 * in a summary. Not a markdown parser and not trying to be - the post's own
 * page renders the real thing through src/lib/markdown.mjs.
 */
export function excerpt(post: Post, maxChars = 240): string {
  const first = (post.body ?? '').trim().split(/\n\s*\n/)[0] ?? '';
  const plain = first
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxChars) return plain;
  const cut = plain.slice(0, maxChars);
  return `${cut.slice(0, cut.lastIndexOf(' ')) || cut}…`;
}
