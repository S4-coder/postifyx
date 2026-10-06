import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Quick start — OpenClient Docs',
  description: 'Install and run OpenClient: prerequisites, commands, and where the workspace lives.',
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

export default function QuickStartPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Quick start
      </h1>
      <Section title="Prerequisites">
        <P>
          <strong className="text-slate-200">Required:</strong> Node.js 20+.
        </P>
        <P>
          <strong className="text-slate-200">For the desktop app:</strong> Rust
          stable, plus Visual Studio Build Tools (Windows),{' '}
          <code className="text-slate-500">libwebkit2gtk-4.1-dev</code> (Linux)
          or Xcode command line tools (macOS).
        </P>
      </Section>
      <Section title="Install and run">
        <DocCodeBlock title="terminal" code={QUICK_START} />
        <P>
          The workspace lives at <code className="text-slate-500">/app</code>. To
          try streaming, keep <code className="text-slate-500">npm run streams</code>{' '}
          running and use <code className="text-slate-500">ws://localhost:8788/ws</code>{' '}
          or <code className="text-slate-500">http://localhost:8788/sse</code>.
        </P>
      </Section>
    </>
  );
}
