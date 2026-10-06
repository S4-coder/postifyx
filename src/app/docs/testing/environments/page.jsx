import { P, Section, StepList } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing environments — OpenClient Docs',
  description: 'Verify {{placeholder}} interpolation with environments.',
};

export default function TestingEnvironmentsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing environments
      </h1>
      <Section title="Placeholder interpolation">
        <StepList
          steps={[
            'Open Environments (Globe icon area) — the default "Local" environment defines base_url = http://localhost:3000.',
            'Set the URL field to {{base_url}}/todos/1.',
            'Send. The request actually goes to http://localhost:3000/todos/1 — start any local server first, or switch to the "Public APIs" environment and use {{base_url}}/… against api.publicapis.org.',
          ]}
        />
        <P>
          Environments live in the Zustand store and persist across
          reloads. Interpolation applies to the URL, headers and body
          before the request is sent.
        </P>
      </Section>
    </>
  );
}
