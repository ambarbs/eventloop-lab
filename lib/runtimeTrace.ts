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

export type RuntimeSample = {
  id: string;
  name: string;
  description: string;
  code: string;
  steps: RuntimeStep[];
};

export const runtimeSamples: RuntimeSample[] = [
  {
    id: 'promise-vs-timeout',
    name: 'Promise vs setTimeout',
    description:
      'Shows why promise microtasks run before timer macrotasks, even when setTimeout uses 0ms.',
    code: `console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

console.log("D");`,
    steps: [
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
    ],
  },
  {
    id: 'function-call-stack',
    name: 'Function call stack',
    description:
      'Shows how function calls are pushed onto the call stack and popped when they finish.',
    code: `function greet(name) {
  formatName(name);
}

function formatName(value) {
  console.log(value.toUpperCase());
}

greet("Ambar");`,
    steps: [
      {
        line: 1,
        title: 'Store greet function',
        explanation:
          'The function declaration is processed. The function body is not executed yet.',
        callStack: ['global()'],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: [],
      },
      {
        line: 5,
        title: 'Store formatName function',
        explanation:
          'The second function declaration is also processed. Again, the body does not run yet.',
        callStack: ['global()'],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: [],
      },
      {
        line: 9,
        title: 'Call greet',
        explanation:
          "The global code calls greet('Ambar'), so greet is pushed onto the call stack.",
        callStack: ['global()', "greet('Ambar')"],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: [],
      },
      {
        line: 2,
        title: 'Call formatName',
        explanation:
          'Inside greet, formatName(name) is called. A new function call is pushed above greet on the stack.',
        callStack: ['global()', "greet('Ambar')", "formatName('Ambar')"],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: [],
      },
      {
        line: 6,
        title: 'Log formatted value',
        explanation:
          'formatName runs console.log(value.toUpperCase()). The output is produced while formatName is on top of the call stack.',
        callStack: [
          'global()',
          "greet('Ambar')",
          "formatName('Ambar')",
          "console.log('AMBAR')",
        ],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: ['AMBAR'],
      },
      {
        line: 9,
        title: 'Return to global',
        explanation:
          'console.log finishes, then formatName finishes, then greet finishes. The stack returns to the global execution context.',
        callStack: ['global()'],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: ['AMBAR'],
      },
    ],
  },
];

export const defaultSample = runtimeSamples[0];
