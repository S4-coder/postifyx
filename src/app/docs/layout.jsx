import SiteShell from '@/components/SiteShell';
import DocsSidebar from '@/components/docs/DocsSidebar';

export default function DocsLayout({ children }) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex gap-10">
          <DocsSidebar />
          <main className="min-w-0 max-w-3xl flex-1 space-y-12">
            {children}
          </main>
        </div>
      </div>
    </SiteShell>
  );
}
