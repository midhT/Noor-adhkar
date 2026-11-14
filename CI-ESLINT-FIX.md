# CI ESLint fix (2026-11-14)

Resolved the reported `no-undef`/parser failures:

- Use `window.NoorSheet.sync()` and `window.NoorTime.valid()` for APIs explicitly exported on `window`.
- Publish the active screen as `window.curScreen` and have motion navigation read that shared property, avoiding undeclared lexical references.
- ESLint now parses browser source as modules (so `www/native.js` imports are valid), enables the Node environment for the generated Node global, declares the intentional cross-script globals `save` and `renderAll`, and excludes the generated `www/native.bundle.js` from source linting. The generated bundle remains included in `node --check` syntax validation.

Validation in this environment: all `node --check` targets passed and `bash -n tests/run.sh` passed. ESLint itself could not be run locally because the ESLint dependency is not installed and package registry access is unavailable. GitHub Actions should run the configured ESLint command as the authoritative check.
