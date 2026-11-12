# Naseem 4.1.0 onboarding implementation

This change replaces the former single-screen first-launch setup with a six-page animated flow:

1. Welcome
2. Optional name
3. Learning tradition
4. Prayer city search / device location
5. Dark, Light, or System appearance preview
6. Completion summary

Selections are held in a local draft while navigating. The selected profile, school, location, and theme are committed on completion. Skip remains available and marks first-run setup complete without applying the draft. The completion flag remains `naseem-onboarding-complete-v1`, preserving the existing one-time setup contract.

The public app version remains 4.1.0. Android internal `versionCode` advances from 40100 to 40101 so this build can install over the currently installed 4.1.0 APK without changing its displayed version. The package ID, update checker, release feed, Android signing configuration, and startup animation were not intentionally changed.

## Validation

Passed: JavaScript syntax check; V4.1.0 static scope checks; V4.1.0 source integration; V4.0.9 scoped feature checks; public update checker tests; new tools; Adhkar core; custom routines; custom widget; Hadith; Quran reader; release configuration; Salah engine comparison.

Not completed in this environment: `npm run build` because `esbuild` could not be installed (`npm ci` timed out); Playwright browser interaction tests because the browser runtime is not available here. GitHub Actions should run the complete CI/build pipeline after this source is pushed.
