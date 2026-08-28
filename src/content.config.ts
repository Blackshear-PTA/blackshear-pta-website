import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';

/**
 * Blackshear PTA — content schema.
 *
 * PROJECT-BRIEF §5.4: "Content lives in exactly one place." All homepage copy
 * lives in src/content/home.yaml. Themes are consumers — none of them owns a
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
 * `note` is for the small qualifier under a link — "opens in Square", "PDF".
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
});

const contact = z.object({
  email: z.email(),
  phone: z.string(),
  address: z.string(),
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

export const collections = { home };
