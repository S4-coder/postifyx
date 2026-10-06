import SiteShell from '@/components/SiteShell';

export const metadata = {
  title: 'Terms — OpenClient',
  description: 'OpenClient is MIT licensed open-source software. Terms of use and licence text.',
};

const LICENSE = `MIT License

Copyright (c) 2026 The OpenClient Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const TERMS = [
  {
    title: 'No warranty',
    body: 'The software is provided "as is", without warranty of any kind, as stated in the MIT licence. Requests you send, and the responses you receive, are at your own risk.',
  },
  {
    title: 'Your responsibility',
    body: 'You are responsible for the requests you construct and the data you send, including making sure you are authorised to access the endpoints you target.',
  },
  {
    title: 'Protocol support is partial',
    body: 'REST and GraphQL are implemented. gRPC, WebSocket and SSE transports are in progress and are labelled as such in the interface. Do not depend on unimplemented transports.',
  },
  {
    title: 'Licence',
    body: 'OpenClient is MIT licensed. You may use, modify, copy and redistribute it, including commercially, provided the copyright notice and licence text travel with the source.',
  },
  {
    title: 'No affiliation',
    body: 'OpenClient is an independent project and is not affiliated with, endorsed by, or sponsored by Postman, Inc. or any other API client vendor.',
  },
];

export default function TermsPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-500">Effective Date: October 2026</p>

        <div className="mt-10 space-y-8">
          {TERMS.map((section, i) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-100">
                <span className="mr-2 font-mono text-sm text-emerald-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-14">
          <h2 className="text-lg font-semibold text-slate-100">MIT License</h2>
          <pre className="mt-3 overflow-auto rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] p-4 font-mono text-xs leading-relaxed text-slate-400">
            {LICENSE}
          </pre>
        </section>

        <p className="mt-8 text-xs text-slate-600">
          The licence above is also reproduced verbatim in <code className="font-mono">LICENSE</code>{' '}
          at the repository root, which is the authoritative copy.
        </p>
      </div>
    </SiteShell>
  );
}
