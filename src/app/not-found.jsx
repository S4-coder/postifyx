import Link from 'next/link';

import SiteShell from '@/components/SiteShell';

export const metadata = {
  title: 'Page not found — PostifyX',
};

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <span className="text-6xl font-bold text-emerald-400">404</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you were looking for doesn't exist or was moved.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Back to PostifyX
        </Link>
      </div>
    </SiteShell>
  );
}