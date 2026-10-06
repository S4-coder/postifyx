'use client';

import { useRequestStore } from '@/store/useRequestStore';

const STATUS_STYLE = {
  idle: 'text-slate-500',
  connecting: 'text-amber-400',
  open: 'text-emerald-400',
  closed: 'text-slate-400',
  error: 'text-rose-400',
};

const DOT_STYLE = {
  idle: 'bg-slate-600',
  connecting: 'bg-amber-400 animate-pulse',
  open: 'bg-emerald-400',
  closed: 'bg-slate-500',
  error: 'bg-rose-400',
};

/** Renders one frame. JSON payloads get pretty-printed so they stay readable. */
function FrameBody({ payload }) {
  if (typeof payload === 'string') {
    return <span className="whitespace-pre-wrap break-words text-slate-300">{payload}</span>;
  }

  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-emerald-300">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

/** Live frame log for WebSocket and SSE. */
export default function StreamConsole() {
  const status = useRequestStore((s) => s.streamStatus);
  const error = useRequestStore((s) => s.streamError);
  const messages = useRequestStore((s) => s.streamMessages);
  const protocol = useRequestStore((s) => s.protocol);
  const wsOutbound = useRequestStore((s) => s.wsOutbound);
  const setWsOutbound = useRequestStore((s) => s.setWsOutbound);
  const sendStreamFrame = useRequestStore((s) => s.sendStreamFrame);
  const clearStream = useRequestStore((s) => s.clearStream);

  const isOpen = status === 'open' || status === 'connecting';
  const outboundDisabled = protocol !== 'WS' || status !== 'open';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#1e1e1e] px-3 py-2">
        <span className={`h-2 w-2 rounded-full ${DOT_STYLE[status] ?? DOT_STYLE.idle}`} />
        <span className={`text-xs font-medium uppercase tracking-wide ${STATUS_STYLE[status] ?? ''}`}>
          {status}
        </span>
        <span className="text-xs text-slate-600">
          {messages.length} frame{messages.length === 1 ? '' : 's'}
        </span>

        <button
          type="button"
          onClick={clearStream}
          disabled={messages.length === 0}
          className="ml-auto text-xs text-slate-600 hover:text-rose-400 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="border-b border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-[#0d0d0d]">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="max-w-sm text-xs leading-relaxed text-slate-600">
              {isOpen
                ? 'Waiting for frames…'
                : `Connect to start receiving ${protocol === 'WS' ? 'socket frames' : 'server-sent events'}.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {messages.map((msg) => (
              <li key={msg.id} className="px-3 py-2">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      msg.direction === 'out'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {msg.direction === 'out' ? 'sent' : 'recv'}
                  </span>
                  {msg.event && msg.event !== 'message' && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                      {msg.event}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-slate-700">{msg.at}</span>
                </div>
                <FrameBody payload={msg.payload} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Outbound composer: WebSocket only, since SSE is one-directional. */}
      <div className="border-t border-[#1e1e1e] p-2">
        <div className="flex gap-2">
          <input
            value={wsOutbound}
            onChange={(e) => setWsOutbound(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !outboundDisabled) {
                e.preventDefault();
                sendStreamFrame();
              }
            }}
            disabled={outboundDisabled}
            placeholder={
              protocol === 'WS' ? 'Send a frame, then press Enter' : 'SSE is read-only'
            }
            spellCheck={false}
            className="oc-input py-1.5 text-xs disabled:opacity-40"
          />
          <button
            type="button"
            onClick={sendStreamFrame}
            disabled={outboundDisabled}
            className="oc-btn-primary px-3 py-1.5 text-xs"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
