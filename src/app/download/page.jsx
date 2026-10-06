'use client';

import { useEffect, useState } from 'react';

import SiteShell from '@/components/SiteShell';

/** Maps a user-agent string to one of the three supported platforms. */
function detectPlatform() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macos';
  if (/Linux|X11/i.test(ua)) return 'linux';
  return null;
}

const PLATFORMS = {
  windows: { label: 'Windows', file: 'PostifyX-0.1.0-x64-setup.exe' },
  macos: { label: 'macOS', file: 'PostifyX-0.1.0-universal.dmg' },
  linux: { label: 'Linux', file: 'PostifyX-0.1.0-amd64.AppImage' },
};

export default function DownloadPage() {
  const [platform, setPlatform] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setChecked(true);
  }, []);

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Download PostifyX</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pick your platform below. PostifyX ships as a single binary with no runtime install.
        </p>

        {/* ── Auto-detected download card ──────────────────────────── */}
        {checked && platform && PLATFORMS[platform] ? (
          <div className="mt-8 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-6">
            <p className="text-xs uppercase tracking-wide text-emerald-300">
              Detected {PLATFORMS[platform].label}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Click the button below to download the installer for your system.
            </p>
            <a
              href={`/downloads/${PLATFORMS[platform].file}`}
              download
              className="mt-4 inline-block rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              ⬇ Download for {PLATFORMS[platform].label}
            </a>
          </div>
        ) : checked ? (
          <div className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-6">
            <p className="text-xs uppercase tracking-wide text-amber-300">
              Could not detect your OS
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Pick your platform below to get the right installer.
            </p>
          </div>
        ) : null}

        {/* ── Manual platform buttons ──────────────────────────────── */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <section
              key={key}
              className={`flex flex-col rounded-lg border p-5 ${
                platform === key ? 'border-emerald-500/50 bg-[#1a1a1a]' : 'border-[#1e1e1e] bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.label}</h2>
                {platform === key && (
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
                    Your OS
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{p.file}</p>
              <a
                href={`/downloads/${p.file}`}
                download
                className="mt-4 inline-block w-full text-center rounded-md border border-[#2a2a2a] px-3 py-2 font-mono text-xs text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
              >
                Download
              </a>
            </section>
          ))}
        </div>

        {/* ── Build from source ────────────────────────────────────── */}
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