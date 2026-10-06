'use client';

import { useMemo, useState } from 'react';

import SiteShell from '@/components/SiteShell';
import { API_CATEGORIES, PUBLIC_APIS, STREAM_EXAMPLES } from '@/lib/publicApis';

export default function ApisPage() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PUBLIC_APIS.filter((api) => {
      const matchesCategory = category === 'All' || api.category === category;
      const matchesQuery =
        !q || api.name.toLowerCase().includes(q) || api.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Public API directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Every endpoint here is free and needs no key. One click loads it into the workspace and
          sends it through the native Rust transport.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search APIs…"
            className="oc-input max-w-xs"
          />
          <div className="flex flex-wrap gap-1 w-full max-w-full">
            {API_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={[
                  'rounded-full border px-3 py-1 text-xs transition',
                  category === c
                    ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                    : 'border-[#2a2a2a] text-slate-400 hover:border-slate-600 hover:text-slate-200',
                ].join(' ')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid w-full max-w-full gap-4 md:grid-cols-2">
          {filtered.map((api) => (
            <article
              key={api.id}
              className="flex min-w-0 w-full max-w-full flex-col rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5 transition hover:border-[#2a2a2a]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{api.name}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{api.category}</p>
                </div>
                <span className="shrink-0 rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-slate-400">
                  {api.auth}
                </span>
              </div>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400 break-words">{api.description}</p>

              <code className="mt-3 block truncate rounded bg-[#0d0d0d] px-2 py-1.5 font-mono text-[11px] text-slate-500">
                {api.method} {api.url}
              </code>

              <p className="mt-4 text-center text-[10px] uppercase tracking-wide text-slate-600">
                This is an API
              </p>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-slate-500">No APIs match “{query}”.</p>
        )}
      </div>

      {/* Streaming targets */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-xl font-semibold tracking-tight">Streaming endpoints</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          WebSocket and SSE need a long-lived connection, so the defaults point at the local demo
          server. Start it with <code className="font-mono text-emerald-300">node server/demo-streams.mjs</code>,
          then open one in the workspace.
        </p>

        <div className="mt-6 grid w-full max-w-full gap-4 md:grid-cols-2">
          {STREAM_EXAMPLES.map((stream) => (
            <article
              key={stream.id}
              className="flex min-w-0 w-full max-w-full flex-col rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5 transition hover:border-[#2a2a2a]"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{stream.name}</h3>
                <span className="shrink-0 rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-slate-400">
                  {stream.protocol}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400 break-words">{stream.description}</p>
              <code className="mt-3 block truncate rounded bg-[#0d0d0d] px-2 py-1.5 font-mono text-[11px] text-slate-500">
                {stream.url}
              </code>
              <p className="mt-4 text-center text-[10px] uppercase tracking-wide text-slate-600">
                This is an API
              </p>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
