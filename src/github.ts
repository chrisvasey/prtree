import type {
  FetchPullRequests,
  PullRequestState,
  PullRequestStateFilter,
  PullRequestSummary
} from './types';

interface GitHubPullRequestApiItem {
  number: number;
  title: string;
  state: PullRequestState;
  html_url: string;
  updated_at: string;
  draft: boolean;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

function parseRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    throw new Error('Repository must use owner/repo format.');
  }

  return { owner, name };
}

function toPullRequestSummary(item: GitHubPullRequestApiItem): PullRequestSummary {
  return {
    number: item.number,
    title: item.title,
    state: item.state,
    url: item.html_url,
    headRef: item.head.ref,
    baseRef: item.base.ref,
    updatedAt: item.updated_at,
    draft: item.draft
  };
}

export function createGitHubPullRequestFetcher(token?: string): FetchPullRequests {
  return async (repo: string, state: PullRequestStateFilter): Promise<PullRequestSummary[]> => {
    const { owner, name } = parseRepo(repo);

    const pullRequests: PullRequestSummary[] = [];
    const perPage = 100;
    let page = 1;

    while (true) {
      const url = new URL(`https://api.github.com/repos/${owner}/${name}/pulls`);
      url.searchParams.set('state', state);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));

      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found or not accessible.');
        }

        if (response.status === 403) {
          throw new Error('GitHub API rate limit hit. Provide GITHUB_TOKEN and retry.');
        }

        throw new Error(`GitHub API request failed with status ${response.status}.`);
      }

      const json = (await response.json()) as unknown;
      if (!Array.isArray(json)) {
        throw new Error('Unexpected GitHub API response.');
      }

      const items = json as GitHubPullRequestApiItem[];
      pullRequests.push(...items.map(toPullRequestSummary));

      if (items.length < perPage) {
        break;
      }

      page += 1;
    }

    return pullRequests;
  };
}
