import Link from 'next/link';
import { P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Overview — OpenClient Docs',
  description:
    'OpenClient is a local-first, zero-telemetry API client for REST, GraphQL, WebSocket, SSE and gRPC.',
};

const GUIDE_INDEX = [
  { href: '/docs/quick-start', label: 'Quick start', desc: 'Install and run everything in two minutes' },
  { href: '/docs/architecture', label: 'Architecture', desc: 'The two layers and why each technology is used' },
  { href: '/docs/protocols', label: 'Protocols', desc: 'REST, GraphQL, WebSocket, SSE and gRPC compared' },
  { href: '/docs/features', label: 'Features', desc: 'Every workspace feature, listed' },
  { href: '/docs/testing', label: 'Testing guide', desc: 'Verify every feature with public, key-free endpoints' },
  { href: '/docs/configuration', label: 'Configuration', desc: 'Storage keys and environment variables' },
  { href: '/docs/structure', label: 'Project structure', desc: 'What lives where in the source tree' },
  { href: '/docs/security', label: 'Security model', desc: 'Zero telemetry, fragment-only share links, relay risks' },
  { href: '/docs/troubleshooting', label: 'Troubleshooting', desc: 'Common symptoms and their fixes' },
];

export default function DocsOverviewPage() {
  return (
    <>
      <header>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          v0.1.0 · MIT · Local-first
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
          OpenClient Documentation
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400">
          A local-first, zero-telemetry API client for REST, GraphQL,
          WebSocket, SSE and gRPC. This guide explains every feature,
          why each part exists, and how to test every API — step by
          step.
        </p>
      </header>

      <Section title="Overview">
        <P>
          OpenClient is an alternative to Postman with one rule:{' '}
          <strong className="text-slate-200">nothing leaves your machine</strong>.
          There is no account, no cloud sync, and no telemetry. Requests
          run from a Rust native socket in the desktop app, so browser
          CORS restrictions never apply.
        </P>
        <P>What you can do with it:</P>
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-slate-400">
          <li>Send and inspect REST and GraphQL requests with full control over headers, body and auth.</li>
          <li>Work with live connections: WebSocket (bidirectional) and Server-Sent Events.</li>
          <li>Call gRPC services with dynamic protobuf reflection — no <code className="text-slate-500">protoc</code> codegen step.</li>
          <li>Organize work into tabs and collections, and reuse requests with environment variables.</li>
          <li>Generate ready-to-run code in cURL, Fetch, Python and Node.js.</li>
        </ul>
      </Section>

      <Section title="Guide index">
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_INDEX.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-4 transition hover:border-emerald-500/40"
            >
              <h3 className="text-[13px] font-semibold text-slate-100 group-hover:text-emerald-300">
                {item.label}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
