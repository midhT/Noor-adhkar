#!/data/data/com.termux/files/usr/bin/bash

set +e
REPORT="m2-diagnostic-report.txt"

{
    echo "========== NASEEM M2 DIAGNOSTICS =========="
    date
    echo

    echo "========== ENVIRONMENT =========="
    uname -a
    python --version 2>&1
    node --version 2>&1
    echo "CHROMIUM_PATH=${CHROMIUM_PATH:-not set}"
    echo

    echo "========== TEST SERVER =========="
    grep -n -A35 -B5 -E 'class Server|def url|def start|serve_forever' tests/common.py
    echo

    echo "========== ONBOARDING FUNCTION AND CALLS =========="
    grep -n -A12 -B12 'startSetup' www/v404.js
    echo

    echo "========== ONBOARDING STORAGE REFERENCES =========="
    grep -RInE 'naseem-onboarding-complete-v1|setupComplete|v404-onboarding' \
        www tests \
        --exclude-dir=node_modules \
        --exclude-dir=__pycache__ \
        --exclude-dir=.build
    echo

    echo "========== SCRIPT LOAD ORDER =========="
    grep -n '<script' www/index.html
    echo

    echo "========== M2 TEST =========="
    sed -n '1,100p' tests/test_m2_ui.py
    echo

    echo "========== TEST RUNNER BROWSER SECTION =========="
    grep -n -A35 -B8 -E 'Playwright|test_m2_ui|TERMUX' tests/run.sh
    echo

    echo "========== GIT STATUS =========="
    git status --short
    echo

    echo "========== END =========="
} > "$REPORT" 2>&1

cat "$REPORT"
echo
echo "Report saved to: $PWD/$REPORT"
