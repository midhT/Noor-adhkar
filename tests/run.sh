#!/usr/bin/env bash
# Runs the Noor UI/behaviour tests in a phone-sized Chromium with the native Capacitor layer mocked.
# Needs: node + `npm install` already done, and `pip install playwright && playwright install chromium`.
set -euo pipefail
cd "$(dirname "$0")"
node test_new_tools.js
node test_v404_source.js
node test_android_patch.mjs
node test_adhkar_core.js
node test_signing.mjs
rm -rf .build && mkdir -p .build && cp -r ../www .build/wwwtest
S=$PWD/stubs
ESB="npx --no-install esbuild"; command -v esbuild >/dev/null 2>&1 && ESB=esbuild
[ -x ../node_modules/.bin/esbuild ] || ESB="/opt/npm-tools/node_modules/.bin/esbuild"
[ -x ../node_modules/.bin/esbuild ] && ESB="../node_modules/.bin/esbuild"
$ESB ../www/native.js --bundle --platform=browser --format=iife --outfile=.build/wwwtest/native.bundle.js \
  --alias:@capacitor/core=$S/core.js --alias:@capacitor/app=$S/app.js --alias:@capacitor/haptics=$S/haptics.js --alias:@capacitor/status-bar=$S/statusbar.js \
  --alias:@capacitor/local-notifications=$S/ln.js --alias:@capacitor/filesystem=$S/fs.js --alias:@capacitor/share=$S/share.js --log-level=warning
python3 test_m2_ui.py
python3 test_scheduling.py
python3 test_motion.py
python3 test_p0.py
python3 test_adhkar_ui.py
python3 test_compass_nav.py
python3 verify_salah_engine.py
