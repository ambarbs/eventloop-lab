type AnalyzedCodePreviewProps = {
  codeLines: string[];
  currentLine?: number;
  tracedLines: Set<number>;
  onSelectLine: (lineNumber: number) => void;
};

export function AnalyzedCodePreview({
  codeLines,
  currentLine,
  tracedLines,
  onSelectLine,
}: AnalyzedCodePreviewProps) {
  return (
    <section className="mt-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">
        Analyzed code
      </h2>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-sm">
        {codeLines.map((line, index) => {
          const lineNumber = index + 1;
          const isCurrentLine = lineNumber === currentLine;
          const canSelectLine = tracedLines.has(lineNumber);

          return (
            <button
              key={`${lineNumber}-${line}`}
              type="button"
              disabled={!canSelectLine}
              onClick={() => onSelectLine(lineNumber)}
              className={`grid w-full grid-cols-[2.5rem_1fr] rounded px-2 py-1 text-left font-mono text-sm ${
                isCurrentLine
                  ? 'bg-cyan-500/15 text-cyan-100'
                  : canSelectLine
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-500'
              } ${canSelectLine ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="select-none text-slate-600">{lineNumber}</span>

              <span>{line || ' '}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
