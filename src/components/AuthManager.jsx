'use client';

import { useRequestStore } from '@/store/useRequestStore';

const SCHEMES = [
  { id: 'none', label: 'No Auth' },
  { id: 'bearer', label: 'Bearer Token' },
  { id: 'basic', label: 'Basic Auth' },
  { id: 'apikey', label: 'API Key (X-API-Key)' },
];

/**
 * Auth manager. The selected scheme is merged into real headers by
 * `buildPayload`, so no secret ever lives in a separate request object.
 */
export default function AuthManager() {
  const auth = useRequestStore((s) => s.auth);
  const setAuth = useRequestStore((s) => s.setAuth);

  return (
    <div className="max-w-2xl space-y-3 p-3">
      <div className="flex flex-wrap gap-2">
        {SCHEMES.map((scheme) => (
          <button
            key={scheme.id}
            type="button"
            onClick={() => setAuth({ type: scheme.id })}
            className={[
              'rounded border px-3 py-1.5 text-xs font-medium transition',
              auth.type === scheme.id
                ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                : 'border-[#2a2a2a] text-slate-400 hover:border-slate-600 hover:text-slate-200',
            ].join(' ')}
          >
            {scheme.label}
          </button>
        ))}
      </div>

      {auth.type === 'none' && (
        <p className="text-xs text-slate-500">
          This request is sent with no authentication header.
        </p>
      )}

      {auth.type === 'bearer' && (
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Token</span>
          <input
            type="password"
            value={auth.token}
            onChange={(e) => setAuth({ token: e.target.value })}
            placeholder="{{access_token}}"
            spellCheck={false}
            className="oc-input"
          />
          <span className="mt-1 block text-[10px] text-slate-600">
            Stored in local browser storage only. Supports {'{{env}}'} placeholders.
          </span>
        </label>
      )}

      {auth.type === 'basic' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Username</span>
            <input
              value={auth.username}
              onChange={(e) => setAuth({ username: e.target.value })}
              spellCheck={false}
              className="oc-input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Password</span>
            <input
              type="password"
              value={auth.password}
              onChange={(e) => setAuth({ password: e.target.value })}
              spellCheck={false}
              className="oc-input"
            />
          </label>
        </div>
      )}

      {auth.type === 'apikey' && (
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">API Key</span>
          <input
            type="password"
            value={auth.token}
            onChange={(e) => setAuth({ token: e.target.value })}
            placeholder="{{api_key}}"
            spellCheck={false}
            className="oc-input"
          />
        </label>
      )}
    </div>
  );
}
