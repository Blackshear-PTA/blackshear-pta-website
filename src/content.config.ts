import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import { POST_URL, MAX_POSTS } from './worker/instagram.mjs';

/**
 * Blackshear PTA - content schema.
 *
 * PROJECT-BRIEF §5.4: "Content lives in exactly one place." All homepage copy
 * lives in src/content/home.yaml. Themes are consumers - none of them owns a
 * word of copy, so there is no drift between the variants.
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
  /** Where the tile goes. Omit and the committee renders as plain text. */
  href: z.string().optional(),
  /**
   * Which tile art to show. A slug rather than a path: the mapping to an
   * imported image lives in Committees.astro so Astro's build-time image
   * pipeline can see the import. A path string here would ship the 4MB
   * original untouched. Omit and the committee renders without art.
   */
  art: z
    .enum(['little-east', 'campus-beautification', 'staff-appreciation', 'fundraising'])
    .optional(),
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

/**
 * Footer follow/contact links. `platform` picks the glyph, so adding a service
 * means adding an icon in Footer.astro too - the enum makes that a build error
 * rather than a silently missing icon.
 */
const socialLink = z.object({
  platform: z.enum(['instagram', 'facebook', 'email']),
  /** Accessible name. The links are icon-only, so this is the only label. */
  label: z.string(),
  href: z.string(),
});

/**
 * Standalone pages - src/content/pages.yaml, rendered by src/pages/[page].astro.
 *
 * The top-level key becomes both the entry id and the URL, so adding
 * `volunteer:` to that file publishes /volunteer with no code change. That is
 * the point: PROJECT-BRIEF §2 wants a site a non-technical volunteer can still
 * edit after board turnover, and "add a block of YAML" is a much shorter
 * instruction than "add an .astro file".
 *
 * An explicit route always beats this one, so a page that outgrows the schema
 * can graduate to src/pages/<name>.astro without changing its URL.
 */
const pageLink = link.extend({
  /** Small qualifier under the link - "PDF", "downloads a zip", "opens YouTube". */
  note: z.string().optional(),
});

const pageSection = z.object({
  heading: z.string(),
  body: z.array(z.string()).default([]),
  links: z.array(pageLink).default([]),
  /** Plain names with no destination: sponsor tiers, thank-you lists. */
  names: z.array(z.string()).default([]),
});

const pages = defineCollection({
  loader: file('src/content/pages.yaml'),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    /** Page title, over the photo band. */
    title: z.string(),
    /** One line under the title. Also over the photo. Keep it short. */
    lede: z.string(),
    /**
     * Which photo sits behind the title, full bleed under a scrim. A slug, not
     * a path: the mapping to an imported image lives in PageLayout.astro so
     * Astro's build-time pipeline can see the import and resize it. A path
     * string here would ship the multi-megabyte original untouched.
     */
    backdrop: z.enum([
      'little-east',
      'garden',
      'campus-flagpole',
      'bake-sale',
      'campus-front-walk',
      'campus-frontage',
    ]),
    /** Opening paragraphs, before any section. */
    body: z.array(z.string()).default([]),
    /** The one action this page most wants. Rendered as a button. */
    cta: link.optional(),
    sections: z.array(pageSection).default([]),
    /** Who to ask. `name`/`role` optional so a page can list just an address. */
    contact: z
      .object({
        name: z.string().optional(),
        role: z.string().optional(),
        email: z.email(),
        note: z.string().optional(),
      })
      .optional(),
  }),
});

/**
 * Announcements - one markdown file per post, src/content/announcements/.
 *
 * A file each, rather than a list inside one YAML file, for three reasons that
 * all point the same way: two people adding posts in the same week cannot
 * conflict, /admin can create and delete a post by writing or removing one
 * file, and `git log` on that directory is a readable history of what the PTA
 * announced and when.
 *
 * Filenames are `YYYY-MM-DD-slug.md`. The date in the name is for humans
 * sorting a directory listing; the `date` field is what the site actually uses.
 *
 * These replaced a hand-maintained `news.items` list in home.yaml. That list
 * went stale for the same reason the Weebly site did (F18): editing it meant
 * knowing where it lived.
 */
/**
 * Grades a post can be aimed at. Empty or absent means the whole school, which
 * is the common case - so the default costs nobody a decision.
 *
 * Stored as slugs and rendered through GRADE_LABELS, because "1" sorts and
 * compares sanely while "1st Grade" does not, and because a later notification
 * feature will want to match on a stable value rather than display text.
 */
export const gradeSlugs = ['pre-k-3', 'pre-k-4', 'kinder', '1', '2', '3', '4', '5'] as const;
export type GradeSlug = (typeof gradeSlugs)[number];

export const GRADE_LABELS: Record<GradeSlug, string> = {
  'pre-k-3': 'Pre-K 3',
  'pre-k-4': 'Pre-K 4',
  kinder: 'Kinder',
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '4': '4th',
  '5': '5th',
};

/** One photo. `alt` is not optional; see the refine below. */
const postImage = z.object({
  /** R2 object key as returned by /admin. Not a path - the URL prefix is a
      serving detail and belongs in the component. */
  key: z.string(),
  alt: z.string(),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: z
    .object({
      title: z.string(),
      /** Publication date. Drives ordering and the RSS pubDate. */
      date: z.coerce.date(),
      /** Optional destination for a "read more" link on the post's own page. */
      href: z.string().optional(),
      /** Link text. Defaults in the component, so most posts never set it. */
      linkLabel: z.string().optional(),
      /** Ordered gallery. The whole set renders on the post's own page. */
      images: z.array(postImage).default([]),
      /**
       * Which image represents the post in a list. Defaults to the first, so a
       * single-photo post never has to think about it.
       */
      cover: z.string().optional(),
      /** Empty means the whole school. */
      grades: z.array(z.enum(gradeSlugs)).default([]),
      /** Sorts above everything else regardless of date. Use sparingly. */
      pinned: z.boolean().default(false),
      /** Written but not published. Excluded from the site and the feed. */
      draft: z.boolean().default(false),
    })
    .refine((data) => data.images.every((image) => image.alt.trim().length > 0), {
      message:
        'Every image needs alt text: describe the photo for anyone who cannot see it.',
      path: ['images'],
    })
    .refine((data) => !data.cover || data.images.some((image) => image.key === data.cover), {
      message: 'cover must be the key of one of this post\'s images.',
      path: ['cover'],
    }),
});

/**
 * Instagram post embeds - src/content/instagram.yaml.
 *
 * Managed from /admin; that file explains why it is a chosen list rather than a
 * live feed. The URL shape and the maximum both come from
 * src/worker/instagram.mjs, so the editor and the build agree by construction -
 * a second copy of the pattern here would be a rule free to drift from the one
 * actually enforced at the point somebody pastes an address.
 *
 * Checked at build as well as at save, because the file can still be edited by
 * hand and a wrong address renders as an empty white box with no clue why.
 */
const instagram = defineCollection({
  loader: file('src/content/instagram.yaml'),
  schema: z.object({
    posts: z
      .array(
        z.object({
          url: z
            .string()
            .regex(
              POST_URL,
              'Must be a public post permalink like https://www.instagram.com/p/ABC123/ ' +
                '- copy it from the browser bar with the post open, and drop anything after the "?".',
            ),
        }),
      )
      .max(MAX_POSTS, `At most ${MAX_POSTS} Instagram posts - each one is an iframe.`)
      .default([]),
  }),
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
    social: z.array(socialLink).default([]),
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
    /**
     * Optional homepage video. Present in the content regardless of whether a
     * theme chooses to render it - what to say is content, whether to show it
     * is presentation.
     */
    video: z
      .object({
        /** The bare id, not a URL. The embed origin is decided in the component. */
        youtubeId: z.string(),
        /** Becomes the iframe's accessible name, which is required. */
        title: z.string(),
      })
      .optional(),
    hero,
    quickActions: z.object({
      heading: z.string(),
      items: z.array(quickAction),
    }),
    /**
     * Only the heading now. The posts live in the announcements collection so
     * they can be edited one file at a time from /admin.
     */
    announcements: z.object({
      heading: z.string(),
      /** How many to show on the homepage before "see all". */
      limit: z.number().int().positive().default(4),
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

export const collections = { announcements, home, instagram, pages, site };
