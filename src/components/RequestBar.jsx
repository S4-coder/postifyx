'use client';

import {
  HTTP_METHODS,
  METHOD_COLOR,
  getProtocol,
  isStreaming,
} from '@/lib/protocols';
import { useRequestStore } from '@/store/useRequestStore';
import { Code2, History, Share2 } from 'lucide-react';

/**
 * Method selector, URL field, and the send control.
 *
 * The control changes with the protocol: request/response protocols get Send,
 * streaming protocols get Connect/Disconnect, and gRPC gets Call.
 *
 * The action icons beside Send no longer open a floating overlay: each one
 * toggles a view in the right sidebar (state lives in WorkspacePage).
 */
export default function RequestBar({ activeSidePanel, onToggleSidePanel }) {
  const protocol = useRequestStore((s) => s.protocol);
  const method = useRequestStore((s) => s.method);
  const url = useRequestStore((s) => s.url);
  const loading = useRequestStore((s) => s.loading);
  const streamStatus = useRequestStore((s) => s.streamStatus);
  const setMethod = useRequestStore((s) => s.setMethod);
  const setUrl = useRequestStore((s) => s.setUrl);
  const execute = useRequestStore((s) => s.execute);
  const connectStream = useRequestStore((s) => s.connectStream);
  const disconnectStream = useRequestStore((s) => s.disconnectStream);
  const executeGrpc = useRequestStore((s) => s.executeGrpc);

  const activeProtocol = getProtocol(protocol);
  const streaming = isStreaming(protocol);

  /** Cmd/Ctrl+Enter runs the primary action, as in every other API client. */
  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onPrimary();
    }
  };

  const streamConnected = streamStatus === 'open' || streamStatus === 'connecting';

  function onPrimary() {
    if (streaming) {
      if (streamConnected) disconnectStream();
      else connectStream();
      return;
    }
    if (protocol === 'GRPC') {
      executeGrpc();
      return;
    }
    execute();
  }

  const busy = loading || streamStatus === 'connecting';

  const buttonLabel = streaming
    ? streamConnected
      ? 'Disconnect'
      : 'Connect'
    : protocol === 'GRPC'
      ? 'Call'
      : loading
        ? 'Sending'
        : 'Send';

  const placeholder = streaming
    ? protocol === 'WS'
      ? 'wss://echo.example.com/socket'
      : 'https://example.com/events'
    : protocol === 'GRPC'
      ? 'localhost:50051'
      : 'https://api.example.com/v1/resource';

  /** One request-bar action icon; toggles its sidebar view on click. */
  const sideIcon = (panel, label, Icon) => (
    <button
      type="button"
      onClick={() => onToggleSidePanel(panel)}
      title={label}
      aria-label={label}
      aria-pressed={activeSidePanel === panel}
      className={`p-1.5 rounded hover:bg-[#2a2a2a] transition ${
        activeSidePanel === panel ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex shrink-0 flex-col gap-1.5 border-b border-[#1e1e1e] bg-[#121212] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {!streaming && protocol !== 'GRPC' && (
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={protocol === 'GRAPHQL'}
            title={protocol === 'GRAPHQL' ? 'GraphQL always sends POST' : 'HTTP method'}
            className="oc-select w-20 sm:w-28 font-mono font-bold"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m} className={METHOD_COLOR[m]}>
                {m}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="oc-input min-w-0 flex-1"
        />

        <button
          type="button"
          onClick={onPrimary}
          disabled={busy && !streaming}
          className="oc-btn-primary relative min-w-[6rem] overflow-hidden"
        >
          {busy && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-pulsebar bg-emerald-400" />
          )}
          {buttonLabel}
          <kbd className="ml-1 hidden rounded bg-emerald-800 px-1 text-[10px] font-normal text-emerald-200">
            ⌘↵
          </kbd>
        </button>

        {/* Action Icons beside Send Button — each toggles the right sidebar */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 border border-[#2a2a2a] rounded-md">
          {sideIcon('history', 'History', History)}
          {sideIcon('share', 'Share Request', Share2)}
          {sideIcon('code', 'Generate Code Snippet', Code2)}
        </div>
      </div>

      {activeProtocol.desktopOnly && !streaming && (
        <p className="text-xs text-amber-400/90">
          {activeProtocol.label} needs the desktop app: this transport is not reachable from a
          browser tab.
        </p>
      )}

      {streaming && (
        <p className="text-xs text-slate-500">
          {protocol === 'WS'
            ? 'Frames travel both ways once connected. Use the composer below the log to send one.'
            : 'Server-sent events are read-only. The stream stays open until you disconnect.'}
        </p>
      )}
    </div>
  );
}
