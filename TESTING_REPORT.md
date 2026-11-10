# Naseem V4.0.5 — source validation report

## Passed in this environment
- JavaScript syntax checks for changed app modules.
- `tests/test_new_tools.js`: 16 assertions.
- `tests/test_v404_source.js`: V4.0.5 onboarding, feature routes, More navigation and public update client assertions.
- `tests/test_android_patch.mjs`: simulated native Android integration and versionCode 40005.
- `tests/test_adhkar_core.js`: Adhkar session logic.
- `tests/test_signing.mjs`: Gradle signing patch logic.
- `tests/verify_salah_engine.py`: 9,840 prayer-engine comparisons; worst difference 0.55 minutes, within the 1-minute tolerance.

## Not verified here
- `npm install` timed out, so `npm run build` and the Android APK build were not completed in this environment.
- No real Samsung device validation was performed.
- The public repository `midhT/Naseem-public` must be created and populated before remote Dua/Glance feeds and release checks can return live content. Until then, built-in/cached content remains available.
- Online Hijri date and upcoming occasion refreshes are best-effort and fall back to the device calendar/cache; local moon-sighting announcements remain authoritative.
- Ramadan card uses Fajr as the Sehri cutoff and Maghrib as Iftar based on the configured local prayer schedule; users should follow their local mosque timetable.
- Zawal-specific timing, a dedicated Ramadan timetable API, complete Islamic occasion API integration, final release signing continuity, and Play Store readiness remain to be verified/completed.

**Status: release candidate source package only. Do not describe as public-release ready until GitHub Actions succeeds and device tests pass.**
