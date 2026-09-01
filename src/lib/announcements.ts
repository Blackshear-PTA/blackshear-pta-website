import { getCollection, type CollectionEntry } from 'astro:content';

export type Announcement = CollectionEntry<'announcements'>;

/**
 * Published announcements, newest first, pinned ones above everything.
 *
 * One function rather than the same `filter().sort()` copied into the
 * homepage, /news and the RSS feed. Three copies of an ordering rule is three
 * chances for a draft to leak into one of them - and the feed is the copy
 * where that mistake is permanent, because subscribers have already pulled it
 * by the time anyone notices.
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
