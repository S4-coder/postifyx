import Link from 'next/link';
import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { P, Section, Subsection } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing guide — PostifyX Docs',
  description: 'Verify every PostifyX feature with public, key-free endpoints.',
};

export default function TestingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing guide
      </h1>
      <Section title="Overview">
        <P>
          Every feature can be verified in under two minutes.
          Start with the automated suite, then walk the manual
          checks — each protocol has its own page:
        </P>
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-slate-400">
          <li><Link href="/docs/testing/rest" className="text-emerald-400 hover:underline">REST</Link> — basic GET, JSON, POST with body, headers, status codes, redirects</li>
          <li><Link href="/docs/testing/graphql" className="text-emerald-400 hover:underline">GraphQL</Link> — a public key-free endpoint</li>
          <li><Link href="/docs/testing/auth" className="text-emerald-400 hover:underline">Authentication</Link> — Bearer and Basic against httpbin</li>
          <li><Link href="/docs/testing/environments" className="text-emerald-400 hover:underline">Environments</Link> — {'{{placeholder}}'} interpolation</li>
          <li><Link href="/docs/testing/streams" className="text-emerald-400 hover:underline">WebSocket &amp; SSE</Link> — local echo server</li>
          <li><Link href="/docs/testing/grpc" className="text-emerald-400 hover:underline">gRPC</Link> — descriptor set setup (desktop only)</li>
          <li><Link href="/docs/testing/extras" className="text-emerald-400 hover:underline">Snippets, share links, history &amp; layout</Link></li>
        </ul>
      </Section>
      <Section title="Automated tests">
        <DocCodeBlock title="terminal" code={`npm test`} />
        <P>
          Asserts snippet generation (method, URL, shell quoting, secret
          redaction, GET-omits-body, quote escaping) and body formatting
          (five formats, JSON re-indent, invalid-JSON error, JavaScript
          passthrough, XML line breaks, UTF-8 byte/line counts). Expected
          output: <code className="text-emerald-400">all passing</code>.
        </P>
      </Section>
      <Subsection title="Test data used">
        <P>
          All manual checks use public, key-free endpoints:{' '}
          <code className="text-slate-500">jsonplaceholder.typicode.com</code>{' '}
          (fake REST), <code className="text-slate-500">httpbin.org</code>{' '}
          (echo, status codes, auth probes),{' '}
          <code className="text-slate-500">api.github.com</code> (GraphQL
          without a token is rate-limited; use the countries API instead) and
          the local demo server on port 8788 for streams.
        </P>
      </Subsection>
    </>
  );
}
