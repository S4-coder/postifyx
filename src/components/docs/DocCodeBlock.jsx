'use client';

import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export default function DocCodeBlock({ title, code }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <Terminal size={11} />
          {title}
        </span>
        <button
          type="button"
          onClick={() => {
            try {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard needs a secure context; the text stays selectable */
            }
          }}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
        {code}
      </pre>
    </div>
  );
}
