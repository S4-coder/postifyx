# Contributing to PostifyX

Thanks for wanting to help. PostifyX is local-first and
zero-telemetry by design, so the bar for any contribution is that
it must not phone home, and must not weaken that property.

## Getting set up

```bash
npm install
npm run dev:full   # UI (3000) + CORS relay (8787) + stream demos (8788)
```

Open <http://localhost:3000> and head to `/app`. For WebSocket and
SSE work, keep `npm run streams` running and point requests at
`ws://localhost:8788/ws` or `http://localhost:8788/sse`.

Desktop changes need the Rust toolchain — see the prerequisites in
`README.md`. Verify with `cargo check` inside `src-tauri/`.

## Where things live

- `src/app/app/page.jsx` — workspace layout and the right sidebar
- `src/components/` — one file per panel; interactive files start
  with `'use client'`
- `src/store/useRequestStore.js` — all workspace state (Zustand,
  persisted selectively)
- `src/lib/` — pure helpers: code generation, protocols, URL checks
- `src-tauri/src/` — Rust transports (`http.rs`, `ws.rs`, `sse.rs`,
  `grpc.rs`)

## House style

- Tailwind utility classes, dark palette (`#0d0d0d` base,
  `emerald-400` accent). Match the neighbouring file, don't restyle.
- No comments unless the *why* isn't obvious from the code.
- Server/client data boundaries matter: anything that reads
  `window` or `localStorage` must run inside `useEffect`, never
  during render, or React hydration will mismatch.
- Zustand state that must survive reload goes through `partialize`;
  response bodies, history and stream frames stay memory-only.

## Process

1. Fork, branch from `main` (`fix/…`, `feat/…`).
2. Keep the diff small and focused; one concern per PR.
3. Run `npm run build` and `npm test` before pushing — both must
   pass.
4. Describe what changed and why in the PR body; screenshots for
   anything visual.

Security issues are not PRs — see `SECURITY.md` first.

## Licence

By contributing you agree your work is released under the MIT
License (see `LICENSE`).
