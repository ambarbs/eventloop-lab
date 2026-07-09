import type { RuntimeStep } from '@/lib/runtimeTrace';

type DiscoveredTask = {
  kind: 'timer' | 'promise';
  sourceLine: number;
  callbackLine: number;
  output: string;
};

function extractConsoleOutput(line: string): string | null {
  const match = line.match(/console\.log\((["'`])(.+?)\1\)/);
  return match?.[2] ?? null;
}

function isSetTimeoutLine(line: string) {
  return /setTimeout\s*\(/.test(line);
}

function isPromiseThenLine(line: string) {
  return /Promise\.resolve\(\)\.then\s*\(/.test(line);
}

export function buildRuntimeTrace(code: string): RuntimeStep[] {
  const lines = code.split('\n');
  const steps: RuntimeStep[] = [];
  const consoleOutput: string[] = [];
  const discoveredTasks: DiscoveredTask[] = [];

  let currentAsyncTask: DiscoveredTask | null = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line) return;

    if (isSetTimeoutLine(line)) {
      currentAsyncTask = {
        kind: 'timer',
        sourceLine: lineNumber,
        callbackLine: lineNumber,
        output: '',
      };

      steps.push({
        line: lineNumber,
        phase: 'web-api',
        title: 'Register timer',
        explanation:
          'setTimeout is called. The callback is registered with the browser timer API. The callback body does not run immediately.',
        events: [
          'Push setTimeout(...) onto the call stack',
          'Register timer callback with the browser timer API',
          'Timer callback waits outside the call stack',
          'Pop setTimeout(...) from the call stack',
        ],
        callStack: ['global()', 'setTimeout(...)'],
        webApis: [`Timer registered from line ${lineNumber}`],
        microtasks: discoveredTasks
          .filter((task) => task.kind === 'promise')
          .map((task) => `Promise callback from line ${task.callbackLine}`),
        macrotasks: discoveredTasks
          .filter((task) => task.kind === 'timer')
          .map((task) => `Timer callback from line ${task.callbackLine}`),
        consoleOutput: [...consoleOutput],
      });

      return;
    }

    if (isPromiseThenLine(line)) {
      currentAsyncTask = {
        kind: 'promise',
        sourceLine: lineNumber,
        callbackLine: lineNumber,
        output: '',
      };

      steps.push({
        line: lineNumber,
        phase: 'microtask',
        title: 'Schedule promise callback',
        explanation:
          'Promise.resolve().then(...) schedules its callback into the microtask queue. It will run after synchronous code finishes.',
        events: [
          'Push Promise.then(...) onto the call stack',
          'Create resolved promise reaction',
          'Insert promise callback into the microtask queue',
          'Pop Promise.then(...) from the call stack',
        ],
        callStack: ['global()', 'Promise.then(...)'],
        webApis: [],
        microtasks: [
          ...discoveredTasks
            .filter((task) => task.kind === 'promise')
            .map((task) => `Promise callback from line ${task.callbackLine}`),
          `Promise callback from line ${lineNumber}`,
        ],
        macrotasks: discoveredTasks
          .filter((task) => task.kind === 'timer')
          .map((task) => `Timer callback from line ${task.callbackLine}`),
        consoleOutput: [...consoleOutput],
      });

      return;
    }

    const output = extractConsoleOutput(line);

    if (output && currentAsyncTask) {
      currentAsyncTask.callbackLine = lineNumber;
      currentAsyncTask.output = output;
      discoveredTasks.push(currentAsyncTask);
      currentAsyncTask = null;
      return;
    }

    if (output) {
      consoleOutput.push(output);

      steps.push({
        line: lineNumber,
        phase: 'sync',
        title: `Run console.log("${output}")`,
        explanation:
          'This console.log runs synchronously on the call stack. It is executed immediately as part of the current global script.',
        events: [
          `Push console.log("${output}") onto the call stack`,
          `Print ${output} to console`,
          `Pop console.log("${output}") from the call stack`,
        ],
        callStack: ['global()', `console.log("${output}")`],
        webApis: [],
        microtasks: discoveredTasks
          .filter((task) => task.kind === 'promise')
          .map((task) => `Promise callback from line ${task.callbackLine}`),
        macrotasks: discoveredTasks
          .filter((task) => task.kind === 'timer')
          .map((task) => `Timer callback from line ${task.callbackLine}`),
        consoleOutput: [...consoleOutput],
      });
    }
  });

  const promiseTasks = discoveredTasks.filter(
    (task) => task.kind === 'promise',
  );
  const timerTasks = discoveredTasks.filter((task) => task.kind === 'timer');

  promiseTasks.forEach((task) => {
    consoleOutput.push(task.output);

    steps.push({
      line: task.callbackLine,
      phase: 'microtask',
      title: `Run promise callback`,
      explanation:
        'After synchronous code finishes, the event loop drains the microtask queue before running timer callbacks.',
      events: [
        'Event loop checks the microtask queue first',
        'Move promise callback onto the call stack',
        `Push console.log("${task.output}") onto the call stack`,
        `Print ${task.output} to console`,
        'Microtask callback finishes',
      ],
      callStack: ['Promise callback', `console.log("${task.output}")`],
      webApis: [],
      microtasks: promiseTasks
        .filter((queuedTask) => queuedTask !== task)
        .map(
          (queuedTask) =>
            `Promise callback from line ${queuedTask.callbackLine}`,
        ),
      macrotasks: timerTasks.map(
        (timerTask) => `Timer callback from line ${timerTask.callbackLine}`,
      ),
      consoleOutput: [...consoleOutput],
    });
  });

  timerTasks.forEach((task) => {
    consoleOutput.push(task.output);

    steps.push({
      line: task.callbackLine,
      phase: 'macrotask',
      title: 'Run timer callback',
      explanation:
        'After the microtask queue is empty, the event loop moves the timer callback onto the call stack.',
      events: [
        'Event loop checks the macrotask queue',
        'Move timer callback onto the call stack',
        `Push console.log("${task.output}") onto the call stack`,
        `Print ${task.output} to console`,
        'Timer callback finishes',
      ],
      callStack: ['Timer callback', `console.log("${task.output}")`],
      webApis: [],
      microtasks: [],
      macrotasks: timerTasks
        .filter((queuedTask) => queuedTask !== task)
        .map(
          (queuedTask) => `Timer callback from line ${queuedTask.callbackLine}`,
        ),
      consoleOutput: [...consoleOutput],
    });
  });

  if (steps.length === 0) {
    return [
      {
        line: 1,
        phase: 'sync',
        title: 'No supported runtime steps found',
        explanation:
          'This first parser only supports console.log, setTimeout, and Promise.resolve().then patterns.',
        events: [
          'Try adding console.log("A")',
          'Try adding setTimeout(() => { console.log("B") }, 0)',
          'Try adding Promise.resolve().then(() => { console.log("C") })',
        ],
        callStack: [],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: [],
      },
    ];
  }

  return steps;
}
