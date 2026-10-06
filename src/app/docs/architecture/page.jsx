import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { DataTable, P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Architecture — OpenClient Docs',
  description: 'The two layers of OpenClient and why each technology is used.',
};

const DIAGRAM = `┌──────────────────────────────────────────────┐
│  Tauri 2 desktop shell (Rust)                 │
│  http.rs · ws.rs · sse.rs · grpc.rs           │
│  Native sockets → no CORS, no trailer limits  │
└─────────────────────┬────────────────────────┘
                      │ Tauri IPC (invoke)
┌─────────────────────▼────────────────────────┐
│  Next.js 15 App Router · output: 'export'    │
│  React 19 + Tailwind + Zustand (persisted)   │
└─────────────────────┬────────────────────────┘
                      │ browser fallback chain
        direct fetch → CORS relay (server/proxy.mjs)`;

export default function ArchitecturePage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Architecture
      </h1>
      <Section title="Two layers">
        <P>
          A Next.js static-export frontend (React 19 + Tailwind +
          Zustand) and a Tauri 2 shell whose Rust core owns every
          socket. The frontend talks to the core over Tauri IPC.
        </P>
        <DocCodeBlock title="architecture" code={DIAGRAM} />
      </Section>
      <Section title="Why each technology is used">
        <DataTable
          columns={['Technology', 'Why it is used', 'Without it']}
          rows={[
            ['Tauri 2', 'Desktop shell; Rust owns the socket so requests originate natively', 'Browser CORS and HTTP/2 trailer limits return'],
            ['Next.js App Router', 'File-based routes; output:"export" produces static HTML the webview loads from file://', 'Nothing for Tauri to bundle'],
            ['React 19', 'UI components; "use client" marks interactive islands', '—'],
            ['Zustand + persist', 'Single workspace store; partialize keeps only config in localStorage', 'No saved tabs/collections across reloads'],
            ['Tailwind CSS', 'Utility-first dark theme, no design tokens to maintain', '—'],
            ['reqwest + tokio', 'Async HTTP with a pooled client (network.rs)', 'Per-request connection setup, slower round trips'],
            ['tokio-tungstenite', 'WebSocket client; frames forwarded to the UI as Tauri events', 'No desktop WebSocket'],
            ['tonic + prost-reflect', 'HTTP/2 gRPC with dynamic protobuf reflection', 'Would need protoc codegen per API'],
            ['server/proxy.mjs', 'Node relay used only when the browser blocks a direct fetch', 'Browser mode limited to CORS-friendly hosts'],
          ]}
        />
      </Section>
    </>
  );
}
