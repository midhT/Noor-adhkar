#!/usr/bin/env bash
# Run source and phone-sized browser tests from the project root.
# Needs: npm dependencies plus Playwright Chromium installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node tests/test_new_tools.js
node tests/test_v404_source.js
node tests/test_v407_scope.js
node tests/test_android_patch.mjs
node tests/test_adhkar_core.js
node tests/test_custom_routines.js
node tests/test_custom_widget.js
node tests/test_signing.mjs
node tests/test_hadith_library.js
node tests/test_quran_reader.js
node tests/test_release_config.mjs
node tests/test_public_updates.cjs
rm -rf tests/.build && mkdir -p tests/.build && cp -r www tests/.build/wwwtest
S="$ROOT/tests/stubs"
ESB=""
command -v esbuild >/dev/null 2>&1 && ESB=esbuild
[ -x "$ROOT/node_modules/.bin/esbuild" ] && ESB="$ROOT/node_modules/.bin/esbuild"
[ -x /opt/npm-tools/node_modules/.bin/esbuild ] && ESB=/opt/npm-tools/node_modules/.bin/esbuild
if [ -z "$ESB" ]; then echo "Missing esbuild. Run npm install before the browser test suite." >&2; exit 2; fi
node <<'NODE'
const esbuild = require('esbuild');
const path = require('path');
const stubs = path.resolve('tests/stubs');

esbuild.buildSync({
  entryPoints: ['www/native.js'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: 'tests/.build/wwwtest/native.bundle.js',
  alias: {
    '@capacitor/core': path.join(stubs, 'core.js'),
    '@capacitor/app': path.join(stubs, 'app.js'),
    '@capacitor/haptics': path.join(stubs, 'haptics.js'),
    '@capacitor/status-bar': path.join(stubs, 'statusbar.js'),
    '@capacitor/local-notifications': path.join(stubs, 'ln.js'),
    '@capacitor/filesystem': path.join(stubs, 'fs.js'),
    '@capacitor/share': path.join(stubs, 'share.js')
  },
  logLevel: 'warning'
});
NODE

python3 tests/test_v404_static.py
python3 tests/test_navigation_contract.py
IS_TERMUX=0
case "${PREFIX:-}" in
  /data/data/com.termux/*) IS_TERMUX=1 ;;
esac
[ -n "${TERMUX_VERSION:-}" ] && IS_TERMUX=1

if [ "$IS_TERMUX" -eq 1 ]; then
  echo "Termux detected: skipping 7 Playwright browser tests."
  echo "These tests remain enabled for Linux/GitHub Actions."
else
  python3 tests/test_m2_ui.py
  python3 tests/test_scheduling.py
  python3 tests/test_motion.py
  python3 tests/test_p0.py
  python3 tests/test_adhkar_ui.py
  python3 tests/test_custom_routines_ui.py
  python3 tests/test_widget_studio_ui.py
  python3 tests/test_compass_nav.py
fi
python3 tests/verify_salah_engine.py
node tests/test_hadith_library.js
node tests/test_quran_reader.js
