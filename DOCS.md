# OpenClient — Complete Documentation

> Local-first, zero-telemetry API client for **REST, GraphQL, WebSocket,
> SSE and gRPC**. Tauri 2 (Rust) desktop shell + Next.js static-export
> frontend. Requests are issued from a native socket, so browser CORS
> never applies.

This document explains **what every piece is, why it is used, and how to
test it**. For contribution rules see `CONTRIBUTING.md`; for the release
history see `CHANGELOG.md`.

---

## 1. Quick start

```bash
npm install
npm run dev:full     # UI :3000 + CORS relay :8787 + stream demos :8788
```

Open <http://localhost:3000> → **Workspace** (or go straight to `/app`).

| Command | What it does | Why |
| --- | --- | --- |
| `npm run dev` | Next.js dev server on :3000 | UI only; CORS-blocked hosts will fail |
| `npm run relay` | CORS relay on :8787 (`server/proxy.mjs`) | Lets browser mode reach hosts without `Access-Control-Allow-Origin` |
| `npm run streams` | WS echo + SSE demo on :8788 (`server/demo-streams.mjs`) | Local targets so streaming is testable without a third-party service |
| `npm run dev:full` | All three together | The full local experience |
| `npm test` | `node scripts/check-helpers.mjs` | Asserts code generation + body formatting helpers |
| `npm run build` | Static export into `out/` | What the Tauri webview loads |
| `npm run desktop:dev` / `desktop:build` | Tauri dev / installers | Native transports (no CORS at all) |

> Never run `npm run build` while `npm run dev` is running — both write
> `.next` and will clobber each other (this produces
> `Cannot find module './xxx.js'` errors). Stop one first.

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────┐
│  Tauri 2 desktop shell (Rust)                          │
│  src-tauri/src/  lib.rs · http.rs · ws.rs · sse.rs ·   │
│  grpc.rs · network.rs                                  │
│  Native sockets → no CORS, no trailer limits           │
└──────────────────────┬─────────────────────────────────┘
                       │ Tauri IPC (invoke)
┌──────────────────────▼─────────────────────────────────┐
│  Next.js 15 App Router, output: 'export' (static HTML) │
│  src/app/  page · app · apis · download · privacy ·    │
│  terms                                             │
│  React 19 + Tailwind + Zustand (persisted)             │
└──────────────────────┬─────────────────────────────────┘
                       │ browser fallback chain
        direct fetch → CORS relay (server/proxy.mjs)
```

### Why each technology is used

| Technology | Why it is used | What breaks without it |
| --- | --- | --- |
| **Tauri 2** | Desktop shell whose webview calls Rust over IPC. Rust owns the socket, so requests originate natively. | Browser CORS and HTTP/2 trailer limits return |
| **Next.js App Router** | File-based routes (`/app`, `/apis`, …), `output: 'export'` produces static HTML the webview loads from `file://` | No static export → nothing for Tauri to bundle |
| **React 19** | UI components; `'use client'` marks interactive islands | — |
| **Zustand + persist** | Single workspace store; selective persistence (`partialize`) keeps only config in localStorage | No saved tabs/collections across reloads |
| **Tailwind CSS** | Utility-first dark theme; no design tokens to maintain | — |
| **lucide-react** | Consistent icon set (method bars, panels, palette) | — |
| **`reqwest` + `tokio`** | Async HTTP with a pooled client (`network.rs`) | Per-request connection setup, slower round trips |
| **`tokio-tungstenite`** | WebSocket client; frames are forwarded to the UI as Tauri events | No desktop WebSocket |
| **`tonic` + `prost-reflect`** | HTTP/2 gRPC with **dynamic** protobuf reflection | Would need `protoc` codegen per API |
| **`server/proxy.mjs`** | Node relay used only when the browser blocks a direct `fetch` | Browser mode limited to CORS-friendly hosts |

---

## 3. Features & functionality

### 3.1 Protocols

| Protocol | Browser tab | Desktop app |
| --- | --- | --- |
| REST | direct `fetch`, else relay | native socket (`http.rs`) |
| GraphQL | same as REST (always POST) | native socket |
| WebSocket | native `WebSocket` | Rust-owned socket, frames as Tauri events (`ws.rs`) |
| SSE | native `EventSource` (no custom headers) | Rust-owned stream, WHATWG-spec parser (`sse.rs`) |
| gRPC | **not possible** (browsers can't read HTTP/2 trailers) | `tonic` + dynamic reflection (`grpc.rs`) |

Browser limits are **stated in the UI**, not hidden (amber notice in the
request bar).

### 3.2 Workspace (`/app`)

- **Request tabs** — multiple requests side by side; double-click to rename,
  `+` to add, `×` to close. Persisted (`openclient.workspace.v1`).
- **Headers / Body / Auth** panels:
  - Headers: checkbox enable/disable, key-value rows.
  - Body: 5 formats — JSON (re-indented, validated), HTML, Text,
    JavaScript, XML — with byte/line stats (`lib/bodyFormats.js`).
  - Auth: none / Bearer token / Basic (username+password, custom header
    name). Secrets are folded into a real header by `buildPayload()`.
- **Environment variables** — `{{placeholder}}` interpolation in URL,
  headers, body (`interpolate()` in the store).
- **Response inspector** — status + status text, time (ms), size, headers
  list, body view: raw text or interactive JSON tree (`JsonTree`).
- **Right sidebar** — toggled from the request-bar icons: History (real,
  in-memory), Share (live link), Code Snippet (cURL/Fetch/Python/Node.js).
- **Resizable response pane** — drag the divider (or double-click to
  reset); height persists in `openclient.layout.response`.
- **Command palette** — `Ctrl/Cmd+K`, with curated public APIs and
  streaming examples.
- **Collections** — save the current request into a named group; reopen in
  a new tab so the working tab is never overwritten.
- **Share links** — the whole request is base64url-encoded into the URL
  **fragment** (fragments are never sent to a server); `Authorization`,
  `X-Api-Key`, `Api-Key`, `Proxy-Authorization` are redacted to
  `YOUR_TOKEN` before encoding.
- **History** — newest first, in memory only, never written to disk.

### 3.3 Transport selection (`src/lib/tauri.js`)

1. **Desktop** — `invoke('execute_rest_request', …)` → Rust.
2. **Browser, direct** — plain `fetch` (works for GitHub, Hacker News,
   dog.ceo, httpbin, JSONPlaceholder…).
3. **Browser, relay** — only when direct is CORS-blocked; the relay
   performs the request server-side.

Transport failures resolve as `{ status: 0, error }` instead of throwing,
so errors render inline in the response inspector.

### 3.4 Tauri commands (the native API)

| Command | Purpose |
| --- | --- |
| `app_info` | Version, user agent, body/message limits, timeout |
| `execute_rest_request` | REST / GraphQL execution |
| `ws_connect` / `ws_send` / `ws_disconnect` | WebSocket lifecycle |
| `sse_connect` / `sse_disconnect` | SSE stream lifecycle |
| `grpc_call` | One gRPC call (unary; streaming rejected with `UNIMPLEMENTED`) |
| `grpc_describe_services` | List services/methods from a descriptor set |

`src-tauri/capabilities/default.json` grants only `core:default` — the app
defines no plugin permissions, minimizing attack surface.

### 3.5 Limits (by design)

- Body cap: 8 MB (`max_body_bytes`), gRPC message cap (`max_message_bytes`).
- Timeouts: connect 15 s, request 60 s default, caller can extend to 600 s max.
- History capped in memory; response bodies never persisted.

---

## 4. How to test every feature

### 4.1 Automated

```bash
npm test
```

Asserts: snippet generation (method, URL, quoting, secret redaction,
GET-omits-body, quote escaping) and body formatting (5 formats, JSON
re-indent, invalid JSON error, JS passthrough, XML line breaks, UTF-8
byte/line counts). Expected output: `all passing`.

### 4.2 REST

| Test | Steps | Expected |
| --- | --- | --- |
| Basic GET | `GET https://api.github.com/zen` | `200`, one line of text |
| JSON array | `GET https://jsonplaceholder.typicode.com/todos?_limit=5` | `200`, JSON array of 5 todos |
| POST with body | `POST https://jsonplaceholder.typicode.com/posts`, Body → JSON `{"title":"hi","body":"yo","userId":1}` | `201`, response echoes `id` |
| PUT / DELETE | `PUT`/`DELETE` on `.../posts/1` | `200` |
| Custom headers | `GET https://httpbin.org/get` with header `X-Test: hello` | Response JSON `headers` object contains `X-Test: hello` |
| Status codes | `GET https://httpbin.org/status/418` | `418 I'm a teapot` |
| Redirects | `GET https://httpbin.org/redirect-to?url=https://example.com` | Follows to `200` |
| Slow response | `GET https://httpbin.org/delay/3` | `200` after ~3 s (watch the ms timer) |
| Bad URL | URL = `not-a-url` | Inline error, not a crash |

### 4.3 GraphQL

`POST https://countries.trevorblades.com/` (no auth), Body → JSON:

```json
{ "query": "{ countries { code name } }" }
```

Expected: `200` with a `data.countries` array. (GitHub's
`https://api.github.com/graphql` needs a Bearer token — good auth test.)

### 4.4 Authentication

| Type | Target | Without auth | With auth |
| --- | --- | --- | --- |
| Bearer | `GET https://httpbin.org/bearer` | `401` | `200` `{"authenticated": true}` |
| Basic | `GET https://httpbin.org/basic-auth/user/passwd` | `401` | `200` `{"authenticated": true}` |

Auth is configured in the **Auth** panel (not typed into headers), so
`buildPayload()` folds it in and `generateSnippets()` redacts it.

### 4.5 Environment variables

1. Environments (in the request sidebar): `Local` has `base_url =
   http://localhost:3000`.
2. Set URL to `{{base_url}}/todos/1` and send.
3. Expected: the request actually goes to
   `http://localhost:3000/todos/1` (start a local server first, or switch
   to the `Public APIs` environment and use `{{base_url}}/...`).

### 4.6 WebSocket

```bash
npm run streams          # terminal 1
# then in the app:
```

1. Protocol rail → **WebSocket** (`Radio` icon).
2. URL `ws://localhost:8788/ws`, click **Connect**.
3. Type a frame in the composer and send.
4. Expected: the echo appears in the same log — confirms both directions.

### 4.7 Server-sent events

1. Protocol rail → **SSE** (`Rss` icon).
2. URL `http://localhost:8788/sse`, click **Connect** (with
   `npm run streams` running).
3. Expected: one `tick` event per second with a JSON payload, appended to
   the log. **Disconnect** stops the stream (no leaked sockets — the
   workspace tears streams down on protocol switch and unmount).

### 4.8 gRPC (desktop only)

```bash
protoc --descriptor_set_out=api.bin api.proto
base64 -w0 api.bin        # paste into the "descriptor set" field
```

Then pick a service and method from the dropdowns and **Call**. Expected:
services populate from reflection; streaming methods are rejected with
`UNIMPLEMENTED` instead of hanging.

### 4.9 Code snippets

Right sidebar → **Code** icon → switch cURL / Fetch / Python / Node.js →
**Copy**. Paste into a terminal / `node` / `python` run — it must reproduce
the same request, with secrets as `YOUR_TOKEN`.

### 4.10 Share links

1. Build a request, open Share → **Copy link**.
2. Paste into a new tab.
3. Expected: the workspace opens with that request staged in its own tab.
   Check the fragment: no secret header value appears in the URL.

### 4.11 History & collections

- Send 2–3 requests → right sidebar **History** lists them newest-first
  with status, URL, and ms. Click one to reload it.
- Collections: name a collection → Enter → the current request is saved;
  clicking it opens in a **new** tab.

### 4.12 Layout

- Drag the response divider up/down → height changes; double-click →
  reset; reload → height restored (`openclient.layout.response`).

---

## 5. Configuration reference

| Key | Where | Meaning |
| --- | --- | --- |
| `openclient.workspace.v1` | localStorage | Zustand persist: tabs, active tab, collections, environments |
| `openclient.layout.response` | localStorage | Response pane height (px) |
| `openclient.proxy` | localStorage | Override the CORS relay URL for hosted deployments |
| `NEXT_PUBLIC_OPENCLIENT_PROXY` | env | Same override, build-time |
| `ALLOW_HOSTS` | env (relay) | Comma-separated host allowlist — **set this if you deploy the relay** |

**Clearing state:** dev tools → Application → Local Storage → delete the
keys above, or `localStorage.clear()` in the console.

---

## 6. Project structure

```
src/
  app/
    page.jsx          Landing: hero, benchmarks, protocol cards
    app/page.jsx      Core tabbed workspace  ← the main app
    apis/page.jsx     Public API directory + "Run in App"
    download/page.jsx OS detection + installer links
    privacy/page.jsx  Privacy policy (route)
    terms/page.jsx    Terms & conditions (route)
  components/         Workspace UI panels
  lib/
    tauri.js          Transport bridge: desktop → direct → relay
    streams.js        WS / SSE / gRPC client wrappers
    protocols.js      Protocol metadata + display helpers
    publicApis.js     Curated, live-verified endpoints
    codeGen.js        cURL / Fetch / Python / Node snippets
    bodyFormats.js    JSON/HTML/Text/JS/XML body handling
    share.js          Fragment-based share links + redaction
    urlCheck.js       Scheme/URL validation with clear messages
    handOff.js        /apis → /app request staging (in-memory)
  store/useRequestStore.js   Zustand store (all workspace state)
server/
  proxy.mjs           CORS relay (dev only — SSRF vector if deployed)
  demo-streams.mjs    WS echo + SSE tick endpoints for testing
scripts/
  check-helpers.mjs   The `npm test` suite
src-tauri/            Rust core (http/ws/sse/grpc engines)
docs:
  README.md           Overview + setup
  DOCS.md             This file
  CONTRIBUTING.md     How to contribute
  CHANGELOG.md        Version history
  SECURITY.md         Vulnerability reporting + trust boundaries
  CODE_OF_CONDUCT.md  Community rules
  LICENSE             MIT
```

---

## 7. Security model

- **Zero telemetry, zero accounts, zero cloud.** Nothing leaves the machine
  except requests you explicitly send.
- **Share links** carry the payload in the URL fragment (never sent to
  servers) with secret headers redacted.
- **The relay is dev-only** — it forwards to any host (SSRF primitive).
  Deployed instances must set `ALLOW_HOSTS` and add auth.
- **Tauri capabilities** limited to `core:default`; no plugin permissions.
- Report vulnerabilities privately — see `SECURITY.md`. Never in a public
  issue.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find module './xxx.js'` | Stale `.next` (dev + build shared the folder) | Stop dev server, delete `.next`, restart `npm run dev` |
| `Turn interrupted` from the AI assistant | Response/stream too long for the assistant's output limit | Split the request into smaller turns |
| Request fails in browser tab with CORS text | Host sends no `Access-Control-Allow-Origin` | Run `npm run relay` (or set `openclient.proxy`) |
| gRPC panel empty in browser | Browsers can't read HTTP/2 trailers | Use the desktop app |
| SSE custom headers ignored | `EventSource` limitation | Use the desktop app |
| Hydration warning on load | Persisted state differs from server render | Already handled (`skipHydration` + rehydrate in effect); restart dev server if it repeats |
