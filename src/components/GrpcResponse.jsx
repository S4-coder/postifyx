'use client';

import JsonTree from '@/components/JsonTree';
import { useRequestStore } from '@/store/useRequestStore';

/** Result pane for a gRPC call: status code, timing, and the decoded message. */
export default function GrpcResponse() {
  const result = useRequestStore((s) => s.grpcResult);
  const loading = useRequestStore((s) => s.loading);

  const tone =
    result?.error || (result && result.grpcStatus !== 'OK')
      ? 'text-rose-400'
      : result
        ? 'text-emerald-400'
        : 'text-slate-500';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-[#1e1e1e] px-3 py-2">
        <span className={`font-mono text-sm font-bold ${tone}`}>
          {loading ? 'Calling…' : result?.grpcStatus ?? 'NO CALL'}
        </span>
        {result && !loading && (
          <span className="text-xs text-slate-500">
            <span className="text-sky-400">{result.elapsedMs}</span> ms
          </span>
        )}
      </div>

      {result?.error && (
        <div className="border-b border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs leading-relaxed text-rose-300">
          {result.error}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-[#0d0d0d] p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2a2a2a] border-t-sky-500" />
          </div>
        ) : result?.message ? (
          <JsonTree body={result.message} />
        ) : result?.rawMessage ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              The response could not be decoded as the declared message type. Raw bytes below,
              base64-encoded.
            </p>
            <pre className="break-all font-mono text-[11px] text-slate-400">{result.rawMessage}</pre>
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            Configure the call on the left, then press Send. gRPC status codes come back here
            instead of an HTTP status.
          </p>
        )}
      </div>
    </div>
  );
}
