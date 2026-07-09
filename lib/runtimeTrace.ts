export type RuntimePhase = 'sync' | 'web-api' | 'microtask' | 'macrotask';

export type RuntimeStep = {
  line: number;
  phase: RuntimePhase;
  title: string;
  explanation: string;
  events?: string[];
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
  },
  {
    id: 'sync-console-logs',
    name: 'Synchronous console logs',
    description:
      'Shows how simple console.log statements execute immediately on the call stack.',
    code: `console.log("One");
console.log("Two");
console.log("Three");`,
  },
  {
    id: 'timer-only',
    name: 'Timer callback',
    description:
      'Shows how setTimeout registers a callback that runs after synchronous code finishes.',
    code: `console.log("Start");

setTimeout(() => {
  console.log("Timer");
}, 0);

console.log("End");`,
  },
  {
    id: 'promise-only',
    name: 'Promise callback',
    description:
      'Shows how Promise.then callbacks enter the microtask queue and run after synchronous code.',
    code: `console.log("Start");

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");`,
  },
];

export const defaultSample = runtimeSamples[0];
