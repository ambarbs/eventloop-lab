'use client';

import { useEffect, useMemo, useState } from 'react';
import { RuntimeBox } from '@/components/RuntimeBox';
import { StepTimeline } from '@/components/StepTimeline';
import { defaultSample, runtimeSamples } from '@/lib/runtimeTrace';
import { buildRuntimeTrace } from '@/lib/simpleTraceBuilder';
import { AppHeader } from '@/components/AppHeader';
import { TraceDiagnostics } from '@/components/trace/TraceDiagnostics';
import { TraceControls } from '@/components/trace/TraceControls';
import { StepDetail } from '@/components/trace/StepDetail';
import { ConsoleOutput } from '@/components/trace/ConsoleOutput';
import { CodePanel } from '@/components/code/CodePanel';

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

  function changeDraftCode(code: string) {
    setDraftCode(code);
    setHasUnanalyzedChanges(true);
    setIsPlaying(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <CodePanel
            samples={runtimeSamples}
            selectedSample={selectedSample}
            draftCode={draftCode}
            codeLines={codeLines}
            currentLine={currentStep?.line}
            tracedLines={tracedLines}
            hasUnanalyzedChanges={hasUnanalyzedChanges}
            error={traceResult.error}
            warning={traceResult.warning}
            onSelectSample={selectSample}
            onDraftCodeChange={changeDraftCode}
            onAnalyzeCode={analyzeCode}
            onSelectLine={selectLine}
          />

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <TraceControls
              isPlaying={isPlaying}
              disabled={!hasTrace}
              onPrevious={goPrevious}
              onPlayPause={() => setIsPlaying((value) => !value)}
              onNext={goNext}
              onReset={reset}
            />
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

            <TraceDiagnostics
              error={traceResult.error}
              warning={traceResult.warning}
            />

            {hasTrace && currentStep ? (
              <>
                <StepDetail
                  step={currentStep}
                  stepNumber={currentStepIndex + 1}
                  totalSteps={steps.length}
                />

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

                <ConsoleOutput output={currentStep.consoleOutput} />
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
