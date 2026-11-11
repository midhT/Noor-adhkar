#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PLAYWRIGHT_NODEJS_PATH="${PLAYWRIGHT_NODEJS_PATH:-$(command -v node)}"

PASS=0
CURRENT="initialisation"

trap 'code=$?; echo; echo "FAILED: $CURRENT (exit $code)"; exit "$code"' ERR

run() {
  CURRENT="$1"
  shift
  echo
  echo "========================================"
  echo "RUNNING: $CURRENT"
  echo "========================================"
  "$@"
  PASS=$((PASS + 1))
  echo "PASS: $CURRENT"
}

echo "NASEEM - COMPLETE TEST RUN"
echo "Project: $ROOT"
echo

if [ ! -d node_modules ]; then
  echo "Dependencies missing. Run npm install first."
  exit 1
fi

run "Production build" npm run build

run "New tools tests" node tests/test_new_tools.js
run "V4.0.7 source integration" node tests/test_v404_source.js
run "V4.0.7 scoped features" node tests/test_v407_scope.js
run "Android native integration" node tests/test_android_patch.mjs
run "Adhkar core" node tests/test_adhkar_core.js
run "Release signing" node tests/test_signing.mjs
run "Hadith Library" node tests/test_hadith_library.js
run "Quran Reader" node tests/test_quran_reader.js

CURRENT="Preparing native test bundle"
rm -rf tests/.build
mkdir -p tests/.build
cp -r www tests/.build/wwwtest

CURRENT="Native test bundle"
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
    '@capacitor/app': resolve('tests/stubs/app.js'),
    '@capacitor/haptics': resolve('tests/stubs/haptics.js'),
    '@capacitor/status-bar': resolve('tests/stubs/statusbar.js'),
    '@capacitor/local-notifications': resolve('tests/stubs/ln.js'),
    '@capacitor/filesystem': resolve('tests/stubs/fs.js'),
    '@capacitor/share': resolve('tests/stubs/share.js')
  },
  logLevel: 'warning'
});

console.log('Native test bundle created successfully.');
NODE
PASS=$((PASS + 1))
echo "PASS: Native test bundle"

if [ -n "${ANDROID_ROOT:-}" ] || [ -n "${ANDROID_DATA:-}" ]; then
  echo
  echo "ANDROID/TERMUX DETECTED"
  echo "Skipping six browser tests: Playwright does not support Android."
  echo "These tests must run on Linux CI."
  echo "SKIPPED: M2 UI, Scheduling, Motion, P0, Adhkar UI, Compass navigation."
else
  run "M2 UI tests" python3 tests/test_m2_ui.py
  run "Scheduling tests" python3 tests/test_scheduling.py
  run "Motion tests" python3 tests/test_motion.py
  run "P0 tests" python3 tests/test_p0.py
  run "Adhkar UI tests" python3 tests/test_adhkar_ui.py
  run "Compass navigation tests" python3 tests/test_compass_nav.py
fi

run "Salah engine verification" python3 tests/verify_salah_engine.py

echo
echo "========================================"
echo "ALL TESTS PASSED"
echo "Successful stages: $PASS"
echo "========================================"
