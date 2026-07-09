'use client';

import { useEffect, useMemo, useState } from 'react';
import { RuntimeBox } from '@/components/RuntimeBox';
import { StepTimeline } from '@/components/StepTimeline';
import { sampleCode, steps } from '@/lib/runtimeTrace';

export default function Home() {
  const [code, setCode] = useState(sampleCode);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentStep = steps[currentStepIndex];

  const codeLines = useMemo(() => code.split('\n'), [code]);

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
  }, [isPlaying]);

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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-cyan-400">EventLoop Lab</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Step through JavaScript runtime behaviour
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            This first version uses a simulated trace. It does not execute
            arbitrary code yet. The goal is to teach call stack, Web APIs,
            microtasks, macrotasks, and event loop ordering.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Code</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                Current line: {currentStep.line}
              </span>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="min-h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-cyan-500"
              spellCheck={false}
            />

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-sm">
              {codeLines.map((line, index) => {
                const lineNumber = index + 1;
                const isCurrentLine = lineNumber === currentStep.line;

                return (
                  <div
                    key={`${lineNumber}-${line}`}
                    className={`grid grid-cols-[2.5rem_1fr] rounded px-2 py-1 ${
                      isCurrentLine
                        ? 'bg-cyan-500/15 text-cyan-100'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="select-none text-slate-600">
                      {lineNumber}
                    </span>
                    <span>{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={goPrevious}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
              >
                Previous
              </button>

              <button
                onClick={() => setIsPlaying((value) => !value)}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={goNext}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
              >
                Next
              </button>

              <button
                onClick={reset}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
              >
                Reset
              </button>
            </div>

            <StepTimeline
              steps={steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={selectStep}
            />

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">
                {currentStep.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {currentStep.explanation}
              </p>
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
          </section>
        </div>
      </div>
    </main>
  );
}
