import SiteShell from '@/components/SiteShell';

const RELEASES_URL = 'https://github.com/S4-coder/postifyx/releases';

const PLATFORMS = [
  { label: 'Windows', formats: 'NSIS installer (.exe) and MSI' },
  { label: 'macOS', formats: 'DMG installer' },
  { label: 'Linux', formats: 'AppImage and DEB packages' },
];

export default function DownloadPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Download PostifyX</h1>
        <p className="mt-2 text-sm text-slate-400">
          Choose your platform and download a published installer from GitHub Releases.
        </p>

        <div className="mt-8 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-6">
          <p className="text-sm text-slate-300">
            Releases are built for each platform when a version is published. Select the matching
            installer from the release assets. If no release is listed yet, ready-made installers
            are not available yet.
          </p>
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            View releases and download
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PLATFORMS.map((platform) => (
            <section
              key={platform.label}
              className="rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5"
            >
              <h2 className="font-semibold">{platform.label}</h2>
              <p className="mt-2 text-xs text-slate-500">{platform.formats}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-[#1e1e1e] bg-[#1a1a1a] p-5 text-sm text-slate-400">
          <h2 className="font-semibold text-slate-200">Prefer to build it yourself?</h2>
          <p className="mt-2">
            Clone the repo and run <code className="font-mono text-emerald-300">npm install</code>{' '}
            then <code className="font-mono text-emerald-300">npm run desktop:build</code>. You will
            need Node.js 20+, a Rust stable toolchain, and the Tauri 2 platform prerequisites
            (WebKitGTK on Linux).
          </p>
        </div>
      </div>
    </SiteShell>
  );
}