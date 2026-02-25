import type { GraphNode } from '../types';
import { primaryButtonClass, secondaryButtonClass } from '../ui/classes';

interface SelectedNodePanelProps {
  selectedNode: GraphNode;
  onFocusSelected: () => void;
  onOpenPullRequest: () => void;
}

export function SelectedNodePanel({ selectedNode, onFocusSelected, onOpenPullRequest }: SelectedNodePanelProps) {
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
          <h2 className="m-0 mb-3 text-lg font-semibold">
            #{selectedNode.data.number} {selectedNode.data.title}
          </h2>
          <p className="mb-2 text-sm">
            <strong className="font-semibold">State:</strong> {selectedNode.data.state}
          </p>
          <p className="mb-2 text-sm">
            <strong className="font-semibold">Head:</strong> {selectedNode.data.headRef}
          </p>
          <p className="mb-4 text-sm">
            <strong className="font-semibold">Base:</strong> {selectedNode.data.baseRef}
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
