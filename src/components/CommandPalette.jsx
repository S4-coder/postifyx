'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { PROTOCOLS } from '@/lib/protocols';
import { PUBLIC_APIS, STREAM_EXAMPLES } from '@/lib/publicApis';
import { useRequestStore } from '@/store/useRequestStore';

/**
 * Subsequence match, the same idea as a fzf filter: every character of the query
 * must appear in order. `score` rewards a hit at a word boundary, so typing
 * `gt` prefers "GET Request" over "Target Header".
 */
function fuzzyMatch(needle, haystack) {
  if (!needle) return { score: 0, indices: [] };

  const target = haystack.toLowerCase();
  const query = needle.toLowerCase();

  const indices = [];
  let score = 0;
  let at = 0;
  let previous = -1;

  for (const char of query) {
    const found = target.indexOf(char, at);
    if (found === -1) return null;

    const isBoundary = found === 0 || /[\s/\-_.]/.test(target[found - 1]);
    score += isBoundary ? 3 : 1;
    // Consecutive characters are a stronger signal than scattered ones.
    if (previous === found - 1) score += 2;

    indices.push(found);
    previous = found;
    at = found + 1;
  }

  // Shorter haystacks win ties: "GET" should outrank "GET request history".
  return { score: score - haystack.length * 0.01, indices };
}

/**
 * Splits `text` into match / non-match runs so the query can be highlighted
 * without injecting markup into the string.
 *
 * @returns {Array<{ text: string, matched: boolean }>}
 */
function toSegments(text, indices) {
  if (!indices.length) return [{ text, matched: false }];

  const marked = new Set(indices);
  const segments = [];
  let run = '';
  let runMatched = marked.has(0);

  for (let i = 0; i < text.length; i += 1) {
    const matched = marked.has(i);
    if (matched !== runMatched) {
      segments.push({ text: run, matched: runMatched });
      run = '';
      runMatched = matched;
    }
    run += text[i];
  }

  if (run) segments.push({ text: run, matched: runMatched });
  return segments;
}

export default function CommandPalette({ open, onClose }) {
  const store = useRequestStore();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const commands = useMemo(() => {
    if (!open) return [];

    const items = [
      ...PROTOCOLS.map((p) => ({
        id: `protocol:${p.id}`,
        label: `Switch to ${p.label}`,
        hint: p.tagline,
        group: 'Protocol',
        run: () => store.setProtocol(p.id),
      })),
      { id: 'action:send', label: 'Send request', hint: 'Ctrl+Enter', group: 'Action', run: () => store.execute() },
      { id: 'tab:new', label: 'New request tab', group: 'Action', run: () => store.addTab() },
      { id: 'tab:close', label: 'Close current tab', group: 'Action', run: () => store.closeTab(store.activeTabId) },
      ...PUBLIC_APIS.map((api) => ({
        id: `api:${api.id}`,
        label: `Load ${api.name}`,
        hint: api.url,
        group: 'Public API',
        run: () =>
          store.addTab({
            title: api.name,
            protocol: 'REST',
            method: api.method,
            url: api.url,
            headers: (api.headers ?? []).map((h) => ({ ...h })),
          }),
      })),
      ...STREAM_EXAMPLES.map((stream) => ({
        id: `stream:${stream.id}`,
        label: `Open ${stream.name}`,
        hint: stream.url,
        group: 'Stream',
        run: () =>
          store.addTab({
            title: stream.name,
            protocol: stream.protocol,
            url: stream.url,
            headers: {},
          }),
      })),
      { id: 'action:clear-history', label: 'Clear history', group: 'Action', run: () => store.clearHistory() },
    ];

    if (!query) return items;

    return items
      .map((item) => {
        const match = fuzzyMatch(query, `${item.group} ${item.label}`);
        return match ? { ...item, ...match } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }, [open, query, store]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(commands.length - 1, 0)));
  }, [commands.length]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const choose = (item) => {
    if (!item) return;
    item.run();
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (commands.length ? (c + 1) % commands.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (commands.length ? (c - 1 + commands.length) % commands.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(commands[cursor]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="oc-panel w-[34rem] max-w-[92vw] overflow-hidden shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-3 py-2">
          <Search size={14} className="text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, protocols and public APIs…"
            spellCheck={false}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
          <kbd className="rounded bg-[#1a1a1a] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            Esc
          </kbd>
        </div>

        <ul ref={listRef} className="max-h-80 overflow-auto py-1">
          {commands.length === 0 ? (
            <li className="px-3 py-4 text-center text-[11px] text-slate-600">
              No match for “{query}”.
            </li>
          ) : (
            commands.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-active={index === cursor}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => choose(item)}
                  className={[
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left transition',
                    index === cursor ? 'bg-[#1a1a1a]' : '',
                  ].join(' ')}
                >
                  <span className="w-20 shrink-0 text-[10px] uppercase tracking-wide text-slate-600">
                    {item.group}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-slate-200">
                    {toSegments(item.label, item.indices ?? []).map((seg, i) =>
                      seg.matched ? (
                        <mark key={i} className="bg-transparent font-bold text-emerald-400">
                          {seg.text}
                        </mark>
                      ) : (
                        <span key={i}>{seg.text}</span>
                      ),
                    )}
                  </span>
                  {item.hint && (
                    <span className="max-w-[14rem] shrink-0 truncate font-mono text-[10px] text-slate-600">
                      {item.hint}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center gap-3 border-t border-[#1e1e1e] px-3 py-1.5 text-[10px] text-slate-600">
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span className="ml-auto">{commands.length} results</span>
        </div>
      </div>
    </div>
  );
}
