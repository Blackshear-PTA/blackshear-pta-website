/**
 * The write path: GitHub's Contents API.
 *
 * /admin does not have a database. A save is a commit, which means git history
 * is the audit log, `git revert` is the undo button, and the site rebuilds
 * itself from the same source a developer edits. That is the whole point of
 * D1's "markdown in git" decision - there is exactly one copy of the content
 * and no sync to get wrong.
 *
 * Needs a fine-grained personal access token with Contents: read and write on
 * this repository only, stored as the GITHUB_TOKEN secret. Absent, /admin fails
 * closed. See docs/ADMIN.md.
 */

const API = 'https://api.github.com';

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  /** Absent only for an unauthenticated read; see call() below. */
  token?: string;
}

export interface RepoFile {
  name: string;
  path: string;
  sha: string;
}

/**
 * GitHub returns and accepts file contents as base64, and btoa/atob only speak
 * latin1. Round-tripping "Jardín" or an emoji through them corrupts it, so the
 * conversion goes through UTF-8 bytes explicitly.
 */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function call(
  config: RepoConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${API}/repos/${config.owner}/${config.repo}${path}`, {
    ...init,
    headers: {
      /**
       * Omitted entirely when there is no token, rather than sent empty.
       *
       * This repository is public, so reads work unauthenticated - which is
       * what lets a local read-only run of /admin list and open real posts
       * with nothing configured but an email address. Sending
       * "Bearer undefined" would instead earn a 401 that reads like a
       * permissions problem. Writes always carry a token: admin.ts refuses
       * them before reaching here otherwise.
       */
      ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      // GitHub rejects requests without one. Omitting it produces a 403 that
      // reads like a permissions problem and is not.
      'User-Agent': 'blackshear-pta-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

/** Files in a directory. An empty or missing directory yields []. */
export async function listDirectory(config: RepoConfig, dir: string): Promise<RepoFile[]> {
  const response = await call(config, `/contents/${dir}?ref=${encodeURIComponent(config.branch)}`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`GitHub list failed: ${response.status} ${await response.text()}`);
  const body = (await response.json()) as Array<{ name: string; path: string; sha: string; type: string }>;
  return body.filter((f) => f.type === 'file').map(({ name, path, sha }) => ({ name, path, sha }));
}

export async function readFile(
  config: RepoConfig,
  path: string,
): Promise<{ text: string; sha: string } | null> {
  const response = await call(config, `/contents/${path}?ref=${encodeURIComponent(config.branch)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub read failed: ${response.status} ${await response.text()}`);
  const body = (await response.json()) as { content: string; sha: string };
  return { text: decodeBase64(body.content), sha: body.sha };
}

/**
 * Create or replace a file.
 *
 * `sha` is the version being replaced, and omitting it means "create". Passing
 * the sha the editor loaded is what makes a concurrent edit fail loudly with a
 * 409 instead of silently overwriting whatever the other person just saved.
 */
export async function writeFile(
  config: RepoConfig,
  path: string,
  text: string,
  message: string,
  authorEmail: string,
  sha?: string,
): Promise<{ sha: string }> {
  const response = await call(config, `/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(text),
      branch: config.branch,
      ...(sha ? { sha } : {}),
      // Attribute the commit to whoever was signed in to Access, so the repo
      // history says which board member changed what.
      author: { name: authorEmail.split('@')[0] ?? 'PTA editor', email: authorEmail },
    }),
  });
  if (response.status === 409 || response.status === 422) {
    throw new ConflictError('That post was changed by someone else. Reload and try again.');
  }
  if (!response.ok) throw new Error(`GitHub write failed: ${response.status} ${await response.text()}`);
  const body = (await response.json()) as { content: { sha: string } };
  return { sha: body.content.sha };
}

export async function deleteFile(
  config: RepoConfig,
  path: string,
  message: string,
  authorEmail: string,
  sha: string,
): Promise<void> {
  const response = await call(config, `/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha,
      branch: config.branch,
      author: { name: authorEmail.split('@')[0] ?? 'PTA editor', email: authorEmail },
    }),
  });
  if (response.status === 409) {
    throw new ConflictError('That post was changed by someone else. Reload and try again.');
  }
  if (!response.ok) throw new Error(`GitHub delete failed: ${response.status} ${await response.text()}`);
}

/** Distinguishes "someone else got there first" from a real failure. */
export class ConflictError extends Error {}
