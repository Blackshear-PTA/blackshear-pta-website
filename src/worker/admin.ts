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
import { verifyAccessJwt } from './access';
import {
  listDirectory,
  readFile,
  writeFile,
  deleteFile,
  ConflictError,
  type RepoConfig,
} from './github';
import { stringifyPost, parsePost, filenameFor } from './frontmatter.mjs';

const DIR = 'src/content/announcements';

export interface AdminEnv {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
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
function readConfig(env: AdminEnv): { config: RepoConfig } | { error: string } {
  const missing = (['GITHUB_TOKEN', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD'] as const).filter(
    (k) => !env[k],
  );
  if (missing.length) {
    return { error: `Not configured yet. Missing Worker secret(s): ${missing.join(', ')}.` };
  }
  const [owner, repo] = (env.GITHUB_REPO ?? 'Blackshear-PTA/blackshear-pta-website').split('/');
  if (!owner || !repo) return { error: 'GITHUB_REPO must look like owner/repo.' };
  return {
    config: { owner, repo, branch: env.GITHUB_BRANCH ?? 'main', token: env.GITHUB_TOKEN! },
  };
}

interface PostPayload {
  /** Present when editing; absent when creating. */
  slug?: unknown;
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
  const configResult = readConfig(env);
  if ('error' in configResult) return json({ error: configResult.error }, 503);
  const { config } = configResult;

  let identity;
  try {
    identity = await verifyAccessJwt(request, env.CF_ACCESS_TEAM_DOMAIN!, env.CF_ACCESS_AUD!);
  } catch (error) {
    return json({ error: `Could not verify sign-in: ${(error as Error).message}` }, 503);
  }
  if (!identity) return json({ error: 'Not signed in.' }, 401);

  const route = url.pathname.replace(/^\/admin\/api\/?/, '');

  try {
    if (route === 'session') return json({ email: identity.email });

    if (route === 'posts' && request.method === 'GET') {
      const files = await listDirectory(config, DIR);
      const posts = await Promise.all(
        files
          .filter((f) => f.name.endsWith('.md'))
          .map(async (file) => {
            const found = await readFile(config, file.path);
            const parsed = found ? parsePost(found.text) : null;
            return {
              slug: file.name,
              sha: file.sha,
              title: parsed?.meta.title ?? file.name,
              date: parsed?.meta.date ?? '',
              pinned: Boolean(parsed?.meta.pinned),
              draft: Boolean(parsed?.meta.draft),
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

    return json({ error: 'Unknown endpoint.' }, 404);
  } catch (error) {
    if (error instanceof ConflictError) return json({ error: error.message }, 409);
    return json({ error: (error as Error).message }, 500);
  }
}

/** True for any path the admin owns, API or page. */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
