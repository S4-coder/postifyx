import Link from 'next/link';
import { P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Features — PostifyX Docs',
  description: 'Every PostifyX workspace feature, listed and explained.',
};

export default function FeaturesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Features
      </h1>
      <Section title="The workspace, feature by feature">
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
        <P>
          Want to verify any of these? The{' '}
          <Link href="/docs/testing" className="text-emerald-400 hover:underline">
            testing guide
          </Link>{' '}
          walks through each one with public, key-free endpoints.
        </P>
      </Section>
    </>
  );
}
