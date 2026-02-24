import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { resolve, sep } from 'node:path';

import { buildPullRequestGraph } from './graph';
import { createGitHubPullRequestFetcher } from './github';
import type { FetchPullRequests, PullRequestStateFilter } from './types';

const PUBLIC_DIR = resolve(process.cwd(), 'public');
const REPO_PATTERN = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

interface AppOptions {
  fetchPullRequests?: FetchPullRequests;
  githubToken?: string;
}

function isValidRepo(repo: string): boolean {
  return REPO_PATTERN.test(repo);
}

function resolvePublicPath(requestPath: string): string | null {
  const cleanPath = requestPath.split('?')[0].split('#')[0];
  const fullPath = resolve(PUBLIC_DIR, `.${cleanPath}`);
  const allowedPrefix = PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : `${PUBLIC_DIR}${sep}`;

  if (fullPath !== PUBLIC_DIR && !fullPath.startsWith(allowedPrefix)) {
    return null;
  }

  return fullPath;
}

async function tryServePublic(path: string): Promise<Bun.BunFile | null> {
  const fullPath = resolvePublicPath(path);
  if (!fullPath) {
    return null;
  }

  const file = Bun.file(fullPath);
  return (await file.exists()) ? file : null;
}

export function createApp(options: AppOptions = {}): Hono {
  const fetchPullRequests =
    options.fetchPullRequests ?? createGitHubPullRequestFetcher(options.githubToken ?? process.env.GITHUB_TOKEN);

  const app = new Hono();

  app.use('/api/*', cors());

  app.get('/api/health', (c) => c.json({ ok: true }));

  app.get('/api/graph', async (c) => {
    const repo = c.req.query('repo')?.trim() ?? '';
    if (!repo || !isValidRepo(repo)) {
      return c.json({ error: 'Query parameter repo is required in owner/repo format.' }, 400);
    }

    const requestedState = c.req.query('state')?.trim() ?? 'open';
    if (!['open', 'closed', 'all'].includes(requestedState)) {
      return c.json({ error: 'state must be one of: open, closed, all.' }, 400);
    }

    try {
      const state = requestedState as PullRequestStateFilter;
      const pullRequests = await fetchPullRequests(repo, state);
      const graph = buildPullRequestGraph(repo, pullRequests);
      return c.json({
        repo,
        state,
        pullCount: pullRequests.length,
        ...graph
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch pull requests.';
      return c.json({ error: message }, 502);
    }
  });

  app.get('/assets/*', async (c) => {
    const file = await tryServePublic(c.req.path);
    if (!file) {
      return c.notFound();
    }

    return c.body(file);
  });

  app.get('*', async (c) => {
    const directFile = await tryServePublic(c.req.path === '/' ? '/index.html' : c.req.path);
    if (directFile) {
      return c.body(directFile);
    }

    const indexFile = await tryServePublic('/index.html');
    if (indexFile) {
      return c.body(indexFile);
    }

    return c.text('Frontend build not found. Run `bun run build` first.', 503);
  });

  return app;
}
