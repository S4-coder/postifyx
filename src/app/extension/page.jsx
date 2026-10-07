import Link from 'next/link';

import SiteShell from '@/components/SiteShell';

export const metadata = {
  title: 'PostifyX VS Code Extension',
  description:
    'Open the PostifyX API workspace directly inside VS Code — test REST, GraphQL, gRPC, WebSocket and SSE with a built-in console terminal.',
};

export default function ExtensionPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          VS Code Extension
        </span>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          PostifyX for VS Code
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-400">
          Open a full API workspace directly inside your editor — no browser tab, no CORS,
          no context switching. The extension launches a single-panel workspace with a request
          runner and a live console terminal.
        </p>

        {/* Install card */}
        <div className="mt-8 rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-6">
          <h2 className="text-lg font-semibold">Install</h2>
          <p className="mt-1 text-sm text-slate-400">
            Download the <code className="font-mono text-emerald-300">.vsix</code> package and
            install it from the VS Code command palette.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/extension/postifyx-0.1.0.vsix"
              download
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              ⬇ Download postifyx-0.1.0.vsix
            </a>
            <div className="flex items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-2.5 font-mono text-xs text-slate-400">
              Ctrl+Shift+P → Open PostifyX Workspace
            </div>
          </div>

          <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-slate-300">
            <li>Press <kbd className="rounded bg-[#2a2a2a] px-1">Ctrl+Shift+P</kbd> and choose <b>Install from VSIX…</b></li>
            <li>Select <code className="font-mono text-emerald-300">extension/postifyx-0.1.0.vsix</code></li>
            <li>Run <b>Open PostifyX Workspace</b> from the command palette</li>
          </ol>
        </div>

        {/* Features */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold">What you get</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Single-panel workspace',
                body: 'No split-screen clutter — request bar, body editor, response viewer and terminal in one compact panel.',
              },
              {
                title: 'Live console terminal',
                body: 'Every request logs its method, URL, status code and round-trip time with millisecond precision.',
              },
              {
                title: 'REST, GraphQL, gRPC, WebSocket, SSE',
                body: 'All five protocols are handled by the same Rust core that powers the desktop app.',
              },
              {
                title: 'Zero telemetry',
                body: 'The extension makes no outbound calls. Your requests and data never leave your machine.',
              },
            ].map((f) => (
              <article key={f.title} className="rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="mt-12 rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5 text-sm text-slate-400">
          <h2 className="font-semibold text-slate-200">Open source</h2>
          <p className="mt-2">
            The extension source lives in the <code className="font-mono text-emerald-300">extension/</code>{' '}
            folder of this repository. Build your own with{' '}
            <code className="font-mono text-emerald-300">cd extension &amp;&amp; npm run compile</code>.
          </p>
        </div>

        <div className="mt-8 text-sm text-slate-400">
          <Link href="/" className="text-emerald-400 hover:underline">← Back to PostifyX</Link>
        </div>
      </div>
    </SiteShell>
  );
}