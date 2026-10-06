'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { useRequestStore } from '@/store/useRequestStore';

/**
 * Request tab strip.
 *
 * Renaming is inline rather than a dialog: the title is short, and a double
 * click getting you straight into the field keeps the flow tight. The input
 * commits on Enter or blur and reverts on Escape, so a stray click never leaves
 * a half-typed name behind.
 */
export default function TabStrip({ onNewTab }) {
  const tabs = useRequestStore((s) => s.tabs);
  const activeTabId = useRequestStore((s) => s.activeTabId);
  const setActiveTab = useRequestStore((s) => s.setActiveTab);
  const closeTab = useRequestStore((s) => s.closeTab);
  const renameTab = useRequestStore((s) => s.renameTab);

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const commit = () => {
    if (editingId) renameTab(editingId, draft.trim() || 'Untitled request');
    setEditingId(null);
  };

  return (
    <div className="flex h-9 shrink-0 items-stretch gap-0.5 overflow-x-auto whitespace-nowrap border-b border-[#1e1e1e] bg-[#121212] px-1">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onDoubleClick={() => {
              setEditingId(tab.id);
              setDraft(tab.title);
            }}
            title={`${tab.protocol} · ${tab.url || tab.title}`}
            className={[
              'group flex min-w-[9rem] max-w-[16rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-t border-t-2 px-2.5 text-[11px] transition',
              active
                ? 'border-emerald-500 bg-[#1e1e1e] text-slate-100'
                : 'border-transparent text-slate-500 hover:bg-[#1a1a1a] hover:text-slate-300',
            ].join(' ')}
          >
            <span className="shrink-0 font-bold text-emerald-400">{tab.protocol}</span>

            {editingId === tab.id ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="min-w-0 flex-1 rounded border border-emerald-500 bg-[#0d0d0d] px-1 py-0.5 text-[11px] text-slate-100 focus:outline-none"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">{tab.title}</span>
            )}

            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="shrink-0 rounded p-0.5 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNewTab}
        title="New request tab"
        className="shrink-0 self-center rounded px-2 py-1 text-sm text-slate-600 transition hover:bg-[#1a1a1a] hover:text-emerald-400"
      >
        +
      </button>
    </div>
  );
}
