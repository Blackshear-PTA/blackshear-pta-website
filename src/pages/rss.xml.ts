import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAnnouncements, postPath, excerpt } from '../lib/announcements';

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
      description: excerpt(post, 400),
      // Every post now has a page of its own, so the feed points there rather
      // than at whatever third-party link the post happens to carry. A reader
      // clicking through lands on the PTA's own words, and the outbound link is
      // right there on the page.
      link: new URL(postPath(post), context.site).href,
    })),
    customData: '<language>en-us</language>',
  });
}
