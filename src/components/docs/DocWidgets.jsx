export function Section({ title, children }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="mb-3 border-b border-[#1e1e1e] pb-2 text-xl font-bold text-slate-100">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Subsection({ title, children }) {
  return (
    <section className="scroll-mt-24">
      <h3 className="mb-2 text-base font-semibold text-slate-100">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function P({ children }) {
  return (
    <p className="text-[13px] leading-relaxed text-slate-400">{children}</p>
  );
}

export function StepList({ steps }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-[10px] font-bold text-emerald-400">
            {i + 1}
          </span>
          <span className="text-[12px] leading-relaxed text-slate-300">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e1e1e]">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-[#1a1a1a] text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#1e1e1e]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
