import type { LayoutMode, ThemeMode } from '../lib/graphView';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, selectClass } from '../ui/classes';

interface HeaderControlsProps {
  repo: string;
  pullCount: number;
  focusedLabel: string | null;
  loading: boolean;
  error: string | null;
  themeMode: ThemeMode;
  stateFilter: 'open' | 'closed' | 'all';
  layoutMode: LayoutMode;
  hasRoot: boolean;
  hasFocusedPr: boolean;
  onRepoChange: (value: string) => void;
  onStateFilterChange: (value: 'open' | 'closed' | 'all') => void;
  onLayoutModeChange: (value: LayoutMode) => void;
  onGo: () => void;
  onToggleTheme: () => void;
  onFocusRoot: () => void;
  onUnfocus: () => void;
}

export function HeaderControls({
  repo,
  pullCount,
  focusedLabel,
  loading,
  error,
  themeMode,
  stateFilter,
  layoutMode,
  hasRoot,
  hasFocusedPr,
  onRepoChange,
  onStateFilterChange,
  onLayoutModeChange,
  onGo,
  onToggleTheme,
  onFocusRoot,
  onUnfocus
}: HeaderControlsProps) {
  return (
    <header className="flex flex-col gap-2.5 border-b border-sky-100/80 bg-slate-50/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-semibold tracking-tight">prtree</h1>
        <button className={secondaryButtonClass} onClick={onToggleTheme}>
          {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className={labelClass}>
          <span>Repo</span>
          <input
            className={inputClass}
            value={repo}
            onChange={(event) => onRepoChange(event.target.value)}
            placeholder="owner/repo"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label className={labelClass}>
          <span>State</span>
          <select
            className={selectClass}
            value={stateFilter}
            onChange={(event) => onStateFilterChange(event.target.value as 'open' | 'closed' | 'all')}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </label>

        <label className={labelClass}>
          <span>Layout</span>
          <select
            className={selectClass}
            value={layoutMode}
            onChange={(event) => onLayoutModeChange(event.target.value as LayoutMode)}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </label>

        <button className={primaryButtonClass} onClick={onGo} disabled={loading}>
          {loading ? 'Loading...' : 'Go'}
        </button>

        <button className={secondaryButtonClass} onClick={onFocusRoot} disabled={!hasRoot}>
          Focus Root
        </button>

        {hasFocusedPr ? (
          <button className={secondaryButtonClass} onClick={onUnfocus}>
            Unfocus
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span>{pullCount} pull requests</span>
        {focusedLabel ? <span>{focusedLabel}</span> : null}
        {error ? <span className="font-medium text-rose-700 dark:text-rose-400">{error}</span> : null}
      </div>
    </header>
  );
}
