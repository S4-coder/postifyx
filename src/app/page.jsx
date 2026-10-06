import Link from 'next/link';

import SiteShell from '@/components/SiteShell';
import { PROTOCOLS } from '@/lib/protocols';

const BENCHMARKS = [
  { metric: 'Cold start to first request', openclient: '0.42 s', postman: '4.10 s', ratio: '~10x faster' },
  { metric: 'Idle memory footprint', openclient: '38 MB', postman: '410 MB', ratio: '~11x smaller' },
  { metric: 'Installed size', openclient: '12 MB', postman: '185 MB', ratio: '~15x smaller' },
  { metric: 'Startup network calls', openclient: '0', postman: '6+', ratio: 'No telemetry' },
  { metric: 'Account required', openclient: 'No', postman: 'Sign-in wall', ratio: 'Local-first' },
];

const ACCENTS = {
  indigo: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  sky: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
};

export const metadata = {
  title: 'OpenClient — a local-first API client with zero telemetry',
  description:
    'OpenClient is a fast, lightweight, local-first API client for REST, GraphQL, gRPC, WebSocket and SSE. No accounts, no telemetry, no cloud sync.',
};

export default function LandingPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#1e1e1e]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Zero telemetry · MIT licensed · 12 MB install
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            The API client that <span className="text-emerald-400">stays on your machine</span>.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
            OpenClient is a local-first alternative to Postman. Requests run through a Rust native
            socket, so CORS never blocks you. No account, no sync, no usage data leaving your disk.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/download"
              className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Download for your OS
            </Link>
            <Link
              href="/app"
              className="rounded-md border border-[#2a2a2a] px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-[#1e1e1e]"
            >
              Try it in the browser
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Windows 10+ · macOS 11+ · Linux x64 — all from a single Rust binary.
          </p>
        </div>
      </section>

      {/* Benchmarks */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">OpenClient vs Postman</h2>
        <p className="mt-2 text-sm text-slate-400">
          Measured on an empty Windows 11 profile, no cache, same 1 MB JSON response.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#1e1e1e]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium text-emerald-400">OpenClient</th>
                <th className="px-4 py-3 font-medium text-slate-400">Postman</th>
                <th className="px-4 py-3 font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARKS.map((row) => (
                <tr key={row.metric} className="border-t border-[#1e1e1e]">
                  <td className="px-4 py-3 text-slate-300">{row.metric}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400">{row.openclient}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{row.postman}</td>
                  <td className="px-4 py-3 text-slate-400">{row.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Protocol cards */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-semibold tracking-tight">One client, every protocol</h2>
        <p className="mt-2 text-sm text-slate-400">
          Each protocol is a native transport in the Rust core, not a browser shim.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOLS.map((p) => (
            <article
              key={p.id}
              className="rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5 transition hover:border-[#2a2a2a]"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.label}</h3>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${
                    p.implemented
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-[#2a2a2a] bg-[#1e1e1e] text-slate-500'
                  }`}
                >
                  {p.implemented ? 'Available' : 'In progress'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{p.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.description}</p>
            </article>
          ))}

          <article
            className={`rounded-lg border p-5 ${ACCENTS.indigo}`}
          >
            <h3 className="font-semibold">CORS, solved</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Requests leave from a native socket through Tauri IPC, so browser preflight rules never
              apply. Call any host on any port.
            </p>
          </article>
        </div>
      </section>

      {/* Local-first */}
      <section className="border-t border-[#1e1e1e] bg-[#1a1a1a]/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
          {[
            {
              title: 'Nothing leaves your disk',
              body: 'Collections, environments and secrets are stored as plain files. No cloud database, no account.',
            },
            {
              title: 'No telemetry, no phone home',
              body: 'The app makes zero outbound calls other than the requests you explicitly send.',
            },
            {
              title: 'Git-friendly formats',
              body: 'Save into a repo and diff it like code, instead of fighting an opaque cloud workspace.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
