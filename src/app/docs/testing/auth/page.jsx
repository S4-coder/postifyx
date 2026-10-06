import { DataTable, P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing authentication — PostifyX Docs',
  description: 'Verify Bearer and Basic auth against httpbin.org.',
};

export default function TestingAuthPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing authentication
      </h1>
      <Section title="How auth is configured">
        <P>
          Auth is configured in the <strong className="text-slate-200">Auth</strong> panel
          (not typed into headers), so the payload builder folds it in and
          snippets redact it.
        </P>
        <DataTable
          columns={['Type', 'Target', 'Without auth', 'With auth']}
          rows={[
            ['Bearer', 'GET https://httpbin.org/bearer', '401', '200 — {"authenticated": true}'],
            ['Basic', 'GET https://httpbin.org/basic-auth/user/passwd', '401', '200 — {"authenticated": true}'],
          ]}
        />
      </Section>
    </>
  );
}
