import { P, Section, StepList } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing WebSocket & SSE — PostifyX Docs',
  description: 'Verify both streaming protocols against the local demo server.',
};

export default function TestingStreamsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing WebSocket &amp; SSE
      </h1>
      <Section title="Local demo server">
        <P>
          Run <code className="text-slate-500">npm run streams</code> first — it
          serves a local echo server on port 8788.
        </P>
        <StepList
          steps={[
            'Switch the protocol rail to WebSocket (Radio icon).',
            'Enter ws://localhost:8788/ws and click Connect.',
            'Type a frame in the composer and send it.',
            'Expected: the echo appears in the same log — this confirms both directions work.',
            'Switch to SSE (Rss icon), enter http://localhost:8788/sse, click Connect.',
            'Expected: one "tick" event per second with a JSON payload, appended to the log. Disconnect stops the stream — switching protocols or closing the window always tears streams down, so no socket is ever leaked.',
          ]}
        />
      </Section>
    </>
  );
}
