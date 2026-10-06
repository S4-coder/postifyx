import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Project structure — PostifyX Docs',
  description: 'What lives where in the PostifyX source tree.',
};

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

export default function StructurePage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Project structure
      </h1>
      <Section title="Source tree">
        <DocCodeBlock title="project" code={STRUCTURE} />
      </Section>
    </>
  );
}
