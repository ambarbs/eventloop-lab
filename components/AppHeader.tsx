export const AppHeader = () => (
  <header>
    <p className="text-sm font-medium text-cyan-400">
      JavaScript Runtime Visualizer
    </p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">EventLoop Lab</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-400">
      Analyze small JavaScript snippets and step through how supported patterns
      move through the call stack, Web APIs, microtask queue, macrotask queue,
      and event loop.
    </p>
  </header>
);
