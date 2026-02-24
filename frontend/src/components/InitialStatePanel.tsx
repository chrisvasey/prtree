import { selectClass } from '../ui/classes';

interface InitialStatePanelProps {
  exampleRepo: string;
  exampleRepos: string[];
  loading: boolean;
  onExampleSelect: (repo: string) => void;
}

export function InitialStatePanel({ exampleRepo, exampleRepos, loading, onExampleSelect }: InitialStatePanelProps) {
  return (
    <div className="absolute inset-4 z-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-400/70 bg-white/75 px-6 py-8 text-center backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/75">
      <h2 className="m-0 text-4xl font-semibold tracking-tight sm:text-5xl">Choose a Repository</h2>
      <p className="m-0 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
        Enter an <span className="font-mono text-base">owner/repo</span>, pick an example, or type your own.
      </p>
      <label className="grid w-full max-w-[520px] gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <span>Examples</span>
        <select
          className={`${selectClass} h-11 w-full min-w-0 text-base`}
          value={exampleRepo}
          disabled={loading}
          onChange={(event) => onExampleSelect(event.target.value)}
        >
          <option value="">Select example...</option>
          {exampleRepos.map((example) => (
            <option key={example} value={example}>
              {example}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
