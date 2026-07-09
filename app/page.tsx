'use client';

import { useEffect, useMemo, useState } from 'react';

const sampleCode = `console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

console.log("D");`;

type RuntimeStep = {
  line: number;
  title: string;
  explanation: string;
  callStack: string[];
  webApis: string[];
  microtasks: string[];
  macrotasks: string[];
  consoleOutput: string[];
};

const steps: RuntimeStep[] = [
  {
    line: 1,
    title: 'Run first synchronous line',
    explanation:
      "The global code starts executing. console.log('A') goes directly onto the call stack and runs immediately.",
    callStack: ['global()', 'console.log("A")'],
    webApis: [],
    microtasks: [],
    macrotasks: [],
    consoleOutput: ['A'],
  },
  {
    line: 3,
    title: 'Register timer',
    explanation:
      'setTimeout is called. The callback is handed to the browser timer API. The callback body does not run yet.',
    callStack: ['global()', 'setTimeout(...)'],
    webApis: ['Timer registered: callback from line 4'],
    microtasks: [],
    macrotasks: [],
    consoleOutput: ['A'],
  },
  {
    line: 7,
    title: 'Schedule promise callback',
    explanation:
      'Promise.resolve().then(...) schedules the callback into the microtask queue. It will run after the current synchronous code finishes.',
    callStack: ['global()', 'Promise.then(...)'],
    webApis: [],
    microtasks: ['Promise callback from line 8'],
    macrotasks: ['Timer callback from line 4'],
    consoleOutput: ['A'],
  },
  {
    line: 11,
    title: 'Run final synchronous line',
    explanation:
      "console.log('D') runs immediately because it is still part of the synchronous global execution.",
    callStack: ['global()', 'console.log("D")'],
    webApis: [],
    microtasks: ['Promise callback from line 8'],
    macrotasks: ['Timer callback from line 4'],
    consoleOutput: ['A', 'D'],
  },
  {
    line: 8,
    title: 'Run microtask',
    explanation:
      'The global call stack is now empty, so the event loop gives priority to the microtask queue. The promise callback runs before the timer.',
    callStack: ['Promise callback', 'console.log("C")'],
    webApis: [],
    microtasks: [],
    macrotasks: ['Timer callback from line 4'],
    consoleOutput: ['A', 'D', 'C'],
  },
  {
    line: 4,
    title: 'Run timer callback',
    explanation:
      'After microtasks are cleared, the event loop moves the timer callback from the macrotask queue onto the call stack.',
    callStack: ['Timer callback', 'console.log("B")'],
    webApis: [],
    microtasks: [],
    macrotasks: [],
    consoleOutput: ['A', 'D', 'C', 'B'],
  },
];

function RuntimeBox({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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
