# OpenClient

A local-first, zero-telemetry API client built as a Tauri 2 desktop app with a
Next.js static-export frontend. Requests are issued from a Rust native socket, so
browser CORS never applies.

## Stack

| Layer | Choice |
| --- | --- |
| Shell | Tauri 2 (Rust) |
| UI | Next.js App Router, `output: 'export'`, JSX, Tailwind CSS |
| State | Zustand with selective localStorage persistence |
| HTTP | `reqwest` + `tokio` in the Rust core |
| Streams | `tokio-tungstenite` (WebSocket), `reqwest` streaming (SSE) |
| gRPC | `tonic` HTTP/2 with `prost-reflect` dynamic message handling |

## Protocols

| Protocol | Browser tab | Desktop app |
| --- | --- | --- |
| REST | via relay if the host blocks CORS, else direct `fetch` | native socket |
| GraphQL | same as REST | native socket |
| WebSocket | native `WebSocket` | Rust-owned socket, frames as Tauri events |
| SSE | native `EventSource` | Rust-owned stream, spec-compliant parser |
| gRPC | not possible — browsers cannot read HTTP/2 trailers | `tonic` + protobuf reflection |

Browser limitations are real and are stated in the UI rather than papered over:
gRPC needs trailer access `fetch` does not expose, and `EventSource` cannot send
custom headers (the Rust path has no such restriction).

## Layout

```
src/
  app/
    page.jsx          Landing page: hero, benchmarks, protocol cards
    app/page.jsx      Core tabbed API workspace
    download/page.jsx OS detection + binary links
    apis/page.jsx     Public API directory + streaming examples
    privacy/page.jsx  Zero-telemetry policy
    terms/page.jsx    MIT licence and terms
  components/         Workspace UI
  lib/tauri.js        IPC bridge: desktop, direct fetch, relay fallback
  lib/streams.js      WebSocket / SSE / gRPC client wrappers
  lib/protocols.js    Protocol metadata and display helpers
  lib/publicApis.js   Curated, verified endpoints
  store/              Zustand store
src-tauri/src/
  lib.rs              App state, command registration
  http.rs             REST / GraphQL execution
  ws.rs               WebSocket transport + Tauri event bridge
  sse.rs              Server-sent events parser
  grpc.rs             gRPC with dynamic protobuf reflection
  network.rs          Shared client pool
server/
  proxy.mjs           CORS relay for browser mode
  demo-streams.mjs    Local WebSocket echo + SSE endpoints for testing
```

## Prerequisites

- Node.js 20+
- Rust stable (`rustup toolchain install stable`)
- **Windows:** Visual Studio Build Tools with the "Desktop development with C++"
  workload. `link.exe` must be on `PATH` — Rust cannot link without it.
- **Linux:** `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential`
- **macOS:** Xcode command line tools

## Develop

```bash
npm install

# Full web setup: UI, CORS relay, and streaming demo endpoints.
npm run dev:full

# Or individually:
npm run dev        # Next.js only, port 3000
npm run relay      # CORS relay, port 8787
npm run streams    # WS + SSE demo server, port 8788
```

Then open <http://localhost:3000>.

To try WebSocket and SSE, start `npm run streams` and use
`ws://localhost:8788/ws` or `http://localhost:8788/sse`.

## Build

```bash
npm run build         # static export into out/
npm run desktop:build # platform installers
```

Release binaries come from `.github/workflows/build-release.yml` on a `v*.*.*` tag.

## How the transport layer works

`src/lib/tauri.js` picks a path per runtime:

- **Desktop** — `invoke('execute_rest_request', …)` reaches `src-tauri/src/http.rs`.
- **Browser, direct** — plain `fetch`. Fastest, and works for any host that sends
  `Access-Control-Allow-Origin` (GitHub, Hacker News, dog.ceo, httpbin).
- **Browser, relay** — used when the direct attempt is blocked. `server/proxy.mjs`
  performs the request server-side where CORS does not apply.

Transport failures resolve as `{ status: 0, error }` instead of rejecting, so the
response inspector renders them inline.

### The relay is an SSRF vector

`server/proxy.mjs` binds to `127.0.0.1` by default and forwards to any host. That
is deliberate for local development, but an open relay is a server-side request
forgery primitive. If you deploy it, set `ALLOW_HOSTS` to the specific hosts you
intend to reach and put it behind authentication.

## gRPC usage

gRPC uses dynamic protobuf reflection, so there is no `protoc` plugin step and no
generated code in the repo.

```bash
protoc --descriptor_set_out=api.bin api.proto
base64 -w0 api.bin    # paste into the descriptor set field
```

Then pick a service and method from the dropdown. Streaming methods are rejected
with `UNIMPLEMENTED` rather than silently hanging.

## Data handling

Workspace config persists to localStorage. Response bodies, history and stream
frames are deliberately memory-only (`partialize` in the store) so the app stays
well under the 50 MB RAM budget. Nothing is transmitted anywhere.

## Documents

| Document | Where |
| --- | --- |
| Full documentation | `DOCS.md` (features, architecture, how to test every API) |
| Privacy Policy | `/privacy` page (`src/app/privacy/page.jsx`) |
| Terms & Conditions | `/terms` page (`src/app/terms/page.jsx`) |
| License | `LICENSE` (MIT) |
| Contributing guide | `CONTRIBUTING.md` |
| Changelog | `CHANGELOG.md` |
| Security policy | `SECURITY.md` |
| Code of conduct | `CODE_OF_CONDUCT.md` |

## Support

Bug reports and feature requests: GitHub Issues. Security issues:
see `SECURITY.md` — report privately, never in a public issue.

## Licence

MIT. See `LICENSE`.
