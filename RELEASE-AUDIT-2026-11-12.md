# Naseem V4.0.8 RC3 — extended release audit (2026-11-12)

## Changes in this audit
- Kept the M2 returning-user test's dual storage seed: `naseem-onboarding-complete-v1` and `naseem-v404-settings.setupComplete` are written before app startup. The test asserts both values and reports storage-seed errors.
- Updated all three GitHub Actions workflows to retry npm and pip downloads, use a deterministic Python 3.12 runtime where needed, provision Android SDK platform/build-tools 35 explicitly, configure Gradle caching, and allocate realistic job timeouts.
- The debug APK workflow now runs the full source + Playwright browser verification suite before Android compilation, matching the stricter verification path used by the other workflows.
- No production onboarding behavior was bypassed or changed.

## Checks completed successfully in this environment
- 12 standalone Node integration/configuration test files passed.
- JavaScript syntax checks passed for `www/*.js`, `scripts/*.mjs`, and `tests/*.js` / `tests/*.mjs`.
- All three GitHub Actions YAML files parsed successfully.
- The source ZIP integrity check passed.

## Three release checks still requiring a network-enabled CI runner
1. **npm production build:** dependency installation timed out because package registry access is blocked in this execution environment. Consequently `npm run build` could not be executed here. The workflows now use explicit retries and longer fetch timeouts.
2. **Playwright browser suite:** Python Playwright is installed, but Chromium navigation to localhost is blocked by this environment with `ERR_BLOCKED_BY_ADMINISTRATOR`. The M2 test setup is source-corrected and diagnostic, but its browser result remains unverified here.
3. **Android Gradle compilation:** this environment has no Android SDK, no Gradle installation, and cannot fetch npm/Gradle dependencies. The CI workflows now provision Android SDK 35 and Gradle caching, but `assembleDebug` / `assembleRelease` were not run here.

## Release status
**Not release-certified.** These CI workflow changes improve the chance of completing the three blocked checks on GitHub-hosted runners, but they are not substitutes for successful CI logs. Do not publish the APK until the full verification workflow and signed build pass. Release signing still requires the repository owner's protected GitHub secrets. Physical-device installation and product-specific review remain separate release gates.
