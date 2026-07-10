type ConsoleOutputProps = {
  output: string[];
};

export function ConsoleOutput({ output }: ConsoleOutputProps) {
  return (
    <section className="mt-4 rounded-xl border border-slate-800 bg-black p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">
        Console output
      </h2>

      {output.length === 0 ? (
        <p className="font-mono text-sm text-slate-500">No output yet.</p>
      ) : (
        <div className="space-y-1 font-mono text-sm text-green-300">
          {output.map((value, index) => (
            <p key={`${value}-${index}`}>&gt; {value}</p>
          ))}
        </div>
      )}
    </section>
  );
}
