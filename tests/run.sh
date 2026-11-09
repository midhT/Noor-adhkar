#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
rm -rf .build
mkdir -p .build/wwwtest
cp -r ../www/. .build/wwwtest/

cd ..
node --input-type=module <<'NODE'
import { build } from 'esbuild';
import { resolve } from 'node:path';

await build({
  entryPoints: ['www/native.js'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: 'tests/.build/wwwtest/native.bundle.js',
  alias: {
    '@capacitor/core': resolve('tests/stubs/core.js'),
    '@capacitor/haptics': resolve('tests/stubs/haptics.js'),
    '@capacitor/status-bar': resolve('tests/stubs/statusbar.js'),
    '@capacitor/local-notifications': resolve('tests/stubs/ln.js'),
    '@capacitor/filesystem': resolve('tests/stubs/fs.js'),
    '@capacitor/share': resolve('tests/stubs/share.js')
  }
});

console.log('Native test bundle built successfully.');
NODE

cd tests
python3 test_m2_ui.py
python3 test_scheduling.py
python3 test_motion.py
python3 verify_salah_engine.py
