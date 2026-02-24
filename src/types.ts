export type PullRequestState = 'open' | 'closed';

export type PullRequestStateFilter = PullRequestState | 'all';

export interface PullRequestSummary {
  number: number;
  title: string;
  state: PullRequestState;
  url: string;
  headRef: string;
  baseRef: string;
  updatedAt: string;
  draft: boolean;
}

export interface GraphPosition {
  x: number;
  y: number;
}

export interface RepoNode {
  id: string;
  type: 'repo';
  position: GraphPosition;
  data: {
    label: string;
  };
}

export interface PullRequestNode {
  id: string;
  type: 'pr';
  position: GraphPosition;
  data: {
    number: number;
    title: string;
    state: PullRequestState;
    url: string;
    headRef: string;
    baseRef: string;
    draft: boolean;
  };
}

export type GraphNode = RepoNode | PullRequestNode;

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface PullRequestGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type FetchPullRequests = (
  repo: string,
  state: PullRequestStateFilter
) => Promise<PullRequestSummary[]>;
