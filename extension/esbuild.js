const esbuild = require('esbuild');
const path = require('path');

const prod = process.argv.includes('--watch') === false;

esbuild
  .build({
    entryPoints: [path.join(__dirname, 'src', 'index.tsx')],
    bundle: true,
    outfile: path.join(__dirname, 'dist', 'workspace.js'),
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    define: { 'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development') },
    sourcemap: !prod,
    minify: prod,
    jsx: 'automatic',
  })
  .then(() => console.log('workspace.js built'))
  .catch(() => process.exit(1));