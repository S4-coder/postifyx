import SiteShell from '@/components/SiteShell';

export const metadata = {
  title: 'Privacy — OpenClient',
  description:
    'OpenClient collects nothing. Requests, tokens, environments and history stay in local storage on your own disk.',
};

const SECTIONS = [
  {
    title: 'Zero cloud data collection',
    body: [
      'OpenClient runs on a local-first architecture. There is no account system, no analytics service, and no usage database. Requests, tokens, parameters, environments and response logs live in your browser/WebView local storage on the machine you installed the app on.',
      'We cannot see your data because it is never transmitted to us. There is no endpoint that receives it.',
    ],
  },
  {
    title: 'No telemetry',
    body: [
      'The application makes zero outbound network calls other than the HTTP requests you explicitly send from the workspace. There are no crash reporters, no update pings, no feature flags fetched from a CDN, and no usage analytics.',
      'Every request listed on screen was started by you.',
    ],
  },
  {
    title: 'Where your data is stored',
    body: [
      'Workspace configuration — URL, method, headers, body, auth settings and environment variables — is stored as JSON in WebView local storage. It is scoped to the app and is not written to any OpenClient server.',
      'Request history is held in memory only and is deliberately excluded from persistence, so it disappears when the window closes.',
    ],
  },
  {
    title: 'Third-party services',
    body: [
      'The only third parties involved are the API hosts you call. They receive the requests you construct and may log them under their own policies, which we do not control and do not proxy.',
      'In browser (non-desktop) mode, requests are relayed through a self-hosted proxy because browsers enforce CORS. Configure that relay yourself if you use web mode.',
    ],
  },
  {
    title: 'Secrets handling',
    body: [
      'Bearer tokens, basic auth credentials and API keys are stored in the same local storage as the rest of your workspace, in clear text. This is a deliberate trade-off for a local-first tool with no encryption key escrow: your data is as protected as the disk it sits on.',
      'Use environment placeholders such as {{access_token}} so a real secret never has to be typed into the request itself, and avoid storing production credentials on shared machines.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'If this policy ever changes, the change will be committed to the public repository so the diff is visible. A policy that claims zero collection cannot be updated silently.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Effective Date: October 2026</p>

        <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-sm leading-relaxed text-emerald-200/90">
            <strong>All data stays local on your disk.</strong> OpenClient has no servers, no
            accounts, and no telemetry. There is nothing to opt out of because nothing is collected.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section, i) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-100">
                <span className="mr-2 font-mono text-sm text-emerald-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              <div className="mt-2 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-slate-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-[#1e1e1e] pt-6 text-xs text-slate-600">
          This policy describes the shipped build. The source of truth is this Markdown file in the
          repository, under <code className="font-mono">src/app/privacy/page.jsx</code>.
        </p>
      </article>
    </SiteShell>
  );
}
