# Naseem V4.0.7 — source validation report

## Scope implemented in this patch
- Dua Library is accessible from Salah & Duas; its back navigation returns to Salah.
- Glance is surfaced on Home and keeps an offline fallback. The feed endpoint is not displayed in the UI.
- Widget Studio covers the two implemented native widgets (Prayer Times and Tasbeeh) and syncs data automatically.
- The selected Sunni learning profile aligns the Asr shadow rule; the calculation method remains independently selectable. Ja'fari-specific prayer-time calculations are explicitly not claimed.
- New installs default to Hanafi Asr; valid saved Asr settings are preserved.
- Notification permission is requested from the reminder flow, not during onboarding.
- Profile-name updates populate the account input.
- One screen-transition animation remains; the opening animation is retained.
- Native builds unregister the old PWA worker/cache without clearing localStorage; browser PWA caching is versioned and network-first for app code.

## Validation to run
- JavaScript syntax checks for all modified modules.
- `tests/test_new_tools.js`, `tests/test_v404_source.js`, `tests/test_android_patch.mjs`, `tests/test_adhkar_core.js`, `tests/test_signing.mjs`.
- `tests/verify_salah_engine.py`.
- Full Playwright UI tests and a GitHub Actions Android build.

## Not claimed as verified here
- Samsung-device behaviour for widgets, notification scheduling, exact alarms, Qibla sensor permissions and APK update handling.
- Live Glance/Dua feed availability and update-notification end-to-end behaviour.
- Qualified scholarly review of Arabic, transliteration, translations and school-specific Salah content.
- Signing-key continuity in the actual GitHub Actions environment. Keep the existing keystore and credentials unchanged.

This is a release-candidate build, not a verified Play Store/public release.

## V4.0.7 build-preparation checks (2026-11-11)

Passed in the preparation environment:
- `tests/test_new_tools.js` (16 assertions)
- `tests/test_v404_source.js`
- `tests/test_android_patch.mjs`
- `tests/test_adhkar_core.js`
- `tests/test_signing.mjs`
- `tests/test_release_config.mjs`
- `tests/test_v404_static.py`
- `tests/verify_salah_engine.py` (9,840 comparisons; worst difference 0.55 min)

Not completed here:
- `npm install` timed out, so `npm run build` could not be run in this environment.
- No Android SDK/Gradle APK build was run here.
- No signed release build, GitHub Release, or physical-device test is claimed.
- The GitHub release workflow still requires the four repository signing secrets described in `RELEASE-SETUP.md`.
