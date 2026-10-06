'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV = [
  { href: '/app', label: 'Workspace' },
  { href: '/apis', label: 'API Directory' },
  { href: '/docs', label: 'Docs' },
  { href: '/download', label: 'Download' },
  { href: '/privacy', label: 'Privacy' },
];

/** Shared shell for the marketing pages. Kept out of the desktop workspace. */
export default function SiteShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky navbar: follows the page when you scroll. */}
      <header className="sticky top-0 z-40 border-b border-[#1e1e1e] bg-[#0d0d0d]/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-sm font-bold text-white">
              P
            </span>
            <span className="font-semibold tracking-tight">PostifyX</span>
          </Link>

          {/* Desktop nav, dead-center; nothing on the right side. */}
          <nav className="pointer-events-none absolute inset-x-0 hidden items-center justify-center gap-1 text-sm md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pointer-events-auto rounded px-3 py-1.5 text-slate-400 transition hover:bg-[#1e1e1e] hover:text-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: hamburger only. */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="ml-auto rounded p-2 text-slate-300 transition hover:bg-[#1e1e1e] md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile side drawer, slides in from the right. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-64 flex-col border-l border-[#1e1e1e] bg-[#0d0d0d] p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-sm font-bold text-white">
                  P
                </span>
                <span className="font-semibold tracking-tight">PostifyX</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="rounded p-2 text-slate-300 transition hover:bg-[#1e1e1e]"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded px-3 py-2.5 text-sm text-slate-300 transition hover:bg-[#1e1e1e] hover:text-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/download"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-md bg-emerald-600 px-3 py-2.5 text-center text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Get PostifyX
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1e1e1e] py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            MIT licensed. Zero telemetry, zero accounts, zero cloud storage.
            {' '}Made by <span className="text-slate-300">Sabeel Ahmed</span>.
          </p>
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
