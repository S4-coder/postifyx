'use client';

import Link from 'next/link';

const NAV = [
  { href: '/app', label: 'Workspace' },
  { href: '/apis', label: 'API Directory' },
  { href: '/docs', label: 'Docs' },
  { href: '/download', label: 'Download' },
  { href: '/privacy', label: 'Privacy' },
];

/** Shared shell for the marketing pages. Kept out of the desktop workspace. */
export default function SiteShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[#1e1e1e] bg-[#0d0d0d]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-sm font-bold text-white">
              O
            </span>
            <span className="font-semibold tracking-tight">OpenClient</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-1.5 text-slate-400 transition hover:bg-[#1e1e1e] hover:text-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/download"
              className="ml-2 rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white transition hover:bg-emerald-500"
            >
              Get OpenClient
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1e1e1e] py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>MIT licensed. Zero telemetry, zero accounts, zero cloud storage.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300">
              Terms
            </Link>
            <Link href="/apis" className="hover:text-slate-300">
              APIs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
