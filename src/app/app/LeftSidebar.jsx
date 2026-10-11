'use client';

import { ChevronDown, Clock, Folder, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ProtocolSwitcher } from '@/components/TopBar';
import { useRequestStore } from '@/store/useRequestStore';
import { METHOD_COLOR } from '@/lib/protocols';

const NAV_ITEMS = [
  { id: 'collections', label: 'Collections', icon: Folder },
  { id: 'history', label: 'History', icon: Clock },
];

function CollectionsView() {
  const collections = useRequestStore((s) => s.collections);
  const openFromCollection = useRequestStore((s) => s.openFromCollection);
  const deleteFromCollection = useRequestStore((s) => s.deleteFromCollection);
  const deleteCollection = useRequestStore((s) => s.deleteCollection);
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  if (collections.length === 0) {
    return (
      <div className="p-3 text-[11px] text-slate-600">
        <p>No collections yet.</p>
        <p className="mt-1">Save requests to organize them into collections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-1">
      {collections.map((collection) => {
        const open = expanded[collection.id] ?? true;
        return (
          <div key={collection.id} className="space-y-0.5">
            <div className="flex items-center justify-between rounded px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-[#1a1a1a]">
              <button
                type="button"
                onClick={() => toggle(collection.id)}
                className="flex flex-1 items-center gap-1 text-left"
              >
                <ChevronDown size={10} className={`transition-transform ${open ? '' : 'rotate-180'}`} />
                <Folder size={12} className="text-slate-500" />
                <span className="truncate">{collection.name}</span>
              </button>
              <button
                type="button"
                onClick={() => deleteCollection(collection.id)}
                className="text-slate-600 hover:text-rose-400"
                title={`Delete ${collection.name}`}
              >
                <Trash2 size={11} />
              </button>
            </div>

            {open && (
              <div className="ml-4 space-y-0.5">
                {collection.requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => openFromCollection(collection.id, request.id)}
                    className="flex w-full flex-col gap-0.5 rounded px-2 py-1 text-left text-[11px] text-slate-400 hover:bg-[#1a1a1a] hover:text-slate-200"
                    title={request.name}
                  >
                    <span className="truncate">{request.name}</span>
                    <span className="flex items-center gap-1">
                      <span className="font-mono font-bold">{request.method}</span>
                      <span className="truncate text-slate-600">{request.url}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistoryRail() {
  const history = useRequestStore((s) => s.history);
  const loadFromHistory = useRequestStore((s) => s.loadFromHistory);
  const clearHistory = useRequestStore((s) => s.clearHistory);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <Clock size={11} />
          History
        </span>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-[10px] text-slate-600 hover:text-rose-400"
          >
            Clear
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {history.length === 0 ? (
          <p className="px-3 pb-3 text-[11px] leading-relaxed text-slate-600">
            Requests you send are listed here. History lives in memory only and is never written to
            disk or sent anywhere.
          </p>
        ) : (
          history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => loadFromHistory(entry.id)}
              className="flex w-full flex-col gap-0.5 border-b border-[#1a1a1a] px-3 py-1.5 text-left hover:bg-[#1a1a1a]"
            >
              <span className="flex items-center gap-2 text-[11px]">
                <span className={`font-mono font-bold ${METHOD_COLOR[entry.method] ?? 'text-slate-400'}`}>
                  {entry.method}
                </span>
                <span className="text-slate-600">{entry.time_ms} ms</span>
              </span>
              <span className="truncate font-mono text-[10px] text-slate-500" title={entry.url}>
                {entry.url}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function LeftSidebar({ activeNav, setActiveNav }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-[#1e1e1e] bg-[#121212] md:flex">
      <div className="flex flex-col items-center gap-2 border-b border-[#1e1e1e] py-3">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
          title="PostifyX"
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
            <path d="M12 2L2 7v10c0 5 4.03 9.24 9 9.83 4.97-.59 9-4.83 9-9.83V7l-9-5z" />
          </svg>
        </span>
        <ProtocolSwitcher />
      </div>

      <nav className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={[
                'flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition',
                isActive
                  ? 'border-r-2 border-emerald-400 bg-[#1a1a1a] text-emerald-400'
                  : 'text-slate-500 hover:bg-[#1a1a1a] hover:text-slate-300',
              ].join(' ')}
              title={item.label}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-auto">
        {activeNav === 'collections' ? <CollectionsView /> : <HistoryRail />}
      </div>
    </aside>
  );
}
