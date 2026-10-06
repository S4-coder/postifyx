'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/quick-start', label: 'Quick start' },
  { href: '/docs/architecture', label: 'Architecture' },
  { href: '/docs/protocols', label: 'Protocols' },
  { href: '/docs/features', label: 'Features' },
  {
    href: '/docs/testing',
    label: 'Testing guide',
    children: [
      { href: '/docs/testing/rest', label: 'REST' },
      { href: '/docs/testing/graphql', label: 'GraphQL' },
      { href: '/docs/testing/auth', label: 'Authentication' },
      { href: '/docs/testing/environments', label: 'Environments' },
      { href: '/docs/testing/streams', label: 'WebSocket & SSE' },
      { href: '/docs/testing/grpc', label: 'gRPC' },
      { href: '/docs/testing/extras', label: 'Snippets, share, history' },
    ],
  },
  { href: '/docs/configuration', label: 'Configuration' },
  { href: '/docs/structure', label: 'Project structure' },
  { href: '/docs/security', label: 'Security model' },
  { href: '/docs/troubleshooting', label: 'Troubleshooting' },
];

function isActive(path, href) {
  if (path === href) return true;
  if (href !== '/docs' && path.startsWith(`${href}/`)) return true;
  return false;
}

export default function DocsSidebar() {
  const raw = usePathname();
  const path = raw.replace(/\/+$/, '') || '/';

  return (
    <nav className="sticky top-20 hidden h-fit w-56 shrink-0 lg:block">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Documentation
      </p>
      <ul className="space-y-1 border-l border-[#1e1e1e]">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block border-l-2 py-0.5 pl-3 text-[11px] transition ${
                isActive(path, item.href)
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400'
              }`}
            >
              {item.label}
            </Link>
            {item.children && (
              <ul className="mt-1 space-y-1">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className={`block border-l-2 py-0.5 pl-7 text-[11px] transition ${
                        isActive(path, child.href)
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-transparent text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400'
                      }`}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
