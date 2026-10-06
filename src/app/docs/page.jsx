import SiteShell from '@/components/SiteShell';
import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { PROTOCOLS } from '@/lib/protocols';

export const metadata = {
  title: 'Documentation — OpenClient',
  description:
    'Complete OpenClient guide: architecture, every feature, and step-by-step tests for REST, GraphQL, WebSocket, SSE and gRPC.',
};

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'protocols', label: 'Protocols' },
  { id: 'features', label: 'Features' },
  { id: 'testing', label: 'Testing guide' },
  { id: 'testing-rest', label: 'REST' },
  { id: 'testing-graphql', label: 'GraphQL' },
  { id: 'testing-auth', label: 'Authentication' },
  { id: 'testing-env', label: 'Environments' },
  { id: 'testing-streams', label: 'WebSocket & SSE' },
  { id: 'testing-grpc', label: 'gRPC' },
  { id: 'testing-extras', label: 'Snippets, share, history' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'structure', label: 'Project structure' },
  { id: 'security', label: 'Security model' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

function StepList({ steps }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-[10px] font-bold text-emerald-400">
            {i + 1}
          </span>
          <span className="text-[12px] leading-relaxed text-slate-300">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e1e1e]">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-[#1a1a1a] text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#1e1e1e]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 border-b border-[#1e1e1e] pb-2 text-xl font-bold text-slate-100">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Subsection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h3 className="mb-2 text-base font-semibold text-slate-100">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const P = ({ children }) => (
  <p className="text-[13px] leading-relaxed text-slate-400">{children}</p>
);

const QUICK_START = `# 1. Install dependencies
npm install

# 2. Start everything: UI (:3000) + CORS relay (:8787) + stream demos (:8788)
npm run dev:full

# 3. Open the app
# → http://localhost:3000  (landing)  → /app (workspace)

# Individual services (if you only need one):
npm run dev       # Next.js only, port 3000
npm run relay     # CORS relay, port 8787
npm run streams   # WS echo + SSE demo, port 8788

# Run the automated helper tests
npm test          # expected output: "all passing"

# Production static export (what the desktop webview loads)
npm run build     # outputs to out/

# Desktop app
npm run desktop:dev     # Tauri dev mode
npm run desktop:build   # platform installers`;

const GRAPHQL_QUERY = `POST https://countries.trevorblades.com/
Content-Type: application/json

{
  "query": "{ countries { code name } }"
}

# Expected: 200 with { "data": { "countries": [ ... ] } }`;

const GRPC_SETUP = `# 1. Write your proto file (api.proto)

# 2. Compile to a descriptor set — no codegen needed,
#    OpenClient reflects the messages dynamically
protoc --descriptor_set_out=api.bin api.proto

# 3. Base64-encode it
base64 -w0 api.bin        # macOS/Linux
certutil -encode api.bin api.b64 & type api.b64   # Windows

# 4. Paste the base64 string into the "Descriptor set"
#    field in the gRPC panel, then pick a service and
#    method from the dropdowns and press Call.`;

const STRUCTURE = `src/
  app/
    page.jsx          Landing: hero, benchmarks, protocol cards
    app/page.jsx      Core tabbed API workspace  ← the main app
    apis/page.jsx     Public API directory + "Run in App"
    download/page.jsx OS detection + installer links
    privacy/page.jsx  Privacy policy (route)
    terms/page.jsx    Terms & conditions (route)
    docs/page.jsx     This documentation
  components/         Workspace UI panels
  lib/
    tauri.js          Transport bridge: desktop → direct → relay
    streams.js        WebSocket / SSE / gRPC client wrappers
    protocols.js      Protocol metadata and display helpers
    publicApis.js     Curated, live-verified endpoints
    codeGen.js        cURL / Fetch / Python / Node snippets
    bodyFormats.js    JSON / HTML / Text / JS / XML body handling
    share.js          Fragment-based share links + secret redaction
    urlCheck.js       Scheme/URL validation with clear messages
    handOff.js        /apis → /app request staging (in-memory)
  store/useRequestStore.js   Zustand store (all workspace state)
server/
  proxy.mjs           CORS relay for browser mode (dev only)
  demo-streams.mjs    Local WebSocket echo + SSE endpoints
scripts/
  check-helpers.mjs   The "npm test" suite
src-tauri/            Rust core: http / ws / sse / grpc engines`;

export default function DocsPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex gap-10">
          {/* ── Left rail: table of contents ─────────────── */}
          <nav className="sticky top-20 hidden h-fit w-52 shrink-0 lg:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              On this page
            </p>
            <ul className="space-y-1 border-l border-[#1e1e1e]">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block border-l-2 border-transparent py-0.5 pl-3 text-[11px] text-slate-500 transition hover:border-emerald-500/50 hover:text-emerald-400"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Main content ─────────────────────────────── */}
          <div className="min-w-0 max-w-3xl flex-1 space-y-12">
            <header>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                v0.1.0 · MIT · Local-first
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
                OpenClient Documentation
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
                A local-first, zero-telemetry API client for REST, GraphQL,
                WebSocket, SSE and gRPC. This guide explains every feature,
                why each part exists, and how to test every API — step by
                step.
              </p>
            </header>

            {/* ── Overview ─────────────────────────────── */}
            <Section id="overview" title="Overview">
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

            {/* ── Quick start ──────────────────────────── */}
            <Section id="quick-start" title="Quick start">
              <P>
                <strong className="text-slate-200">Prerequisites:</strong> Node.js 20+.
                For the desktop app: Rust stable, plus Visual Studio Build Tools
                (Windows), <code className="text-slate-500">libwebkit2gtk-4.1-dev</code> (Linux)
                or Xcode command line tools (macOS).
              </P>
              <DocCodeBlock title="terminal" code={QUICK_START} />
              <P>
                The workspace lives at <code className="text-slate-500">/app</code>. To try
                streaming, keep <code className="text-slate-500">npm run streams</code> running
                and use <code className="text-slate-500">ws://localhost:8788/ws</code> or{' '}
                <code className="text-slate-500">http://localhost:8788/sse</code>.
              </P>
            </Section>

            {/* ── Architecture ─────────────────────────── */}
            <Section id="architecture" title="Architecture">
              <P>
                Two layers: a Next.js static-export frontend (React 19 + Tailwind +
                Zustand) and a Tauri 2 shell whose Rust core owns every socket.
                The frontend talks to the core over Tauri IPC.
              </P>
              <DocCodeBlock
                title="architecture"
                code={`┌──────────────────────────────────────────────┐
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
        direct fetch → CORS relay (server/proxy.mjs)`}
              />
              <P>
                <strong className="text-slate-200">Why each technology is used:</strong>
              </P>
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

            {/* ── Protocols ──────────────────────────── */}
            <Section id="protocols" title="Protocols">
              <P>
                Five protocols, one workspace. The rail on the left of the
                workspace switches transports; gRPC and streams bring their own UI.
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
                Browser limits are real and are <em>stated in the UI</em> (amber notice
                in the request bar) rather than papered over: gRPC needs trailer
                access that <code className="text-slate-500">fetch</code> does not expose,
                and <code className="text-slate-500">EventSource</code> cannot send custom headers.
              </P>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PROTOCOLS.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-semibold text-slate-100">{p.label}</h4>
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

            {/* ── Features ───────────────────────────── */}
            <Section id="features" title="Features">
              <P>The workspace, feature by feature:</P>
              <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-400">
                <li><strong className="text-slate-200">Request tabs</strong> — multiple requests side by side; double-click to rename, + to add, × to close. Persisted across reloads.</li>
                <li><strong className="text-slate-200">Headers</strong> — checkbox enable/disable, key-value rows. Disabled headers are dropped from the payload.</li>
                <li><strong className="text-slate-200">Body</strong> — five formats: JSON (re-indented and validated), HTML, Text, JavaScript, XML, with live byte/line stats.</li>
                <li><strong className="text-slate-200">Auth</strong> — none / Bearer token / Basic (username + password, custom header name). Folded into a real header by the payload builder, and redacted in snippets and share links.</li>
                <li><strong className="text-slate-200">Environments</strong> — <code className="text-slate-500">{'{{placeholder}}'}</code> interpolation in URL, headers and body.</li>
                <li><strong className="text-slate-200">Response inspector</strong> — status + status text, time (ms), size, headers list, and the body as raw text or an interactive JSON tree.</li>
                <li><strong className="text-slate-200">Right sidebar</strong> — toggled from the request-bar icons: History (real, in-memory), Share (live link), Code Snippet (cURL / Fetch / Python / Node.js).</li>
                <li><strong className="text-slate-200">Resizable response pane</strong> — drag the divider up or down; double-click resets; the height persists.</li>
                <li><strong className="text-slate-200">Command palette</strong> — Ctrl/Cmd+K, with curated public APIs and streaming examples.</li>
                <li><strong className="text-slate-200">Collections</strong> — save the current request into a named group; reopening one opens a new tab so the working tab is never overwritten.</li>
                <li><strong className="text-slate-200">Share links</strong> — the whole request is base64url-encoded into the URL <em>fragment</em> (fragments are never sent to a server); Authorization, X-Api-Key, Api-Key and Proxy-Authorization are redacted to YOUR_TOKEN before encoding.</li>
                <li><strong className="text-slate-200">History</strong> — newest first, in memory only, never written to disk.</li>
              </ul>
            </Section>

            {/* ── Testing guide ──────────────────────── */}
            <Section id="testing" title="Testing guide">
              <P>
                Every feature below can be verified in under two minutes.
                Start with the automated suite, then walk the manual checks
                in order.
              </P>
              <Subsection id="testing-auto" title="Automated tests">
                <DocCodeBlock title="terminal" code={`npm test`} />
                <P>
                  Asserts snippet generation (method, URL, shell quoting, secret
                  redaction, GET-omits-body, quote escaping) and body formatting
                  (five formats, JSON re-indent, invalid-JSON error, JavaScript
                  passthrough, XML line breaks, UTF-8 byte/line counts). Expected
                  output: <code className="text-emerald-400">all passing</code>.
                </P>
              </Subsection>

              <Subsection id="testing-rest" title="REST">
                <DataTable
                  columns={['Test', 'How', 'Expected result']}
                  rows={[
                    ['Basic GET', 'GET https://api.github.com/zen', '200, one line of text'],
                    ['JSON array', 'GET https://jsonplaceholder.typicode.com/todos?_limit=5', '200, JSON array of 5 todos'],
                    ['POST with body', 'POST https://jsonplaceholder.typicode.com/posts  ·  Body → JSON: {"title":"hi","body":"yo","userId":1}', '201, response echoes a new id'],
                    ['PUT / DELETE', 'PUT or DELETE on https://jsonplaceholder.typicode.com/posts/1', '200'],
                    ['Custom headers', 'GET https://httpbin.org/get with header X-Test: hello', 'Response JSON "headers" object contains X-Test: hello'],
                    ['Status codes', 'GET https://httpbin.org/status/418', "418 I'm a teapot"],
                    ['Redirects', 'GET https://httpbin.org/redirect-to?url=https://example.com', 'Follows through to 200'],
                    ['Slow response', 'GET https://httpbin.org/delay/3', '200 after ~3 s — watch the ms timer'],
                    ['Bad URL', 'Type not-a-url in the URL field', 'Inline error in the response panel, not a crash'],
                  ]}
                />
              </Subsection>

              <Subsection id="testing-graphql" title="GraphQL">
                <P>
                  GraphQL always sends POST. A public, key-free endpoint for
                  testing:
                </P>
                <DocCodeBlock title="request" code={GRAPHQL_QUERY} />
                <P>
                  For an authenticated test, use{' '}
                  <code className="text-slate-500">POST https://api.github.com/graphql</code>{' '}
                  with a Bearer token in the Auth panel.
                </P>
              </Subsection>

              <Subsection id="testing-auth" title="Authentication">
                <P>
                  Auth is configured in the <strong className="text-slate-200">Auth</strong> panel
                  (not typed into headers), so the payload builder folds it in and
                  snippets redact it.
                </P>
                <DataTable
                  columns={['Type', 'Target', 'Without auth', 'With auth']}
                  rows={[
                    ['Bearer', 'GET https://httpbin.org/bearer', '401', '200 — {"authenticated": true}'],
                    ['Basic', 'GET https://httpbin.org/basic-auth/user/passwd', '401', '200 — {"authenticated": true}'],
                  ]}
                />
              </Subsection>

              <Subsection id="testing-env" title="Environment variables">
                <StepList
                  steps={[
                    'Open Environments (Globe icon area) — the default "Local" environment defines base_url = http://localhost:3000.',
                    'Set the URL field to {{base_url}}/todos/1.',
                    'Send. The request actually goes to http://localhost:3000/todos/1 — start any local server first, or switch to the "Public APIs" environment and use {{base_url}}/… against api.publicapis.org.',
                  ]}
                />
              </Subsection>

              <Subsection id="testing-streams" title="WebSocket & SSE">
                <P>
                  Run <code className="text-slate-500">npm run streams</code> first — it
                  serves a local echo server on port 8788.
                </P>
                <StepList
                  steps={[
                    'Switch the protocol rail to WebSocket (Radio icon).',
                    'Enter ws://localhost:8788/ws and click Connect.',
                    'Type a frame in the composer and send it.',
                    'Expected: the echo appears in the same log — this confirms both directions work.',
                    'Switch to SSE (Rss icon), enter http://localhost:8788/sse, click Connect.',
                    'Expected: one "tick" event per second with a JSON payload, appended to the log. Disconnect stops the stream — switching protocols or closing the window always tears streams down, so no socket is ever leaked.',
                  ]}
                />
              </Subsection>

              <Subsection id="testing-grpc" title="gRPC">
                <P>
                  Desktop app only. OpenClient uses dynamic protobuf reflection, so
                  there is no codegen step — you compile a descriptor set once and
                  paste it in.
                </P>
                <DocCodeBlock title="terminal" code={GRPC_SETUP} />
                <P>
                  Expected: the service and method dropdowns populate from
                  reflection. Streaming methods are rejected with UNIMPLEMENTED
                  instead of silently hanging.
                </P>
              </Subsection>

              <Subsection id="testing-extras" title="Snippets, share links, history & layout">
                <StepList
                  steps={[
                    'Code snippets: right sidebar → Code icon → switch cURL / Fetch / Python / Node.js → Copy. Paste into a terminal, node or python — it must reproduce the same request, with secrets shown as YOUR_TOKEN.',
                    'Share links: open Share → Copy link → paste into a new tab. The workspace opens with that request staged in its own tab. Check the URL fragment: no secret header value appears anywhere in it.',
                    'History: send two or three requests, then open the History sidebar view — entries appear newest-first with method, status, URL and ms. Click one to reload it.',
                    'Collections: type a name and press Enter — the current request is saved. Clicking it opens in a new tab, so your working tab is never overwritten.',
                    'Layout: drag the response divider up or down, then double-click it to reset. Reload the page — the height is restored from storage.',
                  ]}
                />
              </Subsection>
            </Section>

            {/* ── Configuration ──────────────────────── */}
            <Section id="configuration" title="Configuration">
              <DataTable
                columns={['Key', 'Where', 'Meaning']}
                rows={[
                  ['openclient.workspace.v1', 'localStorage', 'Zustand persist: tabs, active tab, collections, environments'],
                  ['openclient.layout.response', 'localStorage', 'Response pane height in pixels'],
                  ['openclient.proxy', 'localStorage', 'Override the CORS relay URL (hosted deployments)'],
                  ['NEXT_PUBLIC_OPENCLIENT_PROXY', 'environment', 'Same override, at build time'],
                  ['ALLOW_HOSTS', 'relay environment', 'Comma-separated host allowlist — set this if you deploy the relay'],
                ]}
              />
              <P>
                <strong className="text-slate-200">Clearing state:</strong> dev tools →
                Application → Local Storage → delete the keys above, or run{' '}
                <code className="text-slate-500">localStorage.clear()</code> in the console.
              </P>
            </Section>

            {/* ── Structure ──────────────────────────── */}
            <Section id="structure" title="Project structure">
              <DocCodeBlock title="project" code={STRUCTURE} />
            </Section>

            {/* ── Security ───────────────────────────── */}
            <Section id="security" title="Security model">
              <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-400">
                <li><strong className="text-slate-200">Zero telemetry, zero accounts, zero cloud.</strong> Nothing leaves the machine except the requests you explicitly send.</li>
                <li><strong className="text-slate-200">Share links are fragment-only.</strong> The payload rides in the URL fragment (never transmitted to a server) and secret headers are redacted before encoding. Anyone you paste the link to can reconstruct the request, so treat it as sensitive.</li>
                <li><strong className="text-slate-200">The relay is development-only.</strong> It forwards to any host, which is a server-side request forgery primitive. A deployed instance must set ALLOW_HOSTS and sit behind authentication. The desktop app does not use the relay at all.</li>
                <li><strong className="text-slate-200">Minimal Tauri surface.</strong> Capabilities are limited to core:default — the app defines no plugin permissions.</li>
                <li><strong className="text-slate-200">Report vulnerabilities privately</strong> (see SECURITY.md) — never in a public issue.</li>
              </ul>
            </Section>

            {/* ── Troubleshooting ────────────────────── */}
            <Section id="troubleshooting" title="Troubleshooting">
              <DataTable
                columns={['Symptom', 'Cause', 'Fix']}
                rows={[
                  ['Cannot find module "./xxx.js"', 'Stale .next — dev and build shared the folder', 'Stop the dev server, delete .next, restart npm run dev'],
                  ['Request fails in a browser tab with CORS text', 'Host sends no Access-Control-Allow-Origin', 'Run npm run relay, or set openclient.proxy'],
                  ['gRPC panel is empty in the browser', 'Browsers cannot read HTTP/2 trailers', 'Use the desktop app'],
                  ['SSE custom headers are ignored', 'EventSource limitation', 'Use the desktop app'],
                  ['Hydration warning on load', 'Persisted state differs from the server render', 'Handled by design (skipHydration + rehydrate in an effect); restart the dev server if it repeats'],
                  ['Streaming does nothing', 'The demo server is not running', 'Run npm run streams and use ws://localhost:8788/ws or http://localhost:8788/sse'],
                ]}
              />
            </Section>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
