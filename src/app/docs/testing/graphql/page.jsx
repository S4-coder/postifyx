import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing GraphQL — OpenClient Docs',
  description: 'Test GraphQL queries against a public, key-free endpoint.',
};

const GRAPHQL_QUERY = `POST https://countries.trevorblades.com/
Content-Type: application/json

{
  "query": "{ countries { code name } }"
}

# Expected: 200 with { "data": { "countries": [ ... ] } }`;

export default function TestingGraphqlPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing GraphQL
      </h1>
      <Section title="Public key-free endpoint">
        <P>
          GraphQL always sends POST. A public, key-free endpoint
          for testing:
        </P>
        <DocCodeBlock title="request" code={GRAPHQL_QUERY} />
        <P>
          For an authenticated test, use{' '}
          <code className="text-slate-500">POST https://api.github.com/graphql</code>{' '}
          with a Bearer token in the Auth panel.
        </P>
      </Section>
    </>
  );
}
