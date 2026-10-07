import Link from 'next/link';

import { P, Section, StepList } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'VS Code extension — PostifyX Docs',
  description:
    'Open the PostifyX API workspace directly inside VS Code with a built-in console terminal.',
};

export default function DocsExtensionPage() {
  return (
    <>
      <header>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          VS Code Extension
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
          PostifyX for VS Code
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400">
          The extension opens a single-panel API workspace inside your editor — request bar,
          body editor, response viewer and a live console terminal all in one tab.
        </p>
      </header>

      <Section title="Installation">
        <StepList
          steps={[
            'Download postifyx-0.1.0.vsix from the extension page or the releases tab.',
            'Open VS Code and press Ctrl+Shift+P.',
            'Choose "Install from VSIX…" and select the downloaded file.',
            'Run the command palette again and choose "Open PostifyX Workspace".',
          ]}
        />
      </Section>

      <Section title="What opens">
        <P>
          The workspace is a single panel with three zones:
        </P>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-400">
          <li><b className="text-slate-200">Request bar</b> — method selector, URL input and a Send button.</li>
          <li><b className="text-slate-200">Body editor</b> — visible only for POST, PUT and PATCH.</li>
          <li><b className="text-slate-200">Response viewer</b> — status, round-trip time and JSON body.</li>
          <li><b className="text-slate-200">Console terminal</b> — live execution logs with timestamps.</li>
        </ul>
      </Section>

      <Section title="Console terminal">
        <P>
          Every request you send writes a log line to the console terminal:
        </P>
        <pre className="overflow-x-auto rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] p-3 font-mono text-[11px] text-emerald-300">
{`[14:02:01] >>> GET https://jsonplaceholder.typicode.com/todos/1
[14:02:01] Status: 200 OK | 128.45 ms
[14:02:32] >>> POST https://example.com/api
[14:02:32] Status: 400 Bad Request | 41.20 ms`}
        </pre>
        <P>
          Click <b>Clear</b> in the terminal header to wipe the log. Lines are colour-coded:
          blue for requests, green for success, red for errors.
        </P>
      </Section>

      <Section title="Building from source">
        <pre className="overflow-x-auto rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] p-3 font-mono text-[11px] text-emerald-300">
{`cd extension
npm install
npm run compile
npx vsce package`}
        </pre>
        <P>
          This produces <code className="font-mono text-emerald-300">postifyx-0.1.0.vsix</code> in the
          extension folder, ready to install.
        </P>
      </Section>

      <p className="text-[13px] text-slate-400">
        <Link href="/docs" className="text-emerald-400 hover:underline">← Back to docs</Link>
      </p>
    </>
  );
}