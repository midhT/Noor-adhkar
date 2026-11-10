# Naseem V4.0.4 — source validation report

## Passed in this environment

- JavaScript syntax checks for application scripts and build scripts.
- `tests/test_v404_source.js`: feature routes, package version, feed, onboarding and backup registration.
- `tests/test_android_patch.mjs`: simulates a generated Capacitor Android project and verifies MainActivity/plugin Java, widget resources, manifest receivers/permissions and version code are copied.
- `tests/test_new_tools.js`: Qibla and Zakat unit tests.
- `tests/test_adhkar_core.js`: Adhkar session logic tests.
- `tests/test_signing.mjs`: signing Gradle patch tests.
- `tests/verify_salah_engine.py`: 9,840 prayer-engine comparisons; worst difference 0.55 minutes, within 1 minute.

## Not verified here

- `npm install` timed out, so `npm run build` could not be completed in this environment. GitHub Actions must install dependencies and run the build.
- Browser UI tests could not run: the environment blocks local browser navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- No Android Gradle APK was built here.
- No Samsung device was available. All sensors, local notifications, widgets, first-run onboarding, update installation and actual rendering still require testing on the user's Galaxy device.

## Release gate

A successful GitHub Actions build is not proof of runtime correctness. Install the APK on the Samsung, verify the new Explore cards and each flow, check widgets via the launcher, then verify an in-place update using the existing signing key before considering public distribution.
