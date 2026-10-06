/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export: required for the Tauri desktop bundle.
  output: 'export',
  // This project sits below a home directory that has its own lockfile; pin the
  // trace root here so Next.js stops guessing.
  outputFileTracingRoot: import.meta.dirname,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Relative asset paths so the bundle loads from file:// inside the webview.
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
};

export default nextConfig;
