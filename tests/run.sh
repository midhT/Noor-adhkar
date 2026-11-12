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
rm -rf tests/.build && mkdir -p tests/.build && cp -r www tests/.build/wwwtest
S="$ROOT/tests/stubs"
ESB=""
command -v esbuild >/dev/null 2>&1 && ESB=esbuild
[ -x "$ROOT/node_modules/.bin/esbuild" ] && ESB="$ROOT/node_modules/.bin/esbuild"
[ -x /opt/npm-tools/node_modules/.bin/esbuild ] && ESB=/opt/npm-tools/node_modules/.bin/esbuild
if [ -z "$ESB" ]; then echo "Missing esbuild. Run npm install before the browser test suite." >&2; exit 2; fi
$ESB www/native.js --bundle --platform=browser --format=iife --outfile=tests/.build/wwwtest/native.bundle.js \
  --alias:@capacitor/core="$S/core.js" --alias:@capacitor/app="$S/app.js" --alias:@capacitor/haptics="$S/haptics.js" --alias:@capacitor/status-bar="$S/statusbar.js" \
  --alias:@capacitor/local-notifications="$S/ln.js" --alias:@capacitor/filesystem="$S/fs.js" --alias:@capacitor/share="$S/share.js" --log-level=warning
python3 tests/test_v404_static.py
python3 tests/test_m2_ui.py
python3 tests/test_scheduling.py
python3 tests/test_motion.py
python3 tests/test_p0.py
python3 tests/test_adhkar_ui.py
python3 tests/test_custom_routines_ui.py
python3 tests/test_widget_studio_ui.py
python3 tests/test_compass_nav.py
python3 tests/verify_salah_engine.py
node tests/test_hadith_library.js
node tests/test_quran_reader.js
