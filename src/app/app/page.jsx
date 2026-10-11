'use client';

import { useCallback, useEffect, useState } from 'react';

import { Check, Copy, Search } from 'lucide-react';

import LeftSidebar from '@/app/app/LeftSidebar';
import { EnvironmentManager } from '@/components/TopBar';
import RequestBar from '@/components/RequestBar';
import TabStrip from '@/components/TabStrip';
import HeadersEditor from '@/components/HeadersEditor';
import BodyEditor from '@/components/BodyEditor';
import AuthManager from '@/components/AuthManager';
import ResponseInspector from '@/components/ResponseInspector';
import StreamConsole from '@/components/StreamConsole';
import GrpcPanel from '@/components/GrpcPanel';
import GrpcResponse from '@/components/GrpcResponse';
import CommandPalette from '@/components/CommandPalette';
import ResizablePane from '@/components/Resizable';
import { useRequestStore } from '@/store/useRequestStore';
import { getProtocol, isStreaming } from '@/lib/protocols';
import { generateSnippets, SNIPPET_LANGUAGES } from '@/lib/codeGen';
import { takeStagedRequest } from '@/lib/handOff';
import { takeSharedRequest } from '@/lib/share';

const REQUEST_TABS = [
  { id: 'headers', label: 'Headers', Component: HeadersEditor },
  { id: 'body', label: 'Body', Component: BodyEditor },
  { id: 'auth', label: 'Auth', Component: AuthManager },
];

const SIDE_PANEL_TITLES = {
  share: 'Share',
  code: 'Code Snippet',
};

function SidePanelView({ panel }) {
  const buildPayload = useRequestStore((s) => s.buildPayload);
  const method = useRequestStore((s) => s.method);
  const url = useRequestStore((s) => s.url);
  const headers = useRequestStore((s) => s.headers);
  const body = useRequestStore((s) => s.body);
  const bodyFormat = useRequestStore((s) => s.bodyFormat);
  const auth = useRequestStore((s) => s.auth);
  const activeEnvId = useRequestStore((s) => s.activeEnvId);
  const environments = useRequestStore((s) => s.environments);
  const [language, setLanguage] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [snippets, setSnippets] = useState(null);

  useEffect(() => {
    try {
      setSnippets(generateSnippets(buildPayload()));
    } catch {
      setSnippets(null);
    }
  }, [buildPayload, url, method, headers, body, bodyFormat, auth, activeEnvId, environments]);

  if (panel === 'share') {
    return (
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <p className="text-slate-400 text-[11px] mb-2">URL Fragment containing request details:</p>
        <input
          readOnly
          value={url}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] p-2 rounded text-[11px] font-mono text-slate-300 focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
      <div className="flex gap-1.5 mb-3">
        {SNIPPET_LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => setLanguage(lang.id)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              language === lang.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1a1a1a] text-slate-400'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {snippets?.[language] ? (
        <div className="relative bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded font-mono text-[11px] text-emerald-300 overflow-x-auto">
          <pre>{snippets[language]}</pre>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(snippets[language]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute top-2 right-2 p-1.5 rounded bg-[#1f1f1f] hover:bg-[#2a2a2a] text-slate-300"
            aria-label="Copy snippet"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      ) : (
        <p className="text-[10px] text-slate-700">Enter a URL to generate code.</p>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  const protocol = useRequestStore((s) => s.protocol);
  const execute = useRequestStore((s) => s.execute);
  const disconnectStream = useRequestStore((s) => s.disconnectStream);
  const addTab = useRequestStore((s) => s.addTab);
  const [tab, setTab] = useState('headers');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('collections');
  const [sidePanel, setSidePanel] = useState(null);

  const active = REQUEST_TABS.find((t) => t.id === tab) ?? REQUEST_TABS[0];
  const ActiveComponent = active.Component;
  const activeProtocol = getProtocol(protocol);
  const streaming = isStreaming(protocol);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  const toggleSidePanel = useCallback((panel) => {
    setSidePanel((prev) => (prev === panel ? null : panel));
  }, []);

  useEffect(() => {
    useRequestStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const staged = takeStagedRequest();
    if (staged) useRequestStore.getState().applyStagedRequest(staged);
  }, []);

  useEffect(() => {
    const shared = takeSharedRequest();
    if (shared) addTab({ title: 'Shared request', ...shared });
  }, [addTab]);

  useEffect(() => {
    if (!streaming) disconnectStream();
  }, [protocol, streaming, disconnectStream]);

  useEffect(() => () => disconnectStream(), [disconnectStream]);

  const leftPanel = streaming ? (
    <StreamConsole />
  ) : protocol === 'GRPC' ? (
    <GrpcPanel />
  ) : (
    <div className="hidden md:flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b border-[#1e1e1e] px-2">
        {REQUEST_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={['oc-tab', tab === t.id ? 'oc-tab-active' : ''].filter(Boolean).join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <ActiveComponent />
      </div>
    </div>
  );

  const rightPanel = streaming ? (
    <div className="flex h-full items-center justify-center p-6">
      <p className="max-w-xs text-center text-[11px] leading-relaxed text-slate-600">
        {protocol === 'WS'
          ? 'A WebSocket is bidirectional, so incoming and outgoing frames share one log on the left.'
          : 'Server-sent events are one-directional, so every event lands in the log on the left.'}
      </p>
    </div>
  ) : protocol === 'GRPC' ? (
    <GrpcResponse />
  ) : (
    <ResponseInspector />
  );

  return (
    <div
      className="hidden md:flex h-dvh w-full overflow-hidden bg-[#0d0d0d] text-slate-300"
      suppressHydrationWarning
    >
      <LeftSidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-[#1e1e1e] bg-[#121212] px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-semibold text-slate-100">
              {activeProtocol.label}
            </span>
            <span className="text-slate-700">/</span>
            <span className="truncate text-[11px] text-slate-500">{activeProtocol.tagline}</span>
          </div>

          <button
            type="button"
            onClick={openPalette}
            className="flex max-w-[60%] items-center gap-2 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-1 text-slate-500 transition hover:border-[#3a3a3a] hover:text-slate-300"
          >
            <Search size={12} />
            <span className="flex-1 text-left text-[11px]">Search and commands…</span>
            <kbd className="rounded bg-[#262626] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              Ctrl K
            </kbd>
          </button>

          <EnvironmentManager />
        </header>

        <TabStrip onNewTab={() => addTab()} />

        <RequestBar activeSidePanel={sidePanel} onToggleSidePanel={toggleSidePanel} />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#121212] overflow-x-hidden">
          {leftPanel}
        </section>

        <ResizablePane
          axis="y"
          initial={300}
          min={140}
          max={1400}
          storageKey="PostifyX.layout.response"
          className="shrink-0"
          paneClassName="border-t border-[#1e1e1e]"
        >
          {rightPanel}
        </ResizablePane>

        {!streaming && protocol !== 'GRPC' && (
          <p className="shrink-0 border-t border-[#1e1e1e] bg-[#121212] px-3 py-1 text-[10px] text-slate-600">
            <button type="button" onClick={execute} className="hover:text-emerald-400">
              Tip: press ⌘/Ctrl + Enter to send.
            </button>
          </p>
        )}
      </div>

      {sidePanel && (
        <aside className="hidden w-60 shrink-0 flex-col border-l border-[#1e1e1e] bg-[#121212] lg:flex">
          <div className="flex h-10 shrink-0 items-center justify-between gap-1.5 border-b border-[#1e1e1e] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {SIDE_PANEL_TITLES[sidePanel]}
            </span>
            <button
              type="button"
              onClick={() => setSidePanel(null)}
              aria-label="Close panel"
              className="text-slate-600 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <SidePanelView panel={sidePanel} />
        </aside>
      )}

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
