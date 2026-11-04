'use client';

import { interpolate } from '@/lib/interpolate';
import { useRequestStore } from '@/store/useRequestStore';

export default function ParamsEditor() {
  const params = useRequestStore((state) => state.params ?? []);
  const addParam = useRequestStore((state) => state.addParam);
  const updateParam = useRequestStore((state) => state.updateParam);
  const removeParam = useRequestStore((state) => state.removeParam);
  const environments = useRequestStore((state) => state.environments);
  const activeEnvId = useRequestStore((state) => state.activeEnvId);
  const env = environments.find((environment) => environment.id === activeEnvId);
  const variables = env?.values ?? {};
  const activeCount = params.filter((param) => param.enabled && param.key.trim()).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {activeCount} parameter{activeCount === 1 ? '' : 's'} will be sent
        </p>
        <button
          type="button"
          onClick={addParam}
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          + Add parameter
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto_1fr_1.4fr_auto] items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-slate-600">
          <span className="w-8" />
          <span>Key</span>
          <span>Value</span>
          <span className="w-6" />
        </div>

        {params.map((param, index) => (
          <div
            key={index}
            className="grid grid-cols-[auto_1fr_1.4fr_auto] items-center gap-2 border-t border-[#1e1e1e]/60 px-3 py-1.5"
          >
            <input
              type="checkbox"
              checked={param.enabled}
              onChange={(event) => updateParam(index, { enabled: event.target.checked })}
              className="h-3.5 w-3.5 accent-emerald-500"
              aria-label={`Enable parameter ${param.key || index + 1}`}
            />
            <input
              value={param.key}
              onChange={(event) => updateParam(index, { key: event.target.value })}
              placeholder="Parameter"
              spellCheck={false}
              className="rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
            <input
              value={param.value}
              onChange={(event) => updateParam(index, { value: event.target.value })}
              placeholder="{{variable}} or value"
              spellCheck={false}
              className="rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1 font-mono text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
              title={
                param.value.includes('{{')
                  ? `Resolves to: ${interpolate(param.value, variables)}`
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => removeParam(index)}
              className="text-slate-600 hover:text-rose-400"
              aria-label={`Remove parameter ${param.key || index + 1}`}
            >
              ×
            </button>
          </div>
        ))}

        {params.length === 0 && (
          <p className="px-3 py-5 text-center text-[11px] text-slate-600">
            Add parameters here or include a query string in the request URL.
          </p>
        )}
      </div>
    </div>
  );
}
