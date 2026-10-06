import { P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Security model — OpenClient Docs',
  description: 'Zero telemetry, fragment-only share links, and relay risks.',
};

export default function SecurityPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Security model
      </h1>
      <Section title="How OpenClient protects you">
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-400">
          <li><strong className="text-slate-200">Zero telemetry, zero accounts, zero cloud.</strong> Nothing leaves the machine except the requests you explicitly send.</li>
          <li><strong className="text-slate-200">Share links are fragment-only.</strong> The payload rides in the URL fragment (never transmitted to a server) and secret headers are redacted before encoding. Anyone you paste the link to can reconstruct the request, so treat it as sensitive.</li>
          <li><strong className="text-slate-200">The relay is development-only.</strong> It forwards to any host, which is a server-side request forgery primitive. A deployed instance must set ALLOW_HOSTS and sit behind authentication. The desktop app does not use the relay at all.</li>
          <li><strong className="text-slate-200">Minimal Tauri surface.</strong> Capabilities are limited to core:default — the app defines no plugin permissions.</li>
          <li><strong className="text-slate-200">Report vulnerabilities privately</strong> (see SECURITY.md) — never in a public issue.</li>
        </ul>
        <P>
          State is stored in your browser's localStorage only —
          no server ever sees your requests, collections or
          environments.
        </P>
      </Section>
    </>
  );
}
