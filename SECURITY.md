# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue. Email the maintainers or use
GitHub's private vulnerability reporting for the repository, and
include:

- What you found and where (file, command, transport)
- Steps or a minimal request that reproduces it
- Any impact estimate (data exposure, request forgery, RCE)

We will acknowledge within 48 hours and share a timeline for a fix
before any public disclosure.

## Trust boundaries

- **The relay (`server/proxy.mjs`) is development-only.** It binds
  to `127.0.0.1` and forwards to any host, which is a server-side
  request forgery primitive. If you deploy it, set `ALLOW_HOSTS` to
  the specific hosts you intend to reach and put it behind
  authentication. The desktop app does not use the relay.
- **Share links** carry the request in the URL fragment. Fragments
  are never sent to a server, and secret headers are redacted to
  `YOUR_TOKEN` before encoding — but anyone you paste the link to
  can reconstruct the request, so treat it as sensitive.
- **Everything stays on your machine.** There is no telemetry, no
  analytics, no update phone-home. Workspace config lives in
  localStorage; response bodies, history and stream frames are
  memory-only and never written to disk.

## Secure defaults

- Requests are issued from the transport you explicitly pick
  (native socket in the desktop app, `fetch` or relay in a browser
  tab) — the app never silently upgrades a transport.
- The gRPC client rejects streaming methods with `UNIMPLEMENTED`
  rather than hanging on an unsupported call.
- Dependency pinning: `package-lock.json` and `Cargo.lock` are
  committed; CI builds installers from tagged releases only
  (`.github/workflows/build-release.yml`).

## Hardening checklist for contributors

- New dependencies: check their maintainership and supply-chain
  history before adding.
- Any new outbound network call needs a justification in the PR —
  the default answer is no.
- Anything that reads `window`/`localStorage` must stay inside
  `useEffect` (hydration correctness doubles as a security review
  surface).
