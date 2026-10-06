import { DataTable, P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing REST — PostifyX Docs',
  description: 'Nine REST checks with expected results, using public key-free endpoints.',
};

export default function TestingRestPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing REST
      </h1>
      <Section title="Nine checks">
        <P>
          Open the workspace at <code className="text-slate-500">/app</code>,
          keep the REST protocol selected, and work down the table.
        </P>
        <DataTable
          columns={['Test', 'How', 'Expected result']}
          rows={[
            ['Basic GET', 'GET https://api.github.com/zen', '200, one line of text'],
            ['JSON array', 'GET https://jsonplaceholder.typicode.com/todos?_limit=5', '200, JSON array of 5 todos'],
            ['POST with body', 'POST https://jsonplaceholder.typicode.com/posts  ·  Body → JSON: {"title":"hi","body":"yo","userId":1}', '201, response echoes a new id'],
            ['PUT / DELETE', 'PUT or DELETE on https://jsonplaceholder.typicode.com/posts/1', '200'],
            ['Custom headers', 'GET https://httpbin.org/get with header X-Test: hello', 'Response JSON "headers" object contains X-Test: hello'],
            ['Status codes', 'GET https://httpbin.org/status/418', "418 I'm a teapot"],
            ['Redirects', 'GET https://httpbin.org/redirect-to?url=https://example.com', 'Follows through to 200'],
            ['Slow response', 'GET https://httpbin.org/delay/3', '200 after ~3 s — watch the ms timer'],
            ['Bad URL', 'Type not-a-url in the URL field', 'Inline error in the response panel, not a crash'],
          ]}
        />
      </Section>
    </>
  );
}
