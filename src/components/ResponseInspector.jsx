'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

import JsonTree from '@/components/JsonTree';
import { statusTone, formatBytes } from '@/lib/protocols';
import { useRequestStore } from '@/store/useRequestStore';

const RESPONSE_TABS = ['Body', 'Headers', 'Test'];

function HeaderTable({ headers }) {
  const entries = Object.entries(headers ?? {});
  if (!entries.length) return <p className="p-3 font-mono text-[11px] text-slate-600">No headers returned.</p>;

  return (
    <table className="w-full font-mono text-[11px]">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border-b border-[#161616]">
            <td className="w-56 px-3 py-1 text-emerald-400/80">{key}</td>
            <td className="break-all px-3 py-1 text-slate-400">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title="Copy body"
      aria-label="Copy body"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard needs a secure context; the <pre> is selectable anyway */
        }
      }}
      disabled={!value}
      className="rounded p-1 text-slate-600 transition hover:bg-[#1a1a1a] hover:text-slate-200 disabled:opacity-40"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

/**
 * Response output, styled as a terminal.
 *
 * Terminal conventions carried over: pure monospace, a leading gutter, green for
 * the successful status line, red for a transport failure, and a status bar
 * pinned to the bottom carrying the numbers. The text is deliberately left
 * selectable — copying a response is the single most common action here, so
 * `user-select: none` is not applied anywhere in this component.
 *
 * The pane's height is controlled by the parent split, which the user can drag.
 */
export default function ResponseInspector() {
  const response = useRequestStore((s) => s.response);
  const loading = useRequestStore((s) => s.loading);
  const [tab, setTab] = useState('Body');

  const tone = statusTone(response?.status);
  const statusText =
    response?.status > 0 ? `${response.status} ${response.status_text}`.trim() : 'no response';

  return (
    <div className="flex h-full flex-col bg-[#08080a]">
      {/* Title bar, styled after a terminal tab */}
      <div className="flex shrink-0 items-center gap-1 border-b border-[#1e1e1e] bg-[#121212] px-2 pt-1">
        <span className="flex items-center gap-1.5 rounded-t bg-[#08080a] px-2.5 py-1 font-mono text-[11px] text-slate-300">
          <span className={`h-1.5 w-1.5 rounded-full ${response?.status > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          response
        </span>

        <div className="ml-2 flex gap-0.5">
          {RESPONSE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'rounded px-2 py-1 font-mono text-[11px] transition',
                tab === t
                  ? 'bg-[#1a1a1a] text-emerald-400'
                  : 'text-slate-600 hover:text-slate-300',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 pb-1">
          <CopyButton value={response?.body ?? ''} />
        </div>
      </div>

      {response?.error ? (
        <pre className="shrink-0 whitespace-pre-wrap break-words border-b border-[#1e1e1e] px-3 py-2 font-mono text-[11px] leading-relaxed text-rose-400">
          {'✗ '}
          {response.error}
        </pre>
      ) : null}

      {/* Output */}
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center px-3">
            <p className="font-mono text-[11px] text-slate-600">
              <span className="text-emerald-400">$</span> waiting for response
              <span className="ml-1 inline-block animate-pulse">▍</span>
            </p>
          </div>
        ) : tab === 'Body' ? (
          response?.body ? (
            <div className="p-3">
              <JsonTree body={response.body} />
            </div>
          ) : (
            <p className="p-3 font-mono text-[11px] text-slate-700">
              <span className="text-slate-600">$</span> no body to display
            </p>
          )
        ) : tab === 'Headers' ? (
          <HeaderTable headers={response?.headers} />
        ) : (
          <div className="space-y-1.5 p-3 font-mono text-[11px]">
            <p className="text-slate-600">$ assert status &lt; 400</p>
            <p className={tone.text}>
              {response?.status > 0 ? `  ok — got ${response.status}` : '  fail — no response yet'}
            </p>
            <p className="text-slate-600">$ assert time &lt; 1000ms</p>
            <p className={(response?.time_ms ?? 0) < 1000 ? 'text-emerald-400' : 'text-amber-400'}>
              {`  ${(response?.time_ms ?? 0) < 1000 ? 'ok' : 'slow'} — ${response?.time_ms ?? 0}ms`}
            </p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center gap-3 border-t border-[#1e1e1e] bg-[#0d0d0d] px-3 py-1 font-mono text-[10px]">
        <span className={tone.text}>{statusText}</span>
        {response?.status > 0 && (
          <span className="text-slate-600">{tone.label.toLowerCase()}</span>
        )}
        <span className="text-slate-600">
          time <span className="text-slate-400">{response?.time_ms ?? 0}ms</span>
        </span>
        <span className="text-slate-600">
          size <span className="text-slate-400">{formatBytes(response?.size_bytes ?? 0)}</span>
        </span>
        {response?.truncated && <span className="text-amber-500">truncated at 8 MB</span>}
        <span className="ml-auto text-slate-700">
          {tab === 'Body' ? 'json · pretty' : tab.toLowerCase()}
        </span>
      </div>
    </div>
  );
}
