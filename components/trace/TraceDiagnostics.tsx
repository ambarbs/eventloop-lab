type Diagnostic = {
  title: string;
  message: string;
};

type TraceDiagnosticsProps = {
  error?: Diagnostic;
  warning?: Diagnostic;
};

export function TraceDiagnostics({ error, warning }: TraceDiagnosticsProps) {
  return (
    <>
      {error ? (
        <section className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
          <h2 className="text-sm font-semibold text-red-200">{error.title}</h2>
          <p className="mt-2 text-sm leading-6 text-red-100">{error.message}</p>
        </section>
      ) : null}

      {warning ? (
        <section className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
          <h2 className="text-sm font-semibold text-amber-200">
            {warning.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-100">
            {warning.message}
          </p>
        </section>
      ) : null}
    </>
  );
}
