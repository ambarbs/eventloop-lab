'use client';

import { AnalyzedCodePreview } from '@/components/code/AnalyzedCodePreview';
import type { RuntimeSample } from '@/lib/runtimeTrace';

type Diagnostic = {
  title: string;
  message: string;
};

type CodePanelProps = {
  samples: RuntimeSample[];
  selectedSample: RuntimeSample;
  draftCode: string;
  codeLines: string[];
  currentLine?: number;
  tracedLines: Set<number>;
  hasUnanalyzedChanges: boolean;
  error?: Diagnostic;
  warning?: Diagnostic;
  onSelectSample: (sampleId: string) => void;
  onDraftCodeChange: (code: string) => void;
  onAnalyzeCode: () => void;
  onSelectLine: (lineNumber: number) => void;
};

export function CodePanel({
  samples,
  selectedSample,
  draftCode,
  codeLines,
  currentLine,
  tracedLines,
  hasUnanalyzedChanges,
  error,
  warning,
  onSelectSample,
  onDraftCodeChange,
  onAnalyzeCode,
  onSelectLine,
}: CodePanelProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Code sample</h2>

          <p className="mt-1 text-xs text-slate-500">
            {selectedSample.description}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
          {currentLine ? `Current line: ${currentLine}` : 'No active line'}
        </span>
      </div>

      <select
        value={selectedSample.id}
        onChange={(event) => onSelectSample(event.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
      >
        {samples.map((sample) => (
          <option key={sample.id} value={sample.id}>
            {sample.name}
          </option>
        ))}
      </select>

      <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        Parser v1 supports simple console.log, function calls, setTimeout, and
        Promise.resolve().then examples. Unsupported code is ignored for now.
      </p>

      <textarea
        value={draftCode}
        onChange={(event) => onDraftCodeChange(event.target.value)}
        className="min-h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-cyan-500"
        spellCheck={false}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAnalyzeCode}
          className="cursor-pointer rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
        >
          Analyze code
        </button>

        {hasUnanalyzedChanges ? (
          <span className="text-xs text-amber-300">
            You have edits that have not been analyzed yet.
          </span>
        ) : error ? (
          <span className="text-xs text-red-300">
            Analysis failed. Fix the syntax and analyze again.
          </span>
        ) : warning ? (
          <span className="text-xs text-amber-300">
            Code analyzed, but no supported runtime trace was found.
          </span>
        ) : (
          <span className="text-xs text-slate-500">Trace is up to date.</span>
        )}
      </div>

      <AnalyzedCodePreview
        codeLines={codeLines}
        currentLine={currentLine}
        tracedLines={tracedLines}
        onSelectLine={onSelectLine}
      />
    </section>
  );
}
