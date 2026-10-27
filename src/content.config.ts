import { defineCollection, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';

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

/**
 * A YouTube video. The bare id, not a URL: the embed origin is decided in
 * VideoEmbed.astro, so nobody can paste a tracking youtube.com address here.
 * The homepage's `video` is one of these too, which is what lets both use one
 * component.
 */
const youtubeVideo = z.object({
  youtubeId: z.string(),
  /** Becomes the iframe's accessible name, which is required. */
  title: z.string(),
});

/**
 * A TikTok video, by the number at the end of its address
 * (tiktok.com/@account/video/<number>). An id for the same reason as YouTube's:
 * TikTokEmbed.astro builds the embed address, so nothing pasted here can point
 * the frame somewhere else.
 */
const tiktokVideo = z.object({
  tiktokId: z.string().regex(/^\d+$/, 'Just the number at the end of the TikTok address.'),
  title: z.string(),
});

/**
 * `image()` rather than a path string: it hands Astro's build-time pipeline the
 * file, so a page ships resized copies rather than the original. Paths are
 * relative to pages.yaml, so `../assets/little-east/2025/poster.jpg`.
 */
const pageSection = ({ image }: SchemaContext) =>
  z.object({
    heading: z.string(),
    /**
     * Makes the section fold shut under its heading, for long archives such as
     * Little EAST's years. `true` starts it open, `false` closed; leave it out
     * and the section is always shown, like every page before this one.
     */
    expanded: z.boolean().optional(),
    /**
     * One poster or flyer shown large at the top of the section, before the
     * text, big enough to read without opening it; it still opens full size in
     * the lightbox. For the current year's poster (Jon, 2026-10-27). Past years
     * keep theirs in `figures`, smaller, at the bottom.
     */
    poster: z
      .object({ src: image(), alt: z.string(), caption: z.string().optional() })
      .optional(),
    body: z.array(z.string()).default([]),
    /** Each one a YouTube video (`youtubeId`) or a TikTok (`tiktokId`). */
    videos: z.array(z.union([youtubeVideo, tiktokVideo])).default([]),
    links: z.array(pageLink).default([]),
    /** Plain names with no destination: sponsor tiers, thank-you lists. */
    names: z.array(z.string()).default([]),
    /**
     * Shown whole and never cropped, because the words are the point: posters,
     * flyers, thank-you banners. `caption` is the visible label; `alt` is what
     * a screen reader hears instead of the picture.
     */
    figures: z
      .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
      .default([]),
    /** A grid of square thumbnails that open full size. Order is display order. */
    photos: z.array(z.object({ src: image(), alt: z.string() })).default([]),
    /**
     * Sponsor logos, each linking to the sponsor's own site. Shown whole and
     * loose on the page, never cropped, each given about the same area
     * (src/components/LogoWall.astro). `name` is what a screen reader hears, and
     * the tooltip; `href` is optional because a few sponsors have no site.
     * The 2026-2027 sponsorship levels promise "logo and link" on this website
     * from the Community level up, which is what this is for.
     */
    logos: z
      .array(z.object({ src: image(), name: z.string(), href: z.url().optional() }))
      .default([]),
    /**
     * More logos after `logos`, in the same rows but drawn smaller: a lower
     * tier in the same thank-you, such as the auction's smaller donors (the
     * Fundraising chair, 2026-10-24). Same fields as `logos`.
     */
    moreLogos: z
      .array(z.object({ src: image(), name: z.string(), href: z.url().optional() }))
      .default([]),
  });

const pages = defineCollection({
  loader: file('src/content/pages.yaml'),
  schema: (context) => z.object({
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
    sections: z.array(pageSection(context)).default([]),
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

const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: z.object({
    identity: z.object({
      name: z.string(),
      location: z.string(),
      fullName: z.string(),
    }),
    /**
     * Registration identity, rendered publicly. Required rather than optional:
     * it is the evidence a Google for Nonprofits reviewer needs to tie this
     * domain to the organization on the account, and a silently-absent block
     * would fail that review without failing the build. See TASKS.md F48.
     */
    org: z.object({
      legalName: z.string(),
      irsName: z.string(),
      ein: z.string(),
      parent: z.string(),
      address: z.string(),
      school: z.string(),
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
    video: youtubeVideo.optional(),
    hero,
    quickActions: z.object({
      heading: z.string(),
      items: z.array(quickAction),
    }),
    /**
     * Only the heading now. The posts themselves are rows in the D1 database,
     * edited at /admin (A41 in TASKS.md).
     */
    announcements: z.object({
      heading: z.string(),
      /** How many to show on the homepage before "see all". */
      limit: z.number().int().positive().default(4),
    }),
    /**
     * The links families keep asking for - the handbook, drop-off and pick-up,
     * supply lists - in one place on the homepage, grouped. They used to live
     * on the old site's homepage and the PTA's Linktree. `anchor` is the id the
     * Start Here tile jumps to.
     */
    helpfulLinks: z.object({
      heading: z.string(),
      anchor: z.string().regex(/^[a-z][a-z0-9-]*$/, 'Lowercase letters, digits and hyphens: it becomes #anchor.'),
      intro: z.string().optional(),
      groups: z.array(
        z.object({
          heading: z.string(),
          links: z.array(quickAction).min(1),
        }),
      ),
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

export const collections = { home, pages, site };
