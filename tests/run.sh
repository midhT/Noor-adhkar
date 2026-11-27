#!/usr/bin/env bash
# Run source and phone-sized browser tests from the project root.
# Needs: npm dependencies plus Playwright Chromium installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
for js in www/*.js scripts/*.mjs tests/*.js tests/*.mjs; do node --check "$js"; done
echo 'JavaScript syntax checks: passed'
if [[ "${SKIP_ESLINT:-0}" != "1" ]]; then
  npx --yes eslint@8.57.1 --no-eslintrc --ignore-pattern 'www/native.bundle.js' --env browser,es2021,node --parser-options '{"ecmaVersion":2022,"sourceType":"module"}' --rule '{"no-undef":"error"}' --global switchScreen --global toast --global state --global save --global renderAll --global module --global exports --global require --global process www/*.js
  echo 'ESLint no-undef checks: passed'
else
  echo 'ESLint no-undef checks: explicitly skipped (local dependency unavailable).'
fi
node tests/test_new_tools.js
node tests/test_v404_source.js
node tests/test_v407_scope.js
node tests/test_android_patch.mjs
node tests/test_widget_native_sources.mjs
node tests/test_adhkar_core.js
node tests/test_custom_routines.js
node tests/test_custom_widget.js
node tests/test_signing.mjs
node tests/test_hadith_library.js
node tests/test_quran_reader.js
node tests/test_quran_memory.js
node tests/test_quran_foundation_worker.mjs
node tests/test_mushaf_integration.js
node tests/test_quran_player_core.js
node tests/test_fluid_motion.cjs
node tests/test_release_config.mjs
node tests/test_public_updates.cjs
node tests/test_salah_tracker_time.js
node tests/test_salah_gender_tracking.cjs
node tests/test_cycle_tracker.cjs
node tests/test_public_release_requirements.cjs
rm -rf tests/.build && mkdir -p tests/.build && cp -r www tests/.build/wwwtest
node "$ROOT/tests/build_native_bundle.cjs"
python3 tests/test_v404_static.py
python3 tests/test_responsive_foundation.py
python3 tests/test_navigation_contract.py
# TERMUX_PLAYWRIGHT_SUITE_GUARD
run_py_test() {
  local test="$1"
  if { [ -n "${TERMUX_VERSION:-}" ] || [[ "${PREFIX:-}" == *"/com.termux/"* ]]; } &&
     grep -Eq 'sync_playwright|from playwright' "$ROOT/$test"; then
    if [[ "${REQUIRE_BROWSER_TESTS:-0}" == "1" ]]; then
      echo "ERROR: required browser test cannot be skipped: $test" >&2
      return 1
    fi
    echo "SKIP (Termux only): $test requires Playwright browser runtime; this is NOT a full validation run."
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
NASEEM_FULL_MOTION=1 run_py_test tests/test_quran_ui.py
run_py_test tests/test_sleep_timer_ui.py
run_py_test tests/test_glass_ui.py
run_py_test tests/test_full_player_ui.py
run_py_test tests/test_wavy_seek_ui.py
run_py_test tests/test_back_button_ui.py
run_py_test tests/test_media_bridge_ui.py
run_py_test tests/test_background_handoff_ui.py
run_py_test tests/test_nav_collapse_ui.py
run_py_test tests/test_glance.py
run_py_test tests/test_quran_extras.py
run_py_test tests/test_adhkar_layout.py
run_py_test tests/test_quickview_margins.py
run_py_test tests/test_layout_overlap.py
run_py_test tests/test_onboarding_responsive.py
python3 tests/verify_salah_engine.py
node tests/test_hadith_library.js
node tests/test_quran_reader.js
