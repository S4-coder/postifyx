import { DataTable, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Troubleshooting — OpenClient Docs',
  description: 'Common OpenClient symptoms, causes and fixes.',
};

export default function TroubleshootingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Troubleshooting
      </h1>
      <Section title="Symptoms and fixes">
        <DataTable
          columns={['Symptom', 'Cause', 'Fix']}
          rows={[
            ['Cannot find module "./xxx.js"', 'Stale .next — dev and build shared the folder', 'Stop the dev server, delete .next, restart npm run dev'],
            ['Request fails in a browser tab with CORS text', 'Host sends no Access-Control-Allow-Origin', 'Run npm run relay, or set openclient.proxy'],
            ['gRPC panel is empty in the browser', 'Browsers cannot read HTTP/2 trailers', 'Use the desktop app'],
            ['SSE custom headers are ignored', 'EventSource limitation', 'Use the desktop app'],
            ['Hydration warning on load', 'Persisted state differs from the server render', 'Handled by design (skipHydration + rehydrate in an effect); restart the dev server if it repeats'],
            ['Streaming does nothing', 'The demo server is not running', 'Run npm run streams and use ws://localhost:8788/ws or http://localhost:8788/sse'],
          ]}
        />
      </Section>
    </>
  );
}
