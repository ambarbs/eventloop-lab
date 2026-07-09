type RuntimeBoxProps = {
  title: string;
  items: string[];
  emptyText: string;
};

export function RuntimeBox({ title, items, emptyText }: RuntimeBoxProps) {
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
