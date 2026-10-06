import CursorEffect from '@/components/CursorEffect';
import './globals.css';

export const metadata = {
  title: 'PostifyX — Local-first API client',
  description:
    'PostifyX is a zero-telemetry, local-first API client for REST, GraphQL, gRPC, WebSocket and SSE. All data stays on your disk.',
};

export const viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      {/* `suppressHydrationWarning` covers one level only, so it belongs on
        `<body>` itself: that is where browser extensions inject their own
        attributes (Grammarly adds `data-gr-*`) before React hydrates. The
        element's own props are static, so there is no real mismatch here to
        hide. The Tauri webview runs without extensions and never hits this. */}
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#0d0d0d] font-sans text-slate-100"
      >
        {children}
        <CursorEffect />
      </body>
    </html>
  );
}
