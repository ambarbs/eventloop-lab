# EventLoop Lab

An interactive JavaScript runtime visualizer for exploring how code moves through the call stack, browser APIs, microtask queue, macrotask queue, and event loop.

[Open the live app](https://eventloop-lab.vercel.app/)

[![EventLoop Lab preview](https://eventloop-lab.vercel.app/opengraph-image)](https://eventloop-lab.vercel.app/)

## What it does

EventLoop Lab lets you enter a small JavaScript snippet, analyze it, and step through the generated runtime trace.

For each step, the app displays:

- The currently executing source line
- Call stack contents
- Browser API activity
- Microtask queue
- Macrotask queue
- Console output
- A plain-English explanation of the runtime event

You can navigate through the trace using **Previous**, **Next**, **Play**, **Pause**, and **Reset**, or select a traced line directly from the analyzed code.

## Example

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

console.log("D");
```

The resulting console order is:

```text
A
D
C
B
```

The synchronous statements run first, followed by the promise microtask, and finally the timer macrotask.

## Currently supported

The current parser supports a deliberately limited subset of JavaScript:

- `console.log(...)`
- Simple function declarations and calls
- Function parameters
- Nested function calls
- `String.prototype.toUpperCase()`
- `String.prototype.toLowerCase()`
- `setTimeout(...)`
- `Promise.resolve().then(...)`
- Basic string, number, and boolean values
- Parser errors and unsupported-code diagnostics

Built-in examples include:

- Promise versus `setTimeout`
- Function call stack
- Synchronous console logs
- Timer callbacks
- Promise callbacks

## How it works

EventLoop Lab does not execute arbitrary user code.

The submitted code is parsed into an Abstract Syntax Tree using Babel Parser. The trace builder then interprets supported AST patterns and produces a sequence of runtime states for the UI.

This keeps the application deterministic and avoids directly evaluating user-supplied JavaScript.

## Limitations

EventLoop Lab is currently an educational simulator rather than a complete JavaScript interpreter or production debugger.

It does not yet support:

- Arbitrary JavaScript expressions
- General variable declarations and reassignment
- `async` and `await`
- `fetch`
- DOM events
- Multiple statements inside every callback type
- Closures and complete lexical scope behaviour
- Browser rendering phases
- Node.js event-loop phases and libuv
- Full ECMAScript runtime semantics

Unsupported syntax may be ignored or displayed as a diagnostic.

## Tech stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Babel Parser
- Vercel

## Project structure

```text
app/
  page.tsx                 Main application page
  layout.tsx               Metadata and root layout
  opengraph-image.tsx      Social sharing image

components/
  code/                    Code input and analyzed-code UI
  trace/                   Timeline, controls, diagnostics, and output
  AppHeader.tsx
  PhaseBadge.tsx
  RuntimeBox.tsx
  StepTimeline.tsx

lib/
  runtimeTrace.ts          Shared runtime types and sample snippets
  simpleTraceBuilder.ts    AST-based runtime trace builder
```

## Running locally

Clone the repository:

```bash
git clone https://github.com/ambarbs/eventloop-lab.git
cd eventloop-lab
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Roadmap

Planned improvements include:

- Top-level variable declarations and identifier resolution
- More JavaScript expressions
- `async` and `await`
- Multiple asynchronous callbacks
- Improved scope and function-return handling
- Runtime trace unit tests
- A richer browser-runtime diagram
- Optional Node.js and libuv visualisation
- A full code editor with syntax highlighting

## Project status

EventLoop Lab is under active development. Its supported JavaScript subset and runtime model will expand incrementally while keeping each generated trace understandable and deterministic.