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
node tests/test_quran_memory.js
node tests/test_release_config.mjs
node tests/test_public_updates.cjs
rm -rf tests/.build && mkdir -p tests/.build && cp -r www tests/.build/wwwtest
node "$ROOT/tests/build_native_bundle.cjs"
python3 tests/test_v404_static.py
python3 tests/test_navigation_contract.py
# TERMUX_PLAYWRIGHT_SUITE_GUARD
run_py_test() {
  local test="$1"
  if { [ -n "${TERMUX_VERSION:-}" ] || [[ "${PREFIX:-}" == *"/com.termux/"* ]]; } &&
     grep -Eq 'sync_playwright|from playwright' "$ROOT/$test"; then
    echo "SKIP (Termux only): $test requires Playwright browser runtime."
    return 0
  fi
  python3 "$ROOT/$test"
}
run_py_test tests/test_scheduling.py
run_py_test tests/test_motion.py
run_py_test tests/test_p0.py
run_py_test tests/test_adhkar_ui.py
run_py_test tests/test_custom_routines_ui.py
run_py_test tests/test_widget_studio_ui.py
run_py_test tests/test_compass_nav.py
run_py_test tests/test_quran_ui.py
run_py_test tests/test_glance.py
run_py_test tests/test_layout_overlap.py
python3 tests/verify_salah_engine.py
node tests/test_hadith_library.js
node tests/test_quran_reader.js
