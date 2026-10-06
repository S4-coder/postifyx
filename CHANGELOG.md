# Changelog

All notable changes to PostifyX are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-10

First public release.

### Added

- Tauri 2 desktop shell with a Next.js static-export frontend
- REST and GraphQL execution from a Rust native socket (no browser
  CORS)
- WebSocket client with frames bridged as Tauri events
- Server-sent events with a spec-compliant stream parser
- gRPC over HTTP/2 using dynamic protobuf reflection — no `protoc`
  codegen step
- Tabbed workspace: Headers, Body (JSON/HTML/Text/JS/XML), Auth
  (none/bearer/basic), environment variables with `{{placeholders}}`
- Response inspector: status, timing, size, headers, JSON tree
- Request tabs, collections, share links (payload in the URL
  fragment, secrets redacted) and in-memory history
- Command palette (Ctrl/Cmd+K), public API directory, streaming
  demo endpoints
- Browser fallback: direct `fetch`, then the local CORS relay
  (`server/proxy.mjs`)
- Zero telemetry; workspace config in localStorage, everything else
  memory-only

### Known limits

- gRPC streaming methods are rejected with `UNIMPLEMENTED`
- Browser tab cannot run gRPC (no HTTP/2 trailer access) or send
  custom headers with `EventSource` — stated in the UI
- The relay is an SSRF vector if deployed; it is meant for local
  development (see `SECURITY.md`)
