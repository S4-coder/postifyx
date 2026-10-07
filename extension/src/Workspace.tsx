import React, { useState } from 'react';

interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'success' | 'error';
}

interface ResponseData {
  status?: number;
  statusText?: string;
  time?: string;
  data?: unknown;
  error?: string;
  ok?: boolean;
}

export default function Workspace() {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev: LogEntry[]) => [...prev, { time, msg, type }]);
  };

  const handleSend = async () => {
    setLoading(true);
    addLog(`>>> ${method} ${url}`, 'info');
    const start = performance.now();

    try {
      const opts: RequestInit = { method };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        opts.body = body;
        opts.headers = { 'Content-Type': 'application/json' };
      }

      const res = await fetch(url, opts);
      const duration = (performance.now() - start).toFixed(2);
      const text = await res.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = text; }

      setResponse({ status: res.status, statusText: res.statusText, time: `${duration} ms`, data, ok: res.ok });
      addLog(`Status: ${res.status} ${res.statusText} | ${duration} ms`, res.ok ? 'success' : 'error');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${message}`, 'error');
      setResponse({ error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0d0d0d] text-xs font-mono">
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] bg-[#121212] p-2">
        <select
          value={method}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value)}
          className="rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 font-bold text-emerald-400 outline-none"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          placeholder="Enter request URL…"
          className="flex-1 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-slate-200 outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded bg-emerald-600 px-4 py-1 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>

      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <textarea
          value={body}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
          placeholder='{"key": "value"}'
          className="h-24 resize-none border-b border-[#1e1e1e] bg-[#0d0d0d] p-2 font-mono text-xs text-slate-300 outline-none"
        />
      )}

      <div className="flex-1 overflow-auto border-b border-[#1e1e1e] bg-[#090909] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-bold text-slate-400">RESPONSE</span>
          {response && (
            <div className="flex gap-3 text-slate-400">
              <span>Status: <b className={response.ok ? 'text-emerald-400' : 'text-red-400'}>{response.status} {response.statusText}</b></span>
              <span>Time: <b className="text-emerald-400">{response.time}</b></span>
            </div>
          )}
        </div>
        <pre className="overflow-x-auto rounded bg-black/60 p-3 text-emerald-300">
          {response ? JSON.stringify(response.data || response, null, 2) : '// No response yet. Click "Send" to execute.'}
        </pre>
      </div>

      <div className="flex h-44 flex-col bg-[#050505]">
        <div className="flex items-center justify-between border-t border-b border-[#1e1e1e] bg-[#121212] px-3 py-1">
          <span className="font-bold text-slate-400">POSTIFYX CONSOLE</span>
          <button onClick={() => setLogs([])} className="text-[10px] text-slate-500 hover:text-red-400">Clear</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {logs.length === 0 ? (
            <span className="text-slate-600">// Live execution logs will appear here…</span>
          ) : (
            logs.map((log: LogEntry, idx: number) => (
              <div key={idx} className="flex gap-2">
                <span className="text-slate-600">[{log.time}]</span>
                <span className={
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                }>
                  {log.msg}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}