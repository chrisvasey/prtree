import type { GraphNode } from '../types';
import { primaryButtonClass, secondaryButtonClass } from '../ui/classes';

interface SelectedNodePanelProps {
  selectedNode: GraphNode;
  onFocusSelected: () => void;
  onOpenPullRequest: () => void;
}

export function SelectedNodePanel({ selectedNode, onFocusSelected, onOpenPullRequest }: SelectedNodePanelProps) {
  const formatOpenedAt = (openedAt: string): string => {
    const parsedDate = new Date(openedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return openedAt;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(parsedDate);
  };

  const formatSubscription = (subscription: 'subscribed' | 'not-subscribed' | 'unknown'): string => {
    if (subscription === 'subscribed') {
      return 'Subscribed';
    }

    if (subscription === 'not-subscribed') {
      return 'Not subscribed';
    }

    return 'Unknown';
  };

  return (
    <aside className="overflow-y-auto border-t border-slate-300/80 bg-white/85 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/70 lg:border-t-0 lg:border-l">
      {selectedNode.type === 'repo' ? (
        <div>
          <h2 className="m-0 mb-3 text-lg font-semibold">{selectedNode.data.label}</h2>
          <button className={primaryButtonClass} onClick={onFocusSelected}>
            Focus Node
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={selectedNode.data.authorAvatarUrl}
              alt={selectedNode.data.authorLogin}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-slate-300 object-cover dark:border-slate-700"
            />
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold">@{selectedNode.data.authorLogin}</p>
              <p className="m-0 text-xs text-slate-600 dark:text-slate-300">
                Opened {formatOpenedAt(selectedNode.data.openedAt)}
              </p>
            </div>
          </div>
          <h2 className="m-0 mb-3 text-lg font-semibold">
            #{selectedNode.data.number} {selectedNode.data.title}
          </h2>
          <p className="mb-2 text-sm">
            <strong className="font-semibold">State:</strong> {selectedNode.data.state}
          </p>
          <p className="mb-2 text-sm">
            <strong className="font-semibold">Subscription:</strong> {formatSubscription(selectedNode.data.subscription)}
          </p>
          <p className="mb-4 text-sm">
            <strong className="font-semibold">Target branch:</strong> {selectedNode.data.baseRef}
          </p>
          <p className="mb-4 text-sm">
            <strong className="font-semibold">Source branch:</strong> {selectedNode.data.headRef}
          </p>
          <div className="flex gap-2.5">
            <button className={primaryButtonClass} onClick={onFocusSelected}>
              Focus PR
            </button>
            <button className={secondaryButtonClass} onClick={onOpenPullRequest}>
              Open PR
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
