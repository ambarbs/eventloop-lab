'use client';

import { useEffect, useMemo, useState } from 'react';
import { RuntimeBox } from '@/components/RuntimeBox';
import { StepTimeline } from '@/components/StepTimeline';
import { PhaseBadge } from '@/components/PhaseBadge';
import { defaultSample, runtimeSamples } from '@/lib/runtimeTrace';
import { buildRuntimeTrace } from '@/lib/simpleTraceBuilder';

export default function Home() {
  const [selectedSampleId, setSelectedSampleId] = useState(defaultSample.id);
  const [draftCode, setDraftCode] = useState(defaultSample.code);
  const [analyzedCode, setAnalyzedCode] = useState(defaultSample.code);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUnanalyzedChanges, setHasUnanalyzedChanges] = useState(false);

  const selectedSample =
    runtimeSamples.find((sample) => sample.id === selectedSampleId) ??
    defaultSample;

  const traceResult = useMemo(
    () => buildRuntimeTrace(analyzedCode),
    [analyzedCode],
  );

  const steps = traceResult.steps;
  const currentStep = steps[currentStepIndex] ?? steps[0];
  const hasTrace = steps.length > 0;
  const hasDiagnostic = Boolean(traceResult.error || traceResult.warning);

  const codeLines = useMemo(() => analyzedCode.split('\n'), [analyzedCode]);

  const tracedLines = useMemo(
    () => new Set(steps.map((step) => step.line)),
    [steps],
  );

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setCurrentStepIndex((current) => {
        if (current >= steps.length - 1) {
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 1200);

    return () => window.clearInterval(timer);
  }, [isPlaying, steps.length]);

  function goPrevious() {
    setIsPlaying(false);
    setCurrentStepIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setIsPlaying(false);
    setCurrentStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function reset() {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }

  function selectStep(stepIndex: number) {
    setIsPlaying(false);
    setCurrentStepIndex(stepIndex);
  }

  function selectLine(lineNumber: number) {
    const matchingStepIndex = steps.findIndex(
      (step) => step.line === lineNumber,
    );

    if (matchingStepIndex === -1) return;

    setIsPlaying(false);
    setCurrentStepIndex(matchingStepIndex);
  }

  function selectSample(sampleId: string) {
    const nextSample =
      runtimeSamples.find((sample) => sample.id === sampleId) ?? defaultSample;

    setSelectedSampleId(sampleId);
    setDraftCode(nextSample.code);
    setAnalyzedCode(nextSample.code);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setHasUnanalyzedChanges(false);
  }

  function analyzeCode() {
    setAnalyzedCode(draftCode);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setHasUnanalyzedChanges(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-cyan-400">
            JavaScript Runtime Visualizer
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            EventLoop Lab
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Analyze small JavaScript snippets and step through how supported
            patterns move through the call stack, Web APIs, microtask queue,
            macrotask queue, and event loop.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Code sample
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedSample.description}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                {currentStep
                  ? `Current line: ${currentStep.line}`
                  : 'No active line'}
              </span>
            </div>
            <select
              value={selectedSampleId}
              onChange={(event) => selectSample(event.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
            >
              {runtimeSamples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.name}
                </option>
              ))}
            </select>
            <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Parser v1 supports simple console.log, function calls, setTimeout,
              and Promise.resolve().then examples. Unsupported code is ignored
              for now.
            </p>
            <textarea
              value={draftCode}
              onChange={(event) => {
                setDraftCode(event.target.value);
                setHasUnanalyzedChanges(true);
                setIsPlaying(false);
              }}
              className="min-h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-cyan-500"
              spellCheck={false}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={analyzeCode}
                className="rounded-lg cursor-pointer bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
              >
                Analyze code
              </button>

              {hasUnanalyzedChanges ? (
                <span className="text-xs text-amber-300">
                  You have edits that have not been analyzed yet.
                </span>
              ) : traceResult.error ? (
                <span className="text-xs text-red-300">
                  Analysis failed. Fix the syntax and analyze again.
                </span>
              ) : traceResult.warning ? (
                <span className="text-xs text-amber-300">
                  Code analyzed, but no supported runtime trace was found.
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Trace is up to date.
                </span>
              )}
            </div>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-sm">
              {codeLines.map((line, index) => {
                const lineNumber = index + 1;
                const isCurrentLine = currentStep
                  ? lineNumber === currentStep.line
                  : false;
                const canSelectLine = tracedLines.has(lineNumber);

                return (
                  <button
                    key={`${lineNumber}-${line}`}
                    type="button"
                    disabled={!canSelectLine}
                    onClick={() => selectLine(lineNumber)}
                    className={`grid w-full grid-cols-[2.5rem_1fr] rounded px-2 py-1 text-left font-mono text-sm ${
                      isCurrentLine
                        ? 'bg-cyan-500/15 text-cyan-100'
                        : canSelectLine
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-500'
                    } ${canSelectLine ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="select-none text-slate-600">
                      {lineNumber}
                    </span>
                    <span>{line || ' '}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={goPrevious}
                disabled={!hasTrace || steps.length === 0}
                className="rounded-lg cursor-pointer bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() => setIsPlaying((value) => !value)}
                disabled={!hasTrace || steps.length === 0}
                className="rounded-lg cursor-pointer bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={goNext}
                disabled={!hasTrace || steps.length === 0}
                className="rounded-lg cursor-pointer bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>

              <button
                onClick={reset}
                disabled={!hasTrace || steps.length === 0}
                className="rounded-lg cursor-pointer bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            {steps.length > 0 ? (
              <>
                <StepTimeline
                  steps={steps}
                  currentStepIndex={currentStepIndex}
                  onSelectStep={selectStep}
                />

                {/* existing explanation card, runtime boxes, console output */}
              </>
            ) : !hasTrace && !hasDiagnostic ? (
              <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <h2 className="text-sm font-semibold text-slate-200">
                  No runtime trace yet
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Fix the code or use a supported pattern, then click Analyze
                  code.
                </p>
              </section>
            ) : null}

            {traceResult.error ? (
              <section className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                <h2 className="text-sm font-semibold text-red-200">
                  {traceResult.error.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-red-100">
                  {traceResult.error.message}
                </p>
              </section>
            ) : null}

            {traceResult.warning ? (
              <section className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                <h2 className="text-sm font-semibold text-amber-200">
                  {traceResult.warning.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-100">
                  {traceResult.warning.message}
                </p>
              </section>
            ) : null}

            {hasTrace && currentStep ? (
              <>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>

                    <PhaseBadge phase={currentStep.phase} />
                  </div>

                  <h2 className="mt-2 text-xl font-semibold text-slate-100">
                    {currentStep.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {currentStep.explanation}
                  </p>

                  {currentStep.events && currentStep.events.length > 0 ? (
                    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Runtime events
                      </h3>

                      <ol className="space-y-1 text-sm text-slate-300">
                        {currentStep.events.map((event, index) => (
                          <li key={`${event}-${index}`} className="flex gap-2">
                            <span className="text-slate-600">{index + 1}.</span>
                            <span>{event}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <RuntimeBox
                    title="Call stack"
                    items={currentStep.callStack}
                    emptyText="Stack is empty."
                  />

                  <RuntimeBox
                    title="Web APIs"
                    items={currentStep.webApis}
                    emptyText="No browser API work."
                  />

                  <RuntimeBox
                    title="Microtask queue"
                    items={currentStep.microtasks}
                    emptyText="No microtasks queued."
                  />

                  <RuntimeBox
                    title="Macrotask queue"
                    items={currentStep.macrotasks}
                    emptyText="No macrotasks queued."
                  />
                </div>

                <section className="mt-4 rounded-xl border border-slate-800 bg-black p-4">
                  <h2 className="mb-3 text-sm font-semibold text-slate-200">
                    Console output
                  </h2>

                  {currentStep.consoleOutput.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500">
                      No output yet.
                    </p>
                  ) : (
                    <div className="space-y-1 font-mono text-sm text-green-300">
                      {currentStep.consoleOutput.map((output, index) => (
                        <p key={`${output}-${index}`}>&gt; {output}</p>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : !hasDiagnostic ? (
              <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <h2 className="text-sm font-semibold text-slate-200">
                  No runtime trace available
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Fix the code or use a supported JavaScript pattern, then click
                  Analyze code.
                </p>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
