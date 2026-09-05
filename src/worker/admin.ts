/**
 * /admin API - the endpoints the editor page talks to.
 *
 * Every route here is behind Cloudflare Access AND re-verifies the Access JWT
 * (see access.ts for why both). The editor's verified email is what lands in
 * the commit author, so the repo history says who changed what.
 *
 * Deliberately not a REST framework. Six routes with a switch is less code than
 * a router, and this file is meant to stay readable to whoever inherits it.
 */
import { devIdentity, verifyAccessJwt } from './access';
import {
  listDirectory,
  readFile,
  writeFile,
  deleteFile,
  ConflictError,
  type RepoConfig,
} from './github';
import {
  stringifyPost,
  parsePost,
  filenameFor,
  dateFromFilename,
  titleFromFilename,
} from './frontmatter.mjs';
import { storeImage, type ImageEnv } from './images';
import {
  parsePosts,
  stringifyPosts,
  validatePosts,
  MAX_POSTS,
} from './instagram.mjs';

const DIR = 'src/content/announcements';

/** The Instagram post list /gallery renders. Managed from the editor. */
const INSTAGRAM_FILE = 'src/content/instagram.yaml';

/** Must match `gradeSlugs` in src/content.config.ts. */
const GRADES = new Set(['pre-k-3', 'pre-k-4', 'kinder', '1', '2', '3', '4', '5']);

/** Keys are content hashes written by src/worker/images.ts. */
const IMAGE_KEY = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

export interface AdminEnv extends ImageEnv {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  /**
   * Local development only. Lives in .dev.vars, which is gitignored and never
   * deployed - and see devIdentity() in ./access for why setting it in
   * production would still change nothing.
   */
  DEV_ADMIN_EMAIL?: string;
  /** Local development only. "true" lets a local run commit for real. */
  DEV_ALLOW_WRITES?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/**
 * Config problems are reported separately from auth failures, and say exactly
 * which value is missing. The alternative is a 500 that sends whoever set this
 * up hunting through Worker logs for a typo in a secret name.
 */
function readConfig(env: AdminEnv, dev: boolean, canWrite: boolean): { config: RepoConfig } | { error: string } {
  /**
   * Which values a request actually needs, rather than the full set.
   *
   * A local run signing in through devIdentity() never reaches verifyAccessJwt,
   * so demanding the two Access secrets there would invent a configuration
   * error for a code path that does not run. And a local run that cannot write
   * needs no GitHub token either: the repository is public, so listing and
   * reading posts works unauthenticated. That combination is what reduces local
   * setup to a single line in .dev.vars.
   */
  const required: (keyof AdminEnv)[] = [];
  if (!dev) required.push('GITHUB_TOKEN', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD');
  else if (canWrite) required.push('GITHUB_TOKEN');

  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    return { error: `Not configured yet. Missing Worker secret(s): ${missing.join(', ')}.` };
  }
  const [owner, repo] = (env.GITHUB_REPO ?? 'Blackshear-PTA/blackshear-pta-website').split('/');
  if (!owner || !repo) return { error: 'GITHUB_REPO must look like owner/repo.' };
  return {
    config: { owner, repo, branch: env.GITHUB_BRANCH ?? 'main', token: env.GITHUB_TOKEN },
  };
}

interface PostPayload {
  /** Present when editing; absent when creating. */
  slug?: unknown;
  images?: unknown;
  cover?: unknown;
  grades?: unknown;
  title?: unknown;
  date?: unknown;
  href?: unknown;
  linkLabel?: unknown;
  pinned?: unknown;
  draft?: unknown;
  body?: unknown;
  sha?: unknown;
}

/**
 * Validates what the browser sent. The editor page checks these too, but that
 * check is a convenience for the person typing - this one is the one that
 * counts, because the request can be made without the page.
 */
function validate(payload: PostPayload): { ok: true } | { ok: false; error: string } {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) return { ok: false, error: 'Give the post a title.' };
  if (title.length > 140) return { ok: false, error: 'Title is too long (140 characters max).' };

  const date = typeof payload.date === 'string' ? payload.date : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Date must be YYYY-MM-DD.' };
  if (Number.isNaN(Date.parse(date))) return { ok: false, error: 'That is not a real date.' };

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) return { ok: false, error: 'Write something in the body.' };

  // A photo nobody can see is not a photo. Enforced here as well as in the
  // content schema, because the schema failure surfaces as a broken build
  // minutes later and this surfaces as a sentence in the form.
  const images = readImages(payload.images);
  if (images === null) return { ok: false, error: 'Those photos could not be read. Re-upload them.' };
  for (const image of images) {
    if (!IMAGE_KEY.test(image.key)) {
      return { ok: false, error: 'One of those photos is not valid. Remove it and upload again.' };
    }
    if (!image.alt.trim()) {
      return { ok: false, error: 'Every photo needs a description. Add one for each.' };
    }
  }
  if (typeof payload.cover === 'string' && payload.cover.trim()) {
    if (!images.some((image) => image.key === payload.cover)) {
      return { ok: false, error: 'The cover photo is not one of this post\'s photos.' };
    }
  }
  if (payload.grades !== undefined) {
    if (!Array.isArray(payload.grades) || payload.grades.some((g) => !GRADES.has(String(g)))) {
      return { ok: false, error: 'One of those grades is not a grade we know about.' };
    }
  }

  // Only http(s). A javascript: or data: URL here would be a stored XSS on
  // every page that renders the link.
  if (typeof payload.href === 'string' && payload.href.trim()) {
    let parsed: URL;
    try {
      parsed = new URL(payload.href.trim());
    } catch {
      return { ok: false, error: 'The link must be a full URL starting with https://' };
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { ok: false, error: 'The link must start with https://' };
    }
  }
  return { ok: true };
}

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

/** Rejects anything that could climb out of the announcements directory. */
function safeSlug(slug: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*\.md$/.test(slug)) return null;
  if (slug.includes('..')) return null;
  return slug;
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

  /**
   * A local run is read-only unless you ask for otherwise.
   *
   * There is no local copy of the content to practise on: /admin reads and
   * writes through the GitHub Contents API, so a save from localhost is a real
   * commit to the real repository, landing on whatever GITHUB_BRANCH says -
   * `main` unless it was changed. Someone clicking around a dev server to see
   * how the editor behaves should not be able to publish an announcement by
   * accident. Reading is the common case and stays open; writing is one line in
   * .dev.vars away.
   */
  const canWrite = !dev || env.DEV_ALLOW_WRITES === 'true';

  const configResult = readConfig(env, Boolean(dev), canWrite);
  if ('error' in configResult) return json({ error: configResult.error }, 503);
  const { config } = configResult;

  let identity = dev;
  if (!identity) {
    try {
      identity = await verifyAccessJwt(request, env.CF_ACCESS_TEAM_DOMAIN!, env.CF_ACCESS_AUD!);
    } catch (error) {
      return json({ error: `Could not verify sign-in: ${(error as Error).message}` }, 503);
    }
  }
  if (!identity) return json({ error: 'Not signed in.' }, 401);

  if (!canWrite && request.method !== 'GET') {
    return json(
      {
        error:
          'Local development is read-only. Saving from here would commit to the real ' +
          'repository, so it is off unless you ask: set DEV_ALLOW_WRITES=true in .dev.vars.',
      },
      403,
    );
  }

  const route = url.pathname.replace(/^\/admin\/api\/?/, '');

  try {
    if (route === 'session') {
      return json({
        email: identity.email,
        // Only ever present on localhost. The editor uses it to say out loud
        // which repository and branch a save would land on, because from a dev
        // server that is the one thing you cannot tell by looking.
        ...(dev
          ? { dev: true, repo: `${config.owner}/${config.repo}`, branch: config.branch, canWrite }
          : {}),
      });
    }

    if (route === 'posts' && request.method === 'GET') {
      const files = await listDirectory(config, DIR);
      const posts = await Promise.all(
        files
          .filter((f) => f.name.endsWith('.md'))
          .map(async (file) => {
            const found = await readFile(config, file.path);
            const parsed = found ? parsePost(found.text) : null;
            /**
             * Fall back to the filename for both title and date.
             *
             * Reading a file GitHub has only just committed can 404 while the
             * directory listing already shows it. When that happened the row
             * lost its date as well as its title, so a brand new post rendered
             * as a raw ".md" filename and sorted to the very bottom - the two
             * places it should least be. The name always carries the date.
             */
            return {
              slug: file.name,
              sha: file.sha,
              title: parsed?.meta.title ?? titleFromFilename(file.name),
              date: parsed?.meta.date ?? dateFromFilename(file.name) ?? '',
              /** First line of the body, so a row is recognizable unopened. */
              excerpt: (parsed?.body ?? '').trim().split(/\n\s*\n/)[0]?.slice(0, 120) ?? '',
              images: parsed?.meta.images ?? [],
              cover: parsed?.meta.cover ?? '',
              grades: parsed?.meta.grades ?? [],
              pinned: Boolean(parsed?.meta.pinned),
              draft: Boolean(parsed?.meta.draft),
              /** True when the read failed; the row is showing derived values. */
              partial: !parsed,
            };
          }),
      );
      posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return json({ posts });
    }

    if (route.startsWith('posts/')) {
      const slug = safeSlug(decodeURIComponent(route.slice('posts/'.length)));
      if (!slug) return json({ error: 'Bad post name.' }, 400);
      const path = `${DIR}/${slug}`;

      if (request.method === 'GET') {
        const found = await readFile(config, path);
        if (!found) return json({ error: 'That post no longer exists.' }, 404);
        const parsed = parsePost(found.text);
        if (!parsed) return json({ error: 'That file has no frontmatter.' }, 422);
        return json({ slug, sha: found.sha, ...parsed.meta, body: parsed.body });
      }

      if (request.method === 'DELETE') {
        const found = await readFile(config, path);
        if (!found) return json({ error: 'That post no longer exists.' }, 404);
        await deleteFile(config, path, `Delete announcement: ${slug}`, identity.email, found.sha);
        return json({ ok: true });
      }
    }

    if (route === 'posts' && request.method === 'PUT') {
      const payload = (await request.json()) as PostPayload;
      const check = validate(payload);
      if (!check.ok) return json({ error: check.error }, 400);

      const meta = {
        title: String(payload.title).trim(),
        date: String(payload.date),
        href: typeof payload.href === 'string' && payload.href.trim() ? payload.href.trim() : undefined,
        linkLabel:
          typeof payload.linkLabel === 'string' && payload.linkLabel.trim()
            ? payload.linkLabel.trim()
            : undefined,
        images: (readImages(payload.images) ?? []).map((image) => ({
          key: image.key,
          alt: image.alt.trim(),
        })),
        cover:
          typeof payload.cover === 'string' && payload.cover.trim() ? payload.cover.trim() : undefined,
        grades: Array.isArray(payload.grades) ? payload.grades.map(String) : [],
        pinned: payload.pinned === true,
        draft: payload.draft === true,
      };
      const body = String(payload.body).trim();

      // An existing post keeps its filename even if the title changes, so its
      // URL and its git history stay put. Only a new post gets a name derived
      // from the title.
      const existing = typeof payload.sha === 'string' && payload.sha ? String(payload.sha) : undefined;
      const requested = typeof payload.slug === 'string' ? safeSlug(payload.slug) : null;
      const slug = requested ?? filenameFor(meta.date, meta.title);
      const path = `${DIR}/${slug}`;

      if (!existing && (await readFile(config, path))) {
        return json({ error: 'A post with that name and date already exists.' }, 409);
      }

      const { sha } = await writeFile(
        config,
        path,
        stringifyPost(meta, body),
        `${existing ? 'Update' : 'Add'} announcement: ${meta.title}`,
        identity.email,
        existing,
      );
      return json({ ok: true, slug, sha });
    }

    /**
     * Instagram posts on /gallery.
     *
     * The whole file is read and written every time. It holds at most six
     * lines, so there is nothing to gain from patching it, and a
     * read-modify-write of the complete document means the editor sends a list
     * and gets a list back with no partial state to reconcile. The sha is
     * carried through for the same optimistic-concurrency reason posts use it.
     */
    if (route === 'instagram' && request.method === 'GET') {
      const found = await readFile(config, INSTAGRAM_FILE);
      return json({
        urls: found ? parsePosts(found.text) : [],
        sha: found?.sha ?? null,
        max: MAX_POSTS,
      });
    }

    if (route === 'instagram' && request.method === 'PUT') {
      const payload = (await request.json()) as { urls?: unknown; sha?: unknown };
      const check = validatePosts(payload.urls);
      if (!check.ok) return json({ error: check.error }, 400);

      const written = await writeFile(
        config,
        INSTAGRAM_FILE,
        stringifyPosts(check.urls),
        `Update Instagram posts (${check.urls.length})`,
        identity.email,
        typeof payload.sha === 'string' ? payload.sha : undefined,
      );
      return json({ urls: check.urls, sha: written.sha });
    }

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
    if (error instanceof ConflictError) return json({ error: error.message }, 409);
    const message = (error as Error).message;
    /**
     * A rejected token is the one local failure whose message does not point at
     * its own fix. Reads here need no token at all - the repository is public -
     * so a leftover or expired GITHUB_TOKEN in .dev.vars turns a session that
     * would have worked into a bare "Bad credentials" from GitHub.
     */
    /**
     * The cost of making the token optional for read-only local work, arriving
     * in practice: unauthenticated GitHub allows 60 requests an hour per IP, and
     * one load of this page spends seven of them. An afternoon of reloads runs
     * it out, and GitHub's own text does not say that in a way anyone reads.
     */
    if (/rate limit/i.test(message)) {
      return json(
        {
          error: dev
            ? 'GitHub\'s hourly limit for requests without a token is used up. It resets ' +
              'within the hour - or add a GITHUB_TOKEN to .dev.vars to raise it.'
            : 'GitHub is rate limiting us. Wait a few minutes and reload.',
        },
        429,
      );
    }
    if (dev && /\b401\b/.test(message)) {
      return json(
        {
          error:
            'GitHub rejected the token in .dev.vars. For read-only local work you do not need ' +
            'one at all - remove the GITHUB_TOKEN line and reload. ' +
            `(GitHub said: ${message})`,
        },
        500,
      );
    }
    return json({ error: message }, 500);
  }
}

/** True for any path the admin owns, API or page. */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
