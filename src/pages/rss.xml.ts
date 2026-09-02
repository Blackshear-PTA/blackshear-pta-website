import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAnnouncements } from '../lib/announcements';

/**
 * The announcements feed.
 *
 * @astrojs/rss rather than a hand-built template, for XML escaping. An
 * apostrophe or an ampersand in a post title is not hypothetical here - "Let's
 * keep Blackshear where it is" is already in the content - and a feed that
 * fails to parse fails silently in someone's reader, days later, with nobody
 * to tell.
 *
 * Uses the same getAnnouncements() as the homepage and /news, so a draft cannot
 * be published here by accident. That matters more in the feed than anywhere
 * else on the site: a reader has already pulled the item by the time the
 * mistake is noticed, and unpublishing does not recall it.
 */
export async function GET(context: APIContext) {
  const posts = await getAnnouncements();

  return rss({
    title: 'Blackshear Elementary PTA',
    description: 'Announcements from the Blackshear Elementary PTA in East Austin.',
    // Astro throws here if `site` is unset in astro.config.mjs, which is the
    // right failure: a feed full of relative links is useless in a reader.
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.body ?? '',
      // Point at the post's own destination when it has one, otherwise at
      // /news. Never at a bare "#" - some readers treat that as the site root
      // and quietly dedupe every item into one.
      link: post.data.href ?? new URL('/news', context.site).href,
    })),
    customData: '<language>en-us</language>',
  });
}
