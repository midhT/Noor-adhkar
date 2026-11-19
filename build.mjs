import { build } from 'esbuild';

await build({
  entryPoints: ['www/native.js'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'NoorNativeBundle',
  outfile: 'www/native.bundle.js',
  logLevel: 'info'
});
