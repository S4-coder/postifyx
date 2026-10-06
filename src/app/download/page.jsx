'use client';

import { useEffect, useState } from 'react';

import SiteShell from '@/components/SiteShell';

/** Release asset URLs. Keep in sync with the tag pattern in the release workflow. */
const RELEASES = {
  windows: {
    label: 'Windows',
    requirements: 'Windows 10 or later, 64-bit',
    primary: {
      name: 'PostifyX-0.1.0-x64-setup.exe',
      href: 'https://github.com/S4-coder/postifyx/releases/download/v0.1.0/PostifyX_0.1.0_x64-setup.exe',
    },
    secondary: {
      name: 'PostifyX-0.1.0-x64-setup.msi',
      href: 'https://github.com/S4-coder/postifyx/releases/download/v0.1.0/PostifyX_0.1.0_amd64_en-US.msi',
    },
  },
  macos: {
    label: 'macOS',
    requirements: 'macOS 11 (Big Sur) or later, Intel and Apple Silicon',
    primary: {
      name: 'PostifyX-0.1.0.dmg',
      href: 'https://github.com/S4-coder/postifyx/releases/download/v0.1.0/PostifyX_0.1.0_universal.dmg',
    },
    secondary: {
      name: 'PostifyX-0.1.0-arm64.dmg',
      href: 'https://github.com/S4-coder/postifyx/releases/download/v0.1.0/PostifyX_0.1.0_aarch64.dmg',
    },
  },
  linux: {
    label: 'Linux',
    requirements: 'glibc 2.31 or later, x64',
    primary: {
      name: 'PostifyX_0.1.0_amd64.AppImage',
      href: 'https://github.com/S4-coder/postifyx/releases/download/v0.1.0/PostifyX_0.1.0_amd64.AppImage',
    },
    secondary: {
      name: 'PostifyX_0.1.0_amd64.deb',
      href: 'https://github.com/S4-coder/postifyx/releases/download/v0.1.0/PostifyX_0.1.0_amd64.deb',
    },
  },
};

/** Maps a user-agent string to one of the three supported platforms. */
function detectPlatform() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macos';
  if (/Linux|X11/i.test(ua)) return 'linux';
  return null;
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState(null);
  const [checked, setChecked] = useState(false);

  // Detection runs after mount so the static HTML stays identical for crawlers.
  useEffect(() => {
    setPlatform(detectPlatform());
    setChecked(true);
  }, []);

  const detected = platform ? RELEASES[platform] : null;

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Download PostifyX</h1>

        {checked && detected ? (
          <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-6">
            <p className="text-xs uppercase tracking-wide text-amber-300">
              File not found
            </p>
            <p className="mt-1 text-sm text-slate-400">
              The {detected.label} installer is not yet published. A tagged release must be
              created on GitHub before this download works.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Choose your platform below. PostifyX ships as a single binary with no runtime install.
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {Object.entries(RELEASES).map(([key, release]) => (
            <section
              key={key}
              className={`flex flex-col rounded-lg border p-5 ${
                platform === key ? 'border-emerald-500/50 bg-[#1a1a1a]' : 'border-[#1e1e1e] bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{release.label}</h2>
                {platform === key && (
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
                    Your OS
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{release.requirements}</p>

              <div className="mt-4 space-y-2">
                <button
                  disabled
                  className="block w-full cursor-not-allowed rounded-md border border-[#2a2a2a] px-3 py-2 text-center font-mono text-xs text-slate-500"
                >
                  {release.primary.name}
                </button>
                <button
                  disabled
                  className="block w-full cursor-not-allowed rounded-md border border-[#1e1e1e] px-3 py-2 text-center font-mono text-xs text-slate-500"
                >
                  {release.secondary.name}
                </button>
              </div>
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

        <div className="mt-12 rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200/90">
          <h2 className="font-semibold">Release URLs are placeholders</h2>
          <p className="mt-2 text-amber-200/70">
            These point at the <code className="font-mono">v0.1.0</code> release path that the CI
            workflow publishes to. Until a tagged release exists, use the build-from-source
            instructions above.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
