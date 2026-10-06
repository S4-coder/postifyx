'use client';

import { Binary, Globe2, Radio, Rss, Share2 } from 'lucide-react';

import { PROTOCOLS } from '@/lib/protocols';
import { useRequestStore } from '@/store/useRequestStore';

/**
 * Icons live here rather than on `PROTOCOLS` so the marketing routes, which
 * share that module, do not pull the icon library into their bundle.
 */
const PROTOCOL_ICON = {
  REST: Globe2,
  GRAPHQL: Share2,
  GRPC: Binary,
  WS: Radio,
  SSE: Rss,
};

/**
 * Vertical protocol rail. Every protocol is reachable; gRPC surfaces an
 * explanatory notice in browser mode rather than being hidden, so the limits of
 * the current build stay visible in context.
 */
export function ProtocolSwitcher() {
  const protocol = useRequestStore((s) => s.protocol);
  const setProtocol = useRequestStore((s) => s.setProtocol);

  return (
    <div className="flex flex-col items-center gap-1" role="group" aria-label="Protocol">
      {PROTOCOLS.map((p) => {
        const Icon = PROTOCOL_ICON[p.id];
        const active = p.id === protocol;

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setProtocol(p.id)}
            aria-pressed={active}
            title={`${p.label} — ${p.tagline}${p.desktopOnly ? ' (desktop only)' : ''}`}
            className={['oc-rail-item', active && 'oc-rail-item-active'].filter(Boolean).join(' ')}
          >
            {Icon ? <Icon size={17} /> : <span className="text-[10px] font-bold">{p.id}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Environment manager: pick a variable set and edit its `{{placeholders}}`.
 * Placeholders are resolved by the store's `buildPayload`.
 */
export function EnvironmentManager() {
  const environments = useRequestStore((s) => s.environments);
  const activeEnvId = useRequestStore((s) => s.activeEnvId);
  const setActiveEnv = useRequestStore((s) => s.setActiveEnv);
  const updateEnvValue = useRequestStore((s) => s.updateEnvValue);
  const addEnvVar = useRequestStore((s) => s.addEnvVar);
  const removeEnvVar = useRequestStore((s) => s.removeEnvVar);
  const addEnvironment = useRequestStore((s) => s.addEnvironment);

  const active = environments.find((e) => e.id === activeEnvId) ?? environments[0];

  return (
    <div className="relative group">
      <label className="sr-only" htmlFor="env-select">
        Environment
      </label>
      <select
        id="env-select"
        value={active?.id}
        onChange={(e) => setActiveEnv(e.target.value)}
        className="oc-select max-w-[11rem] truncate"
      >
        {environments.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => addEnvironment(`Environment ${environments.length + 1}`)}
        className="ml-1 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-1.5 py-1 text-xs text-slate-400 hover:bg-[#222222] hover:text-slate-200"
        title="Add environment"
      >
        +
      </button>

      {/* Popover editor */}
      <div className="invisible absolute right-0 top-full z-30 mt-1 w-72 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="oc-panel bg-[#121212] p-3 shadow-2xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Variables for {active?.name}
          </p>

          <div className="space-y-1.5">
            {Object.entries(active?.values ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                <input
                  value={key}
                  readOnly
                  className="w-24 rounded border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-1 font-mono text-[11px] text-emerald-400"
                />
                <input
                  value={value}
                  onChange={(e) => updateEnvValue(active.id, key, e.target.value)}
                  placeholder="value"
                  className="flex-1 rounded border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-1 font-mono text-[11px] text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeEnvVar(active.id, key)}
                  className="px-1 text-slate-600 hover:text-rose-400"
                  aria-label={`Remove ${key}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              addEnvVar(active.id, `var_${Object.keys(active?.values ?? {}).length + 1}`)
            }
            className="mt-2.5 w-full rounded border border-dashed border-[#2a2a2a] py-1 text-[11px] text-slate-500 hover:border-emerald-500 hover:text-emerald-400"
          >
            + Add variable
          </button>

          <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
            Reference any key with <code className="text-slate-500">{'{{key}}'}</code> in the URL,
            headers or body.
          </p>
        </div>
      </div>
    </div>
  );
}
