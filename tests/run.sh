#!/usr/bin/env bash
# Runs the Noor UI/behaviour tests in a phone-sized Chromium with the native Capacitor layer mocked.
# Needs: node + `npm install` already done, and `pip install playwright && playwright install chromium`.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf .build && mkdir -p .build && cp -r ../www .build/wwwtest
S=$PWD/stubs
npx esbuild ../www/native.js --bundle --platform=browser --format=iife --outfile=.build/wwwtest/native.bundle.js \
  --alias:@capacitor/core=$S/core.js --alias:@capacitor/haptics=$S/haptics.js --alias:@capacitor/status-bar=$S/statusbar.js \
  --alias:@capacitor/local-notifications=$S/ln.js --alias:@capacitor/filesystem=$S/fs.js --alias:@capacitor/share=$S/share.js --log-level=warning
python3 test_m1_ui.py
python3 test_reminders_widgets.py
