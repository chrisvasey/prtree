import { useId, useMemo, useState } from 'react';
import type { LayoutMode, ThemeMode } from '../lib/graphView';
import { primaryButtonClass, secondaryButtonClass } from '../ui/classes';

interface PrSearchOption {
  id: string;
  label: string;
}

interface HeaderControlsProps {
  repo: string;
  loading: boolean;
  canRefresh: boolean;
  themeMode: ThemeMode;
  stateFilter: 'open' | 'closed' | 'all';
  layoutMode: LayoutMode;
  hasRoot: boolean;
  hasFocusedPr: boolean;
  prSearchOptions: PrSearchOption[];
  onRepoChange: (value: string) => void;
  onStateFilterChange: (value: 'open' | 'closed' | 'all') => void;
  onLayoutModeChange: (value: LayoutMode) => void;
  onPrSelect: (nodeId: string) => void;
  onGo: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  onFocusRoot: () => void;
  onUnfocus: () => void;
}

export function HeaderControls({
  repo,
  loading,
  canRefresh,
  themeMode,
  stateFilter,
  layoutMode,
  hasRoot,
  hasFocusedPr,
  prSearchOptions,
  onRepoChange,
  onStateFilterChange,
  onLayoutModeChange,
  onPrSelect,
  onGo,
  onRefresh,
  onToggleTheme,
  onFocusRoot,
  onUnfocus
}: HeaderControlsProps) {
  const prListId = useId();
  const [searchInput, setSearchInput] = useState('');

  const searchablePrCount = prSearchOptions.length;
  const normalizedLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const option of prSearchOptions) {
      lookup.set(option.label.trim().toLowerCase(), option.id);
      const normalizedNumber = option.label.split(' ')[0]?.trim().toLowerCase();
      if (normalizedNumber) {
        lookup.set(normalizedNumber, option.id);
      }
    }
    return lookup;
  }, [prSearchOptions]);

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    const matchedId = normalizedLookup.get(value.trim().toLowerCase());
    if (matchedId) {
      onPrSelect(matchedId);
    }
  };

  const toolbarInputClass =
    'h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/25';
  const toolbarSelectClass =
    'h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/25';

  return (
    <header className="border-b border-sky-100/80 bg-slate-50/90 px-3 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-2 overflow-x-auto">
        <h1 className="m-0 shrink-0 pr-2 text-xl font-semibold tracking-tight">prtree</h1>

        <label className="sr-only" htmlFor="repo-input">
          Repo
        </label>
        <input
          id="repo-input"
          className={`${toolbarInputClass} min-w-[220px]`}
          value={repo}
          onChange={(event) => onRepoChange(event.target.value)}
          placeholder="owner/repo"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        <label className="sr-only" htmlFor="state-select">
          State
        </label>
        <select
          id="state-select"
          className={`${toolbarSelectClass} min-w-[96px]`}
          value={stateFilter}
          onChange={(event) => onStateFilterChange(event.target.value as 'open' | 'closed' | 'all')}
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>

        <label className="sr-only" htmlFor="layout-select">
          Layout
        </label>
        <select
          id="layout-select"
          className={`${toolbarSelectClass} min-w-[112px]`}
          value={layoutMode}
          onChange={(event) => onLayoutModeChange(event.target.value as LayoutMode)}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>

        <button className={`${primaryButtonClass} rounded-md px-3`} onClick={onGo} disabled={loading}>
          {loading ? 'Loading...' : 'Go'}
        </button>

        <label className="sr-only" htmlFor="pr-search">
          Search visible pull requests
        </label>
        <input
          id="pr-search"
          list={prListId}
          className={`${toolbarInputClass} min-w-[260px]`}
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchablePrCount > 0 ? 'Search PR on screen (#, title)' : 'No visible PRs to search'}
          disabled={searchablePrCount === 0}
        />
        <datalist id={prListId}>
          {prSearchOptions.map((option) => (
            <option key={option.id} value={option.label} />
          ))}
        </datalist>

        <button className={`${secondaryButtonClass} rounded-md px-3`} onClick={onFocusRoot} disabled={!hasRoot}>
          Focus Root
        </button>

        {hasFocusedPr ? (
          <button className={`${secondaryButtonClass} rounded-md px-3`} onClick={onUnfocus}>
            Unfocus
          </button>
        ) : null}

        <button
          className={`${secondaryButtonClass} ml-auto shrink-0 rounded-md px-3`}
          onClick={onRefresh}
          disabled={loading || !canRefresh}
        >
          Refresh
        </button>

        <button className={`${secondaryButtonClass} shrink-0 rounded-md px-3`} onClick={onToggleTheme}>
          {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </header>
  );
}
