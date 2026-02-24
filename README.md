# prtree

A Bun + Hono + React Flow visualizer for GitHub pull-request trees.

Given a repository (`owner/repo`), it fetches pull requests and builds a graph showing how PRs branch from the repository root and from each other (stacked PR chains).

When you click a PR node, you can:
- focus that PR in the canvas
- open the PR on GitHub

## Stack

- Runtime: Bun
- API server: Hono
- UI: React + React Flow (`@xyflow/react`)
- Tests: Bun test runner

## What It Shows

- A root node for the repo
- One node per PR
- Edges:
  - `repo -> PR` when the PR branches from a non-PR branch (like `main`)
  - `PR -> PR` when a PR base branch matches another PR head branch (stacked PRs)

## Quick Start

## 1. Install

```bash
bun install
```

## 2. Run in development

Terminal 1 (API):

```bash
bun run dev:api
```

Terminal 2 (frontend):

```bash
bun run dev:web
```

Open [http://localhost:5173](http://localhost:5173)

## 3. Build frontend and run single server

```bash
bun run build
bun run start
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `GITHUB_TOKEN` (optional but recommended): GitHub personal access token for higher API rate limits.
- `PORT` (optional): server port (default `3000`).

Create local env file:

```bash
cp .env.example .env
```

Then set your token in `.env`:

```bash
GITHUB_TOKEN=ghp_your_token_here
PORT=3000
```

One-off example:

```bash
GITHUB_TOKEN=ghp_xxx bun run dev:api
```

## API

### `GET /api/graph?repo=owner/repo&state=open|closed|all`

Returns graph-ready PR data.

Example:

```bash
curl "http://localhost:3000/api/graph?repo=facebook/react&state=open"
```

Response shape:

```json
{
  "repo": "owner/repo",
  "nodes": [
    {
      "id": "repo:owner/repo",
      "type": "repo",
      "position": { "x": 0, "y": 0 },
      "data": { "label": "owner/repo" }
    },
    {
      "id": "pr:123",
      "type": "pr",
      "position": { "x": 320, "y": 0 },
      "data": {
        "number": 123,
        "title": "Example",
        "state": "open",
        "url": "https://github.com/owner/repo/pull/123",
        "headRef": "feature/a",
        "baseRef": "main"
      }
    }
  ],
  "edges": [
    { "id": "e-repo:owner/repo-pr:123", "source": "repo:owner/repo", "target": "pr:123" }
  ]
}
```

## Testing

Run tests:

```bash
bun test
```

The test suite covers:
- PR graph relationship logic
- node/edge generation
- API validation and error behavior

## Notes

- GitHub branch names are matched exactly when detecting stacked relationships (`base.ref` vs `head.ref`).
- If multiple parent candidates exist for a base branch, the most recently updated PR is chosen.
