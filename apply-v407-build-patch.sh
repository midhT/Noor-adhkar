#!/usr/bin/env bash
set -euo pipefail
PATCH_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo 'Run this script from inside the existing Noor-adhkar Git repository.' >&2; exit 1; }
if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  echo 'Working tree is not clean. Commit or stash your current changes before applying this patch.' >&2
  exit 1
fi
FILES=(
  .github/workflows/build-apk.yml
  .github/workflows/release.yml
  .gitignore
  CHANGELOG.md
  README.md
  RELEASE-SETUP.md
  TESTING_REPORT.md
  apply-v407-build-patch.sh
  package.json
  public-content/release.json
  docs/public-feed/release.json
  scripts/apply-signing.mjs
  tests/test_android_patch.mjs
  tests/test_release_config.mjs
  tests/test_signing.mjs
  tests/test_v404_source.js
  docs/IMPLEMENTATION_STATUS.md
  docs/public-feed/release.json
  tests/test_v404_static.py
  www/features-v404.css
  www/index.html
  www/public-updates.js
  www/settings.js
  www/sw.js
  www/v404.js
)
for file in "${FILES[@]}"; do
  mkdir -p "$ROOT/$(dirname "$file")"
  cp -f "$PATCH_DIR/$file" "$ROOT/$file"
done
rm -f "$ROOT/.github/workflows/build-naseem.yml"
rm -f "$ROOT/signing/naseem.keystore"
rmdir "$ROOT/signing" 2>/dev/null || true
echo 'Naseem V4.0.7 build patch applied.'
echo 'Next: run the tests, configure GitHub Actions secrets, and publish the public-feed JSON separately.'
