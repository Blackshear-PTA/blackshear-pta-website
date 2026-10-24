/**
 * /admin API - the endpoints the editor page talks to.
 *
 * Every route here is behind Cloudflare Access AND re-verifies the Access JWT
 * (see access.ts for why both). The editor's verified email is what lands in
 * the `edits` table, so the record says who changed what.
 *
 * Deliberately not a REST framework. A handful of routes with a switch is less
 * code than a router, and this file is meant to stay readable to whoever
 * inherits it.
 *
 * ANNOUNCEMENTS LIVE IN D1. They used to be markdown files written through the
 * GitHub Contents API, which is why this file once carried a repository config,
 * a sha for every write and a read-modify-write for the pin. All of that is
 * gone; see finding F41 in TASKS.md and migrations/0001_announcements.sql.
 *
 * SO DOES THE INSTAGRAM LIST, since 2026-10-24 (TASKS.md A52, migrations/0004).
 * It was the last thing written through GitHub: a save was a commit and showed
 * up after a rebuild, and it needed the GITHUB_TOKEN secret. Nothing here talks
 * to GitHub any more, so that secret, the token behind it and the read-only
 * guard a local run once needed are all gone.
 */
import { devIdentity, verifyAccessJwt } from './access';
import { storeImage, type ImageEnv } from './images';
import {
  listAll,
  getAny,
  listEdits,
  createPost,
  updatePost,
  deletePost,
  slugFor,
  nowStamp,
} from '../lib/posts.mjs';
import type { PostFields } from '../lib/posts.mjs';
import { getInstagramList, saveInstagramList } from '../lib/instagram-list.mjs';
import { validatePosts, MAX_POSTS } from './instagram.mjs';

/** Must match `gradeSlugs` in src/lib/grades.ts. */
const GRADES = new Set(['pre-k-3', 'pre-k-4', 'kinder', '1', '2', '3', '4', '5']);

/** Keys are content hashes written by src/worker/images.ts. */
const IMAGE_KEY = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

/** A URL segment. Matches the slug_shape CHECK in migrations/0001. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export interface AdminEnv extends ImageEnv {
  /** Announcements and the Instagram list. See migrations/. */
  DB?: D1Database;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  /**
   * Local development only. Lives in .dev.vars, which is gitignored and never
   * deployed - and see devIdentity() in ./access for why setting it in
   * production would still change nothing.
   */
  DEV_ADMIN_EMAIL?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/**
 * Normalizes the images array off the wire. Returns null when the shape is
 * wrong, so a malformed payload is a clear message rather than a crash.
 */
function readImages(value: unknown): Array<{ key: string; alt: string }> | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const out: Array<{ key: string; alt: string }> = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const { key, alt } = item as { key?: unknown; alt?: unknown };
    if (typeof key !== 'string') return null;
    out.push({ key, alt: typeof alt === 'string' ? alt : '' });
  }
  return out;
}

type Payload = Record<string, unknown>;

/**
 * Turns a request body into the fields to write, checking each one.
 *
 * ONLY THE KEYS THAT ARE PRESENT. That is the whole difference from the version
 * this replaces: the Contents API wrote whole documents, so every save had to
 * send every field, and a field the form stopped sending was written as absent.
 * That is how removing the pin checkbox silently unpinned a post on its next
 * edit. Here an omitted key never reaches the UPDATE statement.
 *
 * `creating` decides whether the three required columns have to be present -
 * they have no defaults, and a create without a title is a 500 from SQLite
 * rather than a sentence somebody can act on.
 *
 * The database enforces most of this again (CHECK constraints and two
 * triggers). These messages exist because those do not have any: a board member
 * should read "Every photo needs a description", not "constraint failed".
 */
async function readFields(
  db: D1Database,
  payload: Payload,
  { creating, slug }: { creating: boolean; slug?: string },
): Promise<{ ok: true; fields: PostFields } | { ok: false; error: string }> {
  const fields: PostFields = {};
  const has = (key: string) => Object.prototype.hasOwnProperty.call(payload, key);

  if (creating || has('title')) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) return { ok: false, error: 'Give the post a title.' };
    if (title.length > 140) return { ok: false, error: 'Title is too long (140 characters max).' };
    fields.title = title;
  }

  if (creating || has('date')) {
    const date = typeof payload.date === 'string' ? payload.date : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Date must be YYYY-MM-DD.' };
    if (Number.isNaN(Date.parse(date))) return { ok: false, error: 'That is not a real date.' };
    fields.date = date;
  }

  if (creating || has('body')) {
    const body = typeof payload.body === 'string' ? payload.body.trim() : '';
    if (!body) return { ok: false, error: 'Write something in the body.' };
    fields.body = body;
  }

  if (has('images')) {
    const images = readImages(payload.images);
    if (images === null) {
      return { ok: false, error: 'Those photos could not be read. Re-upload them.' };
    }
    for (const image of images) {
      if (!IMAGE_KEY.test(image.key)) {
        return { ok: false, error: 'One of those photos is not valid. Remove it and upload again.' };
      }
      // A photo nobody can see is not a photo. Also a trigger in the schema.
      if (!image.alt.trim()) {
        return { ok: false, error: 'Every photo needs a description. Add one for each.' };
      }
    }
    fields.images = images.map((image) => ({ key: image.key, alt: image.alt.trim() }));
  }

  if (has('cover')) {
    const cover = typeof payload.cover === 'string' ? payload.cover.trim() : '';
    if (cover) {
      /**
       * Checked against the images being saved, or - when a caller sends a
       * cover without sending photos - against the ones already stored. The
       * editor always sends both, so this second read is for the request made
       * without the page.
       */
      const against =
        fields.images ?? (slug ? ((await getAny(db, slug))?.images ?? []) : []);
      if (!against.some((image) => image.key === cover)) {
        return { ok: false, error: "The cover photo is not one of this post's photos." };
      }
    }
    fields.cover = cover;
  }

  if (has('grades')) {
    if (!Array.isArray(payload.grades) || payload.grades.some((g) => !GRADES.has(String(g)))) {
      return { ok: false, error: 'One of those grades is not a grade we know about.' };
    }
    fields.grades = payload.grades.map(String);
  }

  if (has('href')) {
    const href = typeof payload.href === 'string' ? payload.href.trim() : '';
    if (href) {
      // Only http(s). A javascript: or data: URL here would be a stored XSS on
      // every page that renders the link.
      let parsed: URL;
      try {
        parsed = new URL(href);
      } catch {
        return { ok: false, error: 'The link must be a full URL starting with https://' };
      }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { ok: false, error: 'The link must start with https://' };
      }
    }
    fields.href = href;
  }

  if (has('linkLabel')) {
    fields.linkLabel = typeof payload.linkLabel === 'string' ? payload.linkLabel.trim() : '';
  }

  if (has('draft')) fields.draft = payload.draft === true;
  if (has('pinned')) fields.pinned = payload.pinned === true;

  return { ok: true, fields };
}

/**
 * A database constraint, as a sentence.
 *
 * The schema states both .refine() rules and every column rule as CHECKs and
 * triggers, so they hold even against SQL typed by hand. Reaching one from the
 * editor means readFields() missed a case - the message still has to be usable,
 * because "CHECK constraint failed: title_length" is not something to show
 * somebody who was writing about a bake sale.
 */
function explainDbError(error: unknown): { status: number; message: string } {
  const raw = String((error as Error)?.message ?? error);

  if (/UNIQUE constraint failed: posts\.slug/i.test(raw)) {
    return { status: 409, message: 'A post with that name and date already exists.' };
  }
  if (/UNIQUE constraint failed: posts\.pinned/i.test(raw)) {
    return {
      status: 409,
      message: 'Another post is already pinned. Reload the page and try again.',
    };
  }
  if (/alt text/i.test(raw)) {
    return { status: 400, message: 'Every photo needs a description. Add one for each.' };
  }
  if (/cover must be/i.test(raw)) {
    return { status: 400, message: "The cover photo is not one of this post's photos." };
  }
  if (/CHECK constraint failed: title_length/i.test(raw)) {
    return { status: 400, message: 'Title is too long (140 characters max).' };
  }
  if (/CHECK constraint failed: date_shape/i.test(raw)) {
    return { status: 400, message: 'Date must be YYYY-MM-DD.' };
  }
  if (/CHECK constraint failed: slug_shape/i.test(raw)) {
    return { status: 400, message: 'That title does not make a usable web address. Try different words.' };
  }
  return { status: 500, message: raw };
}

/** Rejects anything that is not a plain slug. */
function safeSlug(value: string): string | null {
  if (!SLUG.test(value) || value.includes('..')) return null;
  return value;
}

export async function handleAdminApi(
  request: Request,
  env: AdminEnv,
  url: URL,
): Promise<Response> {
  /**
   * Checked first, so a local run needs neither the Access secrets nor a
   * reachable certs endpoint. Returns null anywhere but localhost.
   */
  const dev = devIdentity(url, env.DEV_ADMIN_EMAIL);

  if (!dev && (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD)) {
    return json(
      { error: 'Not configured yet. Missing Worker secret(s): CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD.' },
      503,
    );
  }

  let identity = dev;
  if (!identity) {
    try {
      identity = await verifyAccessJwt(request, env.CF_ACCESS_TEAM_DOMAIN!, env.CF_ACCESS_AUD!);
    } catch (error) {
      return json({ error: `Could not verify sign-in: ${(error as Error).message}` }, 503);
    }
  }
  if (!identity) return json({ error: 'Not signed in.' }, 401);

  /*
   * A local run writes freely. Everything the editor saves - announcements and
   * the Instagram list - is in D1, and `wrangler dev` binds a LOCAL database,
   * so clicking around the editor cannot publish anything. Until the Instagram
   * list moved (A52), a local save of it was a real commit, and a guard here
   * made it read-only unless DEV_ALLOW_WRITES was set.
   */

  const route = url.pathname.replace(/^\/admin\/api\/?/, '');
  const editor = identity.email;

  try {
    if (route === 'session') {
      return json({
        email: editor,
        // Only ever present on localhost. The editor says out loud which
        // database it is writing to, because from a dev server that is the one
        // thing you cannot tell by looking.
        ...(dev ? { dev: true, database: 'local' } : {}),
      });
    }

    // ------------------------------------------------------------- posts

    if (route === 'posts' || route.startsWith('posts/') || route === 'edits') {
      if (!env.DB) {
        return json(
          {
            error:
              'The announcements database is not connected. Someone needs to run: ' +
              'npx wrangler d1 migrations apply blackshear-pta --remote',
          },
          503,
        );
      }
      const db = env.DB;

      if (route === 'edits' && request.method === 'GET') {
        const limit = Number(url.searchParams.get('limit') ?? '50');
        return json({ edits: await listEdits(db, Number.isFinite(limit) ? limit : 50) });
      }

      if (route === 'posts' && request.method === 'GET') {
        /**
         * Drafts included - this is the editor. One query, where the markdown
         * version spent one Contents API call per file plus one to list the
         * directory, which is what used up GitHub's unauthenticated hourly
         * budget during an afternoon of reloads.
         */
        return json({ posts: await listAll(db) });
      }

      if (route === 'posts' && request.method === 'POST') {
        const payload = (await request.json()) as Payload;
        const checked = await readFields(db, payload, { creating: true });
        if (!checked.ok) return json({ error: checked.error }, 400);

        const slug = slugFor(String(checked.fields.date), String(checked.fields.title));
        if (await getAny(db, slug)) {
          return json({ error: 'A post with that name and date already exists.' }, 409);
        }

        await createPost(db, { fields: { ...checked.fields, slug }, editor });
        return json({ ok: true, post: await getAny(db, slug) }, 201);
      }

      if (route.startsWith('posts/')) {
        const slug = safeSlug(decodeURIComponent(route.slice('posts/'.length)));
        if (!slug) return json({ error: 'Bad post name.' }, 400);

        if (request.method === 'GET') {
          const post = await getAny(db, slug);
          if (!post) return json({ error: 'That post no longer exists.' }, 404);
          return json(post);
        }

        if (request.method === 'PATCH') {
          const payload = (await request.json()) as Payload;
          const checked = await readFields(db, payload, { creating: false, slug });
          if (!checked.ok) return json({ error: checked.error }, 400);

          const expectedUpdatedAt =
            typeof payload.updatedAt === 'string' ? payload.updatedAt : undefined;

          const result = await updatePost(db, slug, {
            fields: checked.fields,
            editor,
            expectedUpdatedAt,
            at: nowStamp(),
          });
          if (result === 'missing') return json({ error: 'That post no longer exists.' }, 404);
          if (result === 'conflict') {
            return json(
              {
                error:
                  'Somebody else saved this post while you were editing it. Reload the page ' +
                  'to see their version, then make your change again.',
              },
              409,
            );
          }
          return json({ ok: true, post: await getAny(db, slug) });
        }

        if (request.method === 'DELETE') {
          const result = await deletePost(db, slug, { editor });
          if (result === 'missing') return json({ error: 'That post no longer exists.' }, 404);
          return json({ ok: true });
        }
      }
    }

    // --------------------------------------------------------- instagram

    /**
     * Instagram posts on /gallery: one row in D1, read and written whole,
     * because the list is at most six addresses (migrations/0004). A save is
     * live on the next visit to /gallery, whose Instagram block is rendered on
     * request (src/components/InstagramWall.astro).
     *
     * `updatedAt` travels with the list for optimistic concurrency, as it does
     * for posts: the editor sends back the version it loaded, and a save that
     * started from an older one is refused rather than allowed to undo
     * somebody else's change.
     */
    if (route === 'instagram') {
      if (!env.DB) {
        return json({ error: 'The database is not connected, so the Instagram list cannot load.' }, 503);
      }
      const db = env.DB;
      const notMigrated = {
        error:
          'The Instagram list has not been moved into the database yet. Someone needs to run: ' +
          'npx wrangler d1 migrations apply blackshear-pta --remote',
      };

      if (request.method === 'GET') {
        const list = await getInstagramList(db);
        if (list.missing) return json(notMigrated, 503);
        return json({ urls: list.urls, updatedAt: list.updatedAt, max: MAX_POSTS });
      }

      if (request.method === 'PUT') {
        const payload = (await request.json()) as { urls?: unknown; updatedAt?: unknown };
        const check = validatePosts(payload.urls);
        if (!check.ok) return json({ error: check.error }, 400);

        if ((await getInstagramList(db)).missing) return json(notMigrated, 503);
        const saved = await saveInstagramList(db, {
          urls: check.urls,
          editor,
          expectedUpdatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : undefined,
          at: nowStamp(),
        });
        if (saved === 'conflict') {
          return json(
            {
              error:
                'Somebody else changed the Instagram list while you had it open. It has been ' +
                'reloaded with their version; make your change again.',
            },
            409,
          );
        }
        return json(saved);
      }
    }

    // ------------------------------------------------------------ images

    if (route === 'images' && request.method === 'POST') {
      if (!env.IMAGES) {
        return json(
          {
            error:
              'Photo storage is not set up yet. Someone needs to run: npx wrangler r2 bucket create blackshear-pta-images',
          },
          503,
        );
      }
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return json({ error: 'No file was sent.' }, 400);

      const result = await storeImage(env.IMAGES, file);
      if (!result.ok) return json({ error: result.error }, 400);
      return json({ ok: true, key: result.key, url: result.url, bytes: result.bytes });
    }

    return json({ error: 'Unknown endpoint.' }, 404);
  } catch (error) {

    const explained = explainDbError(error);
    return json({ error: explained.message }, explained.status);
  }
}

/** True for any path the admin owns, API or page. */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
