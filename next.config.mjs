/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';
const nextConfig = {
  // Static HTML export is only needed for the Tauri desktop bundle. On Vercel
  // (or any server-side Next.js runtime) a full SSR build resolves CSS/reload
  // issues and lets API routes like /api/proxy work.
  output: isVercel ? undefined : 'export',
  // Pin the workspace root. There is a stray package-lock.json in the parent
  // home directory that makes Next.js infer the wrong root.
  outputFileTracingRoot: import.meta.dirname,
  // `trailingSlash` interferes with static asset resolution on Vercel refresh;
  // keep it only for the desktop static export.
  trailingSlash: !isVercel,
  images: {
    unoptimized: true,
  },
  // Relative asset paths so the bundle loads from file:// inside the webview.
  // On Vercel, absolute paths (/_next/...) are required so assets resolve
  // correctly from nested routes like /docs/quick-start/.
  assetPrefix: process.env.NODE_ENV === 'production' && !isVercel ? './' : '',
};