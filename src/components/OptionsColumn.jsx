'use client';

import { useEffect, useMemo, useState } from 'react';
// `History` is aliased because the block below is also called History, and an
// unaliased import of the same name is a redeclaration the compiler rejects.
import { Check, Code2, Copy, Globe, History as HistoryIcon, Plus, Share2, Trash2 } from 'lucide-react';

import { generateSnippets, SNIPPET_LANGUAGES } from '@/lib/codeGen';
import { buildShareUrl } from '@/lib/share';
import { useRequestStore } from '@/store/useRequestStore';
import { METHOD_COLOR, getProtocol } from '@/lib/protocols';

function Block({ icon: Icon, title, children, action }) {
  return (
    <section className="border-b border-[#1e1e1e]">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <Icon size={11} />
          {title}
        </span>
        {action}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard needs a secure context; the text stays selectable */
        }
      }}
      className="oc-btn-ghost w-full"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Environment selector plus its `{{variable}}` editor. */
function Environments() {
  const environments = useRequestStore((s) => s.environments);
  const activeEnvId = useRequestStore((s) => s.activeEnvId);
  const setActiveEnv = useRequestStore((s) => s.setActiveEnv);
  const updateEnvValue = useRequestStore((s) => s.updateEnvValue);
  const addEnvVar = useRequestStore((s) => s.addEnvVar);
  const removeEnvVar = useRequestStore((s) => s.removeEnvVar);
  const addEnvironment = useRequestStore((s) => s.addEnvironment);

  const active = environments.find((e) => e.id === activeEnvId) ?? environments[0];

  return (
    <Block
      icon={Globe}
      title="Environment"
      action={
        <button
          type="button"
          onClick={() => addEnvironment(`Environment ${environments.length + 1}`)}
          title="Add environment"
          className="text-slate-600 hover:text-emerald-400"
        >
          +
        </button>
      }
    >
      <div className="px-2.5 pb-1.5">
        <select
          value={active?.id}
          onChange={(e) => setActiveEnv(e.target.value)}
          className="oc-select w-full"
        >
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="px-2.5 pb-1.5">
        {Object.entries(active?.values ?? {}).map(([key, value]) => (
          <li key={key} className="mb-1 flex items-center gap-1">
            <input
              value={value}
              onChange={(e) => updateEnvValue(active.id, key, e.target.value)}
              placeholder={key}
              spellCheck={false}
              title={`{{${key}}}`}
              className="min-w-0 flex-1 rounded border border-[#2a2a2a] bg-[#0d0d0d] px-1.5 py-1 font-mono text-[11px] text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={`Remove ${key}`}
              onClick={() => removeEnvVar(active.id, key)}
              className="shrink-0 text-slate-700 hover:text-rose-400"
            >
              <Trash2 size={10} />
            </button>
          </li>
        ))}
      </ul>

      <div className="px-2.5 pb-2.5">
        <button
          type="button"
          onClick={() =>
            addEnvVar(active.id, `var_${Object.keys(active?.values ?? {}).length + 1}`)
          }
          className="w-full rounded border border-dashed border-[#2a2a2a] py-1 text-[10px] text-slate-600 hover:border-emerald-500 hover:text-emerald-400"
        >
          + Variable
        </button>
      </div>
    </Block>
  );
}

/** Sent requests. In memory only — never written to disk. */
function HistoryBlock() {
  const history = useRequestStore((s) => s.history);
  const loadFromHistory = useRequestStore((s) => s.loadFromHistory);
  const clearHistory = useRequestStore((s) => s.clearHistory);

  return (
    <Block
      icon={HistoryIcon}
      title="History"
      action={
        history.length > 0 ? (
          <button
            type="button"
            onClick={clearHistory}
            className="text-[10px] text-slate-600 hover:text-rose-400"
          >
            Clear
          </button>
        ) : null
      }
    >
      {history.length === 0 ? (
        <p className="px-2.5 pb-2.5 text-[10px] leading-relaxed text-slate-700">
          Requests you send are listed here, in memory only.
        </p>
      ) : (
        <ul className="max-h-40 overflow-auto pb-1">
          {history.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => loadFromHistory(entry.id)}
                title={entry.url}
                className="flex w-full items-center gap-1.5 px-2.5 py-1 text-left hover:bg-[#1a1a1a]"
              >
                <span
                  className={`shrink-0 font-mono text-[10px] font-bold ${
                    METHOD_COLOR[entry.method] ?? 'text-slate-500'
                  }`}
                >
                  {entry.method}
                </span>
                <span
                  className={`shrink-0 font-mono text-[10px] ${
                    entry.status >= 400 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {entry.status || '—'}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-600">
                  {entry.url}
                </span>
                <span className="shrink-0 text-[10px] text-slate-700">{entry.time_ms}ms</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

/** Share link. The payload rides in the fragment, which servers never see. */
function Share() {
  const buildPayload = useRequestStore((s) => s.buildPayload);
  const url = useRequestStore((s) => s.url);
  const method = useRequestStore((s) => s.method);
  const headers = useRequestStore((s) => s.headers);
  const body = useRequestStore((s) => s.body);
  const bodyFormat = useRequestStore((s) => s.bodyFormat);
  const auth = useRequestStore((s) => s.auth);
  const activeEnvId = useRequestStore((s) => s.activeEnvId);
  const environments = useRequestStore((s) => s.environments);
  const [shareUrl, setShareUrl] = useState('');

  // `buildShareUrl` reads `window.location`, which does not exist on the
  // server. Computing it in an effect keeps the server render and the
  // first client render identical, so hydration matches; the link then
  // refreshes whenever the request changes.
  useEffect(() => {
    try {
      setShareUrl(buildShareUrl(buildPayload()));
    } catch {
      setShareUrl('');
    }
  }, [buildPayload, url, method, headers, body, bodyFormat, auth, activeEnvId, environments]);

  return (
    <Block icon={Share2} title="Share">
      <div className="px-2.5 pb-2.5">
        {shareUrl ? (
          <>
            <p className="mb-1.5 text-[10px] leading-relaxed text-slate-700">
              Packed into the URL fragment. Auth headers become{' '}
              <code className="text-slate-600">YOUR_TOKEN</code>.
            </p>
            <CopyButton value={shareUrl} label="Copy link" />
          </>
        ) : (
          <p className="text-[10px] text-slate-700">Enter a URL to build a link.</p>
        )}
      </div>
    </Block>
  );
}

/** cURL / Fetch / Python / Node from the live request. */
function GenerateCode() {
  const buildPayload = useRequestStore((s) => s.buildPayload);
  const protocol = useRequestStore((s) => s.protocol);
  const [language, setLanguage] = useState('curl');

  const snippet = useMemo(() => {
    if (protocol === 'WS' || protocol === 'SSE') return null;
    try {
      return generateSnippets(buildPayload())[language];
    } catch {
      return null;
    }
  }, [language, protocol, buildPayload]);

  return (
    <Block icon={Code2} title="Code">
      {protocol === 'WS' || protocol === 'SSE' ? (
        <p className="px-2.5 pb-2.5 text-[10px] leading-relaxed text-slate-700">
          {getProtocol(protocol).label} is a live connection, not a single call.
        </p>
      ) : (
        <>
          <div className="flex gap-0.5 px-2.5 pb-1.5">
            {SNIPPET_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={[
                  'rounded px-1.5 py-0.5 text-[10px] font-medium transition',
                  lang.id === language
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-600 hover:bg-[#1a1a1a] hover:text-slate-300',
                ].join(' ')}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <div className="px-2.5 pb-2.5">
            {snippet ? (
              <>
                <pre className="mb-1.5 max-h-36 overflow-auto rounded border border-[#1e1e1e] bg-[#0d0d0d] p-2 font-mono text-[10px] leading-relaxed text-slate-400">
                  {snippet}
                </pre>
                <CopyButton value={snippet} label="Copy code" />
              </>
            ) : (
              <p className="text-[10px] text-slate-700">Enter a URL to generate code.</p>
            )}
          </div>
        </>
      )}
    </Block>
  );
}

/**
 * The utility column beside the request builder.
 *
 * It sits between the API pane and the response, so the four things you reach
 * for alongside a request — environment, history, share, code — are always on
 * screen without taking the response pane's width.
 */
export default function OptionsColumn() {
  // Disabled: the request-bar icons toggle the right sidebar
  // (History / Share / Code) instead, so this column is redundant.
  return null;

  return (
    <div className="flex h-full flex-col overflow-auto bg-[#121212]">
      <Environments />
      <HistoryBlock />
      <Share />
      <GenerateCode />

      <div className="flex items-center gap-1.5 px-2.5 py-2 text-[10px] text-slate-700">
        <Plus size={10} />
        Drag the divider to resize · double-click to reset
      </div>
    </div>
  );
}
