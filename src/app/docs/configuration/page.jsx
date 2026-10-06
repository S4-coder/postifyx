import { DataTable, P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Configuration — PostifyX Docs',
  description: 'PostifyX storage keys and environment variables.',
};

export default function ConfigurationPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Configuration
      </h1>
      <Section title="Keys and variables">
        <DataTable
          columns={['Key', 'Where', 'Meaning']}
          rows={[
            ['PostifyX.workspace.v1', 'localStorage', 'Zustand persist: tabs, active tab, collections, environments'],
            ['PostifyX.layout.response', 'localStorage', 'Response pane height in pixels'],
            ['PostifyX.proxy', 'localStorage', 'Override the CORS relay URL (hosted deployments)'],
            ['NEXT_PUBLIC_PostifyX_PROXY', 'environment', 'Same override, at build time'],
            ['ALLOW_HOSTS', 'relay environment', 'Comma-separated host allowlist — set this if you deploy the relay'],
          ]}
        />
        <P>
          <strong className="text-slate-200">Clearing state:</strong> dev
          tools → Application → Local Storage → delete the keys above, or
          run <code className="text-slate-500">localStorage.clear()</code>{' '}
          in the console.
        </P>
      </Section>
    </>
  );
}
