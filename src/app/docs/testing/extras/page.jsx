import { P, Section, StepList } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing snippets, share & history — OpenClient Docs',
  description: 'Verify code snippets, share links, history and layout persistence.',
};

export default function TestingExtrasPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Snippets, share links, history &amp; layout
      </h1>
      <Section title="Five checks">
        <StepList
          steps={[
            'Code snippets: right sidebar → Code icon → switch cURL / Fetch / Python / Node.js → Copy. Paste into a terminal, node or python — it must reproduce the same request, with secrets shown as YOUR_TOKEN.',
            'Share links: open Share → Copy link → paste into a new tab. The workspace opens with that request staged in its own tab. Check the URL fragment: no secret header value appears anywhere in it.',
            'History: send two or three requests, then open the History sidebar view — entries appear newest-first with method, status, URL and ms. Click one to reload it.',
            'Collections: type a name and press Enter — the current request is saved. Clicking it opens in a new tab, so your working tab is never overwritten.',
            'Layout: drag the response divider up or down, then double-click it to reset. Reload the page — the height is restored from storage.',
          ]}
        />
        <P>
          Share links encode the request in the URL fragment, which
          browsers never send to a server — but anyone you paste the
          link to can reconstruct the request, so treat it as sensitive.
        </P>
      </Section>
    </>
  );
}
