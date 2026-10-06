import { DataTable, P, Section } from '@/components/docs/DocWidgets';
import { PROTOCOLS } from '@/lib/protocols';

export const metadata = {
  title: 'Protocols — PostifyX Docs',
  description: 'REST, GraphQL, WebSocket, SSE and gRPC — how each works in the browser tab and the desktop app.',
};

export default function ProtocolsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Protocols
      </h1>
      <Section title="Five protocols, one workspace">
        <P>
          The rail on the left of the workspace switches transports;
          gRPC and streams bring their own UI.
        </P>
        <DataTable
          columns={['Protocol', 'Browser tab', 'Desktop app']}
          rows={[
            ['REST', 'direct fetch, else relay', 'native socket (http.rs)'],
            ['GraphQL', 'same as REST (always POST)', 'native socket'],
            ['WebSocket', 'native WebSocket', 'Rust-owned socket, frames as Tauri events'],
            ['SSE', 'native EventSource (no custom headers)', 'Rust-owned stream, WHATWG-spec parser'],
            ['gRPC', 'not possible — browsers cannot read HTTP/2 trailers', 'tonic + dynamic reflection'],
          ]}
        />
        <P>
          Browser limits are real and are <em>stated in the UI</em> (amber
          notice in the request bar) rather than papered over: gRPC needs
          trailer access that <code className="text-slate-500">fetch</code>{' '}
          does not expose, and{' '}
          <code className="text-slate-500">EventSource</code> cannot send
          custom headers.
        </P>
      </Section>
      <Section title="Protocol reference">
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {PROTOCOLS.map((p) => (
            <article
              key={p.id}
              className="rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-slate-100">{p.label}</h3>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${
                    p.implemented
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-[#2a2a2a] bg-[#121212] text-slate-500'
                  }`}
                >
                  {p.implemented ? 'Available' : 'In progress'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-400/80">{p.tagline}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{p.description}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
