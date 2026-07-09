export const sampleCode = `console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

console.log("D");`;

export type RuntimeStep = {
  line: number;
  title: string;
  explanation: string;
  callStack: string[];
  webApis: string[];
  microtasks: string[];
  macrotasks: string[];
  consoleOutput: string[];
};

export const steps: RuntimeStep[] = [
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
