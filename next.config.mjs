/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';
const nextConfig = {
  // Static HTML export is only needed for the Tauri desktop bundle. On Vercel
  // (or any server-side Next.js runtime) a full SSR build resolves the CSS
  // reload-on-refresh issue and lets API routes like /api/proxy work.
  output: isVercel ? undefined : 'export',
  // `trailingSlash` interferes with static asset resolution on Vercel refresh;
  // keep it only for the desktop static export.
  trailingSlash: !isVercel,
  images: {
    unoptimized: true,
  },
  // Relative asset paths so the bundle loads from file:// inside the webview.
  assetPrefix: process.env.NODE_ENV === 'production' && !isVercel ? './' : '',
};