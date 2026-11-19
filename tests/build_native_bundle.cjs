
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tests/.build/wwwtest/native.bundle.js');

fs.mkdirSync(path.dirname(out), {recursive:true});

esbuild.buildSync({
  absWorkingDir: root,
  entryPoints: ['www/native.js'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: out,
  logLevel: 'warning',
  alias: {
    '@capacitor/core': path.join(root,'tests/stubs/core.js'),
    '@capacitor/app': path.join(root,'tests/stubs/app.js'),
    '@capacitor/haptics': path.join(root,'tests/stubs/haptics.js'),
    '@capacitor/status-bar': path.join(root,'tests/stubs/statusbar.js'),
    '@capacitor/local-notifications': path.join(root,'tests/stubs/ln.js'),
    '@capacitor/filesystem': path.join(root,'tests/stubs/fs.js'),
    '@capacitor/share': path.join(root,'tests/stubs/share.js')
  }
});
console.log('Native bundle built successfully through esbuild API.');
