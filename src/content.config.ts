import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';

/**
 * Blackshear PTA - content schema.
 *
 * PROJECT-BRIEF §5.4: "Content lives in exactly one place." All homepage copy
 * lives in src/content/home.yaml. Themes are consumers - none of them owns a
 * word of copy, so there is no drift between the six variants.
 *
 * The YAML file is a mapping whose top-level keys become entry IDs, so the
 * single homepage entry is read with `getEntry('home', 'home')`.
 */

const link = z.object({
  label: z.string(),
  href: z.string(),
});

/** Big statement at the top of the page. Two fields, deliberately. */
const hero = z.object({
  headline: z.string(),
  subhead: z.string(),
});

/**
 * The "I came here to do one thing" row. Findability outranks visual ambition
 * (PROJECT-BRIEF §2), so this is the most important block on the page.
 * `note` is for the small qualifier under a link - "opens in Square", "PDF".
 */
const quickAction = link.extend({
  note: z.string().optional(),
});

/** Announcements. `href` optional so a note with no destination still renders. */
const newsItem = z.object({
  title: z.string(),
  body: z.string(),
  href: z.string().optional(),
  date: z.coerce.date().optional(),
});

/**
 * Volunteer tiers, sorted by how much time they ask for. Leading with the
 * commitment rather than the job title is the whole point of the block.
 */
const involvementTier = z.object({
  commitment: z.string(),
  description: z.string(),
  cta: link,
});

const committee = z.object({
  name: z.string(),
  description: z.string(),
  /**
   * Which tile art to show. A slug rather than a path: the mapping to an
   * imported image lives in Committees.astro so Astro's build-time image
   * pipeline can see the import. A path string here would ship the 4MB
   * original untouched. Omit and the committee renders without art.
   */
  art: z.enum(['little-east', 'garden', 'staff-appreciation', 'fundraising']).optional(),
});

const contact = z.object({
  email: z.email(),
  phone: z.string(),
  address: z.string(),
});

/**
 * Site-wide chrome - PROJECT-BRIEF §2 ("easy to use, easy to find things").
 *
 * Navigation is not homepage content, so it does not live in home.yaml. Themes
 * differ in how they RENDER the header; none of them owns what is in it.
 */
const navItem = link.extend({
  /** Renders an out-arrow and sets rel/target. Flip to false as real pages land. */
  external: z.boolean().default(false),
});

const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: z.object({
    identity: z.object({
      name: z.string(),
      location: z.string(),
      fullName: z.string(),
    }),
    nav: z.array(navItem).min(1),
    primaryAction: link,
  }),
});

const home = defineCollection({
  loader: file('src/content/home.yaml'),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    hero,
    quickActions: z.object({
      heading: z.string(),
      items: z.array(quickAction),
    }),
    news: z.object({
      heading: z.string(),
      items: z.array(newsItem),
    }),
    getInvolved: z.object({
      heading: z.string(),
      intro: z.string().optional(),
      tiers: z.array(involvementTier),
    }),
    committees: z.object({
      heading: z.string(),
      intro: z.string().optional(),
      items: z.array(committee),
    }),
    footer: z.object({
      orgName: z.string(),
      contact,
    }),
  }),
});

export const collections = { home, site };
