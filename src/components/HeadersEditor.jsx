'use client';

import { interpolate, useRequestStore } from '@/store/useRequestStore';

/**
 * Headers tab: key/value rows with per-row enable toggles and an
 * "Inter" button that resolves {{placeholders}} from the active
 * environment. Disabled rows stay visible (so a template is not
 * lost) but are filtered out before sending.
 */
export default function HeadersEditor() {
  const headers = useRequestStore((s) => s.headers);
  const addHeader = useRequestStore((s) => s.addHeader);
  const updateHeader = useRequestStore((s) => s.updateHeader);
  const removeHeader = useRequestStore((s) => s.removeHeader);
  const environments = useRequestStore((s) => s.environments);
  const activeEnvId = useRequestStore((s) => s.activeEnvId);

  const env = environments.find((e) => e.id === activeEnvId);
  const vars = env?.values ?? {};

  const resolveRow = (i) => {
    const value = headers[i].value;
    if (!value.includes('{{')) return;
    const resolved = interpolate(value, vars);
    if (resolved !== value) updateHeader(i, { value: resolved });
  };

  const resolveAll = () => {
    headers.forEach((header, i) => {
      if (header.enabled && header.value.includes('{{')) {
        const resolved = interpolate(header.value, vars);
        if (resolved !== header.value) updateHeader(i, { value: resolved });
      }
    });
  };

  const pendingRows = headers.filter(
    (h) => h.enabled && h.value.includes('{{'),
  ).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {headers.filter((h) => h.enabled && h.key.trim()).length} header(s) will be sent
        </p>
        <div className="flex items-center gap-3">
          {pendingRows > 0 && (
            <button
              type="button"
              onClick={resolveAll}
              title={`Resolve {{placeholders}} using the "${env?.name ?? 'active'}" environment`}
              className="font-mono text-[10px] text-emerald-400 hover:text-emerald-300"
            >
              Inter all ({pendingRows})
            </button>
          )}
          <button type="button" onClick={addHeader} className="text-xs text-emerald-400 hover:text-emerald-300">
            + Add header
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto_1fr_1.4fr_auto_auto] items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-slate-600">
          <span className="w-8" />
          <span>Key</span>
          <span>Value</span>
          <span className="w-9 text-center">Inter</span>
          <span className="w-6" />
        </div>

        {headers.map((header, i) => {
          const hasPlaceholder = header.value.includes('{{');
          const resolved = hasPlaceholder ? interpolate(header.value, vars) : header.value;

          return (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr_1.4fr_auto_auto] items-center gap-2 border-t border-[#1e1e1e]/60 px-3 py-1.5"
            >
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) => updateHeader(i, { enabled: e.target.checked })}
                className="h-3.5 w-3.5 accent-emerald-500"
                aria-label={`Enable header ${header.key || i + 1}`}
              />
              <input
                value={header.key}
                onChange={(e) => updateHeader(i, { key: e.target.value })}
                placeholder="Header-Name"
                spellCheck={false}
                className="rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              <input
                value={header.value}
                onChange={(e) => updateHeader(i, { value: e.target.value })}
                placeholder="value or {{placeholder}}"
                spellCheck={false}
                className="rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1 font-mono text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => resolveRow(i)}
                disabled={!hasPlaceholder}
                title={
                  hasPlaceholder
                    ? `Resolve to: ${resolved}`
                    : 'No {{placeholder}} in this value'
                }
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                  hasPlaceholder
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-[#1e1e1e] bg-[#121212] text-slate-600'
                }`}
              >
                Inter
              </button>
              <button
                type="button"
                onClick={() => removeHeader(i)}
                className="text-slate-600 hover:text-rose-400"
                aria-label="Remove header"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
