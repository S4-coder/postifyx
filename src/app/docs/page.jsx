import Link from 'next/link';
import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { DataTable, P, Section, StepList, Subsection } from '@/components/docs/DocWidgets';
import { PROTOCOLS } from '@/lib/protocols';

export const metadata = {
  title: 'Documentation — PostifyX Docs',
  description:
    'Complete PostifyX documentation: quick start, architecture, protocols, testing guide, and more.',
};

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

const GRAPHQL_QUERY = `POST https://countries.trevorblades.com/
Content-Type: application/json

{
  "query": "{ countries { code name } }"
}

# Expected: 200 with { "data": { "countries": [ ... ] } }`;

const GRPC_SETUP = `# 1. Write your proto file (api.proto)

# 2. Compile to a descriptor set — no codegen needed,
#    PostifyX reflects the messages dynamically
protoc --descriptor_set_out=api.bin api.proto

# 3. Base64-encode it
base64 -w0 api.bin        # macOS/Linux
certutil -encode api.bin api.b64 & type api.b64   # Windows

# 4. Paste the base64 string into the "Descriptor set"
#    field in the gRPC panel, then pick a service and
# method from the dropdowns and press Call.`;

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
    <>
      <header>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          v0.1.0 · MIT · Local-first
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
          PostifyX Documentation
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
          PostifyX is an alternative to Postman with one rule:{' '}
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
        <P className="mt-4">
          This documentation covers: Quick Start, VS Code Extension, Architecture,
          Protocols, Features, Testing (REST, GraphQL, Auth, Environments, WebSocket & SSE,
          gRPC, Extras), Configuration, Project Structure, Security, and Troubleshooting.
          Use the table below to jump to any section.
        </P>
      </Section>

      <Section title="Quick start" id="quick-start">
        <Subsection title="Prerequisites">
          <P>
            <strong className="text-slate-200">Required:</strong> Node.js 20+.
          </P>
          <P>
            <strong className="text-slate-200">For the desktop app:</strong> Rust
            stable, plus Visual Studio Build Tools (Windows),{' '}
            <code className="text-slate-500">libwebkit2gtk-4.1-dev</code> (Linux)
            or Xcode command line tools (macOS).
          </P>
        </Subsection>
        <Subsection title="Install and run">
          <DocCodeBlock title="terminal" code={QUICK_START} />
          <P>
            The workspace lives at <code className="text-slate-500">/app</code>. To
            try streaming, keep <code className="text-slate-500">npm run streams</code>{' '}
            running and use <code className="text-slate-500">ws://localhost:8788/ws</code>{' '}
            or <code className="text-slate-500">http://localhost:8788/sse</code>.
          </P>
        </Subsection>
      </Section>

      <Section title="VS Code extension" id="vscode">
        <StepList
          steps={[
            'Download postifyx-0.1.0.vsix from the extension page or the releases tab.',
            'Open VS Code and press Ctrl+Shift+P.',
            'Choose "Install from VSIX…" and select the downloaded file.',
            'Run the command palette again and choose "Open PostifyX Workspace".',
          ]}
        />
        <Subsection title="What opens">
          <P>
            The workspace is a single panel with three zones:
          </P>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-400">
            <li><b className="text-slate-200">Request bar</b> — method selector, URL input and a Send button.</li>
            <li><b className="text-slate-200">Body editor</b> — visible only for POST, PUT and PATCH.</li>
            <li><b className="text-slate-200">Response viewer</b> — status, round-trip time and JSON body.</li>
            <li><b className="text-slate-200">Console terminal</b> — live execution logs with timestamps.</li>
          </ul>
        </Subsection>
        <Subsection title="Console terminal">
          <P>
            Every request you send writes a log line to the console terminal:
          </P>
          <pre className="overflow-x-auto rounded-lg border border-[#1e1e1e] bg-[#0d0d0a] p-3 font-mono text-[11px] text-emerald-300">
{`[14:02:01] >>> GET https://jsonplaceholder.typicode.com/todos/1
[14:02:01] Status: 200 OK | 128.45 ms
[14:02:32] >>> POST https://example.com/api
[14:02:32] Status: 400 Bad Request | 41.20 ms`}
          </pre>
          <P>
            Click <b>Clear</b> in the terminal header to wipe the log. Lines are colour-coded:
            blue for requests, green for success, red for errors.
          </P>
        </Subsection>
        <Subsection title="Building from source">
          <pre className="overflow-x-auto rounded-lg border border-[#1e1e1e] bg-[#0d0d0a] p-3 font-mono text-[11px] text-emerald-300">
{`cd extension
npm install
npm run compile
npx vsce package`}
          </pre>
          <P>
            This produces <code className="font-mono text-emerald-300">postifyx-0.1.0.vsix</code> in the
            extension folder, ready to install.
          </P>
        </Subsection>
      </Section>

      <Section title="Architecture" id="architecture">
        <Subsection title="Two layers">
          <P>
            A Next.js static-export frontend (React 19 + Tailwind +
            Zustand) and a Tauri 2 shell whose Rust core owns every
            socket. The frontend talks to the core over Tauri IPC.
          </P>
          <DocCodeBlock title="architecture" code={DIAGRAM} />
        </Subsection>
        <Subsection title="Why each technology is used">
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
        </Subsection>
      </Section>

      <Section title="Protocols" id="protocols">
        <Subsection title="Five protocols, one workspace">
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
        </Subsection>
        <Subsection title="Protocol reference">
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
        </Subsection>
      </Section>

      <Section title="Features" id="features">
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

      <Section title="Testing guide" id="testing-guide">
        <Subsection title="Overview">
          <P>
            Every feature can be verified in under two minutes.
            Start with the automated suite, then walk the manual
            checks — each protocol has its own page:
          </P>
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-slate-400">
            <li><Link href="#testing-rest" className="text-emerald-400 hover:underline">REST</Link> — basic GET, JSON, POST with body, headers, status codes, redirects</li>
            <li><Link href="#testing-graphql" className="text-emerald-400 hover:underline">GraphQL</Link> — a public key-free endpoint</li>
            <li><Link href="#testing-auth" className="text-emerald-400 hover:underline">Authentication</Link> — Bearer and Basic against httpbin</li>
            <li><Link href="#testing-environments" className="text-emerald-400 hover:underline">Environments</Link> — {'{{placeholder}}'} interpolation</li>
            <li><Link href="#testing-streams" className="text-emerald-400 hover:underline">WebSocket &amp; SSE</Link> — local echo server</li>
            <li><Link href="#testing-grpc" className="text-emerald-400 hover:underline">gRPC</Link> — descriptor set setup (desktop only)</li>
            <li><Link href="#testing-extras" className="text-emerald-400 hover:underline">Snippets, share links, history &amp; layout</Link></li>
          </ul>
        </Subsection>
        <Subsection title="Automated tests">
          <DocCodeBlock title="terminal" code={`npm test`} />
          <P>
            Asserts snippet generation (method, URL, shell quoting, secret
            redaction, GET-omits-body, quote escaping) and body formatting
            (five formats, JSON re-indent, invalid-JSON error, JavaScript
            passthrough, XML line breaks, UTF-8 byte/line counts). Expected
            output: <code className="text-emerald-400">all passing</code>.
          </P>
        </Subsection>
        <Subsection title="Test data used">
          <P>
            All manual checks use public, key-free endpoints:{' '}
            <code className="text-slate-500">jsonplaceholder.typicode.com</code>{' '}
            (fake REST), <code className="text-slate-500">httpbin.org</code>{' '}
            (echo, status codes, auth probes),{' '}
            <code className="text-slate-500">api.github.com</code> (GraphQL
            without a token is rate-limited; use the countries API instead) and
            the local demo server on port 8788 for streams.
          </P>
        </Subsection>

        <div id="testing-rest">
          <Subsection title="Testing REST">
            <P>
              Open the workspace at <code className="text-slate-500">/app</code>,
              keep the REST protocol selected, and work down the table.
            </P>
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
        </div>

        <div id="testing-graphql">
          <Subsection title="Testing GraphQL">
            <P>
              GraphQL always sends POST. A public, key-free endpoint
              for testing:
            </P>
            <DocCodeBlock title="request" code={GRAPHQL_QUERY} />
            <P>
              For an authenticated test, use{' '}
              <code className="text-slate-500">POST https://api.github.com/graphql</code>{' '}
              with a Bearer token in the Auth panel.
            </P>
          </Subsection>
        </div>

        <div id="testing-auth">
          <Subsection title="Testing authentication">
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
        </div>

        <div id="testing-environments">
          <Subsection title="Testing environments">
            <StepList
              steps={[
                'Open Environments (Globe icon area) — the default "Local" environment defines base_url = http://localhost:3000.',
                'Set the URL field to {{base_url}}/todos/1.',
                'Send. The request actually goes to http://localhost:3000/todos/1 — start any local server first, or switch to the "Public APIs" environment and use {{base_url}}/… against api.publicapis.org.',
              ]}
            />
            <P>
              Environments live in the Zustand store and persist across
              reloads. Interpolation applies to the URL, headers and body
              before the request is sent.
            </P>
          </Subsection>
        </div>

        <div id="testing-streams">
          <Subsection title="Testing WebSocket &amp; SSE">
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
        </div>

        <div id="testing-grpc">
          <Subsection title="Testing gRPC">
            <P>
              PostifyX uses dynamic protobuf reflection, so
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
        </div>

        <div id="testing-extras">
          <Subsection title="Testing snippets, share links, history &amp; layout">
            <StepList
              steps={[
                'Code snippets: right sidebar → Code icon → switch cURL / Fetch / Python / Node.js → Copy. Paste into a terminal, node or python — it must reproduce the same request, with secrets shown as YOUR_TOKEN.',
                'Share links: open Share → Copy link → paste into a new tab. The workspace opens with that request staged in its own tab. Check the URL fragment: no secret header value appears anywhere in it.',
                'History: send two or three requests, then open the History sidebar view — entries appear newest-first with method, status, URL and ms. Click one to reload it.',
                'Collections: type a name and press Enter — the current request is saved. Clicking it opens in a new tab, so your working tab is never overwritten.',
                'Layout: drag the response divider up or down, then double-click it to reset. Reload the page — the height is restored from storage.',
              ]}
            />
            <P>
              Share links encode the request in the URL fragment, which
              browsers never send to a server — but anyone you paste the
              link to can reconstruct the request, so treat it as sensitive.
            </P>
          </Subsection>
        </div>
      </Section>

      <Section title="Configuration" id="configuration">
        <DataTable
          columns={['Key', 'Where', 'Meaning']}
          rows={[
            ['PostifyX.workspace.v1', 'localStorage', 'Zustand persist: tabs, active tab, collections, environments'],
            ['PostifyX.layout.response', 'localStorage', 'Response pane height in pixels'],
            ['PostifyX.proxy', 'localStorage', 'Override the CORS relay URL (hosted deployments)'],
            ['NEXT_PUBLIC_PostifyX_PROXY', 'environment', 'Same override, at build time'],
            ['ALLOW_HOSTS', 'relay environment', 'Comma-separated host allowlist — set this if you deploy the relay'],
          ]}
        />
        <P>
          <strong className="text-slate-200">Clearing state:</strong> dev
          tools → Application → Local Storage → delete the keys above, or
          run <code className="text-slate-500">localStorage.clear()</code>{' '}
          in the console.
        </P>
      </Section>

      <Section title="Project structure" id="structure">
        <DocCodeBlock title="project" code={STRUCTURE} />
      </Section>

      <Section title="Security model" id="security">
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-400">
          <li><strong className="text-slate-200">Zero telemetry, zero accounts, zero cloud.</strong> Nothing leaves the machine except the requests you explicitly send.</li>
          <li><strong className="text-slate-200">Share links are fragment-only.</strong> The payload rides in the URL fragment (never transmitted to a server) and secret headers are redacted before encoding. Anyone you paste the link to can reconstruct the request, so treat it as sensitive.</li>
          <li><strong className="text-slate-200">The relay is development-only.</strong> It forwards to any host, which is a server-side request forgery primitive. A deployed instance must set ALLOW_HOSTS and sit behind authentication. The desktop app does not use the relay at all.</li>
          <li><strong className="text-slate-200">Minimal Tauri surface.</strong> Capabilities are limited to core:default — the app defines no plugin permissions.</li>
          <li><strong className="text-slate-200">Report vulnerabilities privately</strong> (see SECURITY.md) — never in a public issue.</li>
        </ul>
        <P>
          State is stored in your browser's localStorage only —
          no server ever sees your requests, collections or
          environments.
        </P>
      </Section>

      <Section title="Troubleshooting" id="troubleshooting">
        <DataTable
          columns={['Symptom', 'Cause', 'Fix']}
          rows={[
            ['Cannot find module "./xxx.js"', 'Stale .next — dev and build shared the folder', 'Stop the dev server, delete .next, restart npm run dev'],
            ['Request fails in a browser tab with CORS text', 'Host sends no Access-Control-Allow-Origin', 'Run npm run relay, or set PostifyX.proxy'],
            ['gRPC panel is empty in the browser', 'Browsers cannot read HTTP/2 trailers', 'Use the desktop app'],
            ['SSE custom headers are ignored', 'EventSource limitation', 'Use the desktop app'],
            ['Hydration warning on load', 'Persisted state differs from the server render', 'Handled by design (skipHydration + rehydrate in an effect); restart the dev server if it repeats'],
            ['Streaming does nothing', 'The demo server is not running', 'Run npm run streams and use ws://localhost:8788/ws or http://localhost:8788/sse'],
          ]}
        />
      </Section>
    </>
  );
}
