<div align="center">
  <a href="https://postifyx-ten.vercel.app">
    <img
      src="./public/logo.png"
      alt="PostifyX Logo"
      height="80"
    />
  </a>
  <h3>
    <b>
      PostifyX
    </b>
  </h3>
  <b>
    A Local-First, Zero-Telemetry API Development Ecosystem & Desktop Client
  </b>
  <p>

[![CI](https://github.com/S4-coder/freellmapi/actions/workflows/ci.yml/badge.svg)](https://github.com/S4-coder/freellmapi/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/S4-coder/Postifyx?style=flat&logo=github&color=yellow)](https://github.com/S4-coder/Postifyx/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Docker image](https://img.shields.io/badge/ghcr.io-freellmapi-2496ED?logo=docker&logoColor=white)](https://github.com/S4-coder/freellmapi/pkgs/container/freellmapi)

  </p>
  <p>
    <sub>
      Built with ❤︎ by <a href="https://github.com/S4-coder">S4-coder</a> and open-source contributors
    </sub>
  </p>
</div>

---

**PostifyX** ek high-performance, local-first API client hai jisko Tauri 2 aur Next.js ke sath design kiya gaya hai. Isme requests Rust native socket se execute hoti hain, jisse browser CORS restrictions kabhi barrier nahi banti.

---

### **Key Features**

🔒 **Zero-Telemetry & Privacy-First:** Direct client-to-server communication, privacy-focused design.
⚡ **No CORS Blockers:** Tauri 2 (Rust core) native sockets ki wajah se browser CORS issue skip ho jata hai.
🗄 **Multi-Protocol Support:** REST, GraphQL, WebSocket, SSE, aur gRPC dynamic reflection ke sath.
🌈 **Modern Dark UI:** Clean, minimalist UI design optimized for developers.

---

### **Tech Stack & Protocol Comparison**

| Layer | Choice |
| --- | --- |
| **Shell** | Tauri 2 (Rust) |
| **UI** | Next.js App Router (`output: 'export'`), Tailwind CSS |
| **State** | Zustand (with selective `localStorage` persistence) |
| **HTTP Transport** | `reqwest` + `tokio` |

---

### **Project Structure, Getting Started & Documentation**

```text
src/
  app/              Landing page, app workspace, documentation pages
  components/       Workspace UI components
  lib/              Tauri IPC bridge, stream handlers & API helpers
  store/            Zustand state management
src-tauri/src/
  lib.rs            App state & command bindings
  http.rs           REST / GraphQL execution engine
  ws.rs             WebSocket transport
  sse.rs            Server-Sent Events parser
  grpc.rs           gRPC dynamic reflection handler
```
---
GETTING STARTED & INSTALLATION:

Prerequisites:
- Node.js 20+
- Rust stable (`rustup toolchain install stable`)

Commands:
# Repository clone karein
git clone [https://github.com/S4-coder/Postifyx.git](https://github.com/S4-coder/Postifyx.git)
cd Postifyx

# Dependencies install karein
npm install

# Full development environment (UI + Proxy Relay + Demo Streams)
npm run dev:full

Open http://localhost:3000 in your browser.
---

ADDITIONAL DOCUMENTS & RESOURCES:

- Full Docs: DOCS.md
- Contributing Guide: CONTRIBUTING.md
- License: LICENSE (MIT)
- Privacy Policy: /privacy
- Terms & Conditions: /terms
