export type PullRequestState = 'open' | 'closed';

export interface GraphNode {
  id: string;
  type: 'repo' | 'pr';
  position: {
    x: number;
    y: number;
  };
  data:
    | {
        label: string;
      }
    | {
        number: number;
        title: string;
        state: PullRequestState;
        url: string;
        headRef: string;
        baseRef: string;
        draft: boolean;
      };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphResponse {
  repo: string;
  state: 'open' | 'closed' | 'all';
  pullCount: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
