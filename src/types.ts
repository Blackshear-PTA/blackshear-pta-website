import type { CollectionEntry } from 'astro:content';

/** The validated shape of src/content/home.yaml. Section components take slices of this. */
export type HomeData = CollectionEntry<'home'>['data'];

/** The validated shape of src/content/site.yaml - header, nav, identity. */
export type SiteData = CollectionEntry<'site'>['data'];

/** The validated shape of one entry in src/content/pages.yaml. */
export type PageData = CollectionEntry<'pages'>['data'];
