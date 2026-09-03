import { getCollection, type CollectionEntry } from 'astro:content';
import { GRADE_LABELS, type GradeSlug } from '../content.config';

export type Announcement = CollectionEntry<'announcements'>;

/**
 * Published announcements, newest first, pinned ones above everything.
 *
 * One function rather than the same `filter().sort()` copied into the
 * homepage, the index, the post pages and the RSS feed. Four copies of an
 * ordering rule is four chances for a draft to leak into one of them - and the
 * feed is the copy where that mistake is permanent, because subscribers have
 * already pulled it by the time anyone notices.
 */
export async function getAnnouncements(limit?: number): Promise<Announcement[]> {
  const posts = await getCollection('announcements', ({ data }) => !data.draft);

  posts.sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return b.data.date.getTime() - a.data.date.getTime();
  });

  return typeof limit === 'number' ? posts.slice(0, limit) : posts;
}

/**
 * Fixed locale and time zone, so the machine running the build cannot shift a
 * date across a day boundary. Dates come out of frontmatter as UTC midnight;
 * formatting them in local time would render the previous day for anyone west
 * of Greenwich, which is everyone here.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

/** Where a post lives. Derived once so nothing hand-builds this path. */
export function postPath(post: Announcement): string {
  return `/announcements/${post.id}/`;
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
 * something absent - the schema already refuses that at build time, and a list
 * page is the wrong place to discover it.
 */
export function coverImage(post: Announcement): { key: string; alt: string } | null {
  const { images, cover } = post.data;
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
 * page renders the real thing.
 */
export function excerpt(post: Announcement, maxChars = 240): string {
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
