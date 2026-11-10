# Noor V3.3 — Milestone 2 / 2.1 testing report

## Verified (automated, run `bash tests/run.sh`)
- 58 UI checks, all passing: five tabs, touch scrolling on every screen, Kashmir defaults pre-filled in 12-hour time, Home has no editor, Settings groups, method/Asr/city/GPS (mocked fix)/±minutes/reset, Jamaat offset and fixed time, My own times, account name and photo, user-chosen audio, backup export and 10 kinds of rejected restore, restore of Salah/profile/progress.
- 16 scheduling checks, all passing (mocked notification plugin): three channels, Adhan sound file, 21-day horizon, unique ids, no duplicates after changes, Fajr silent, heads-up and Jamaat separate, reschedule on prayer edits, cancel on off, test alarm, 21 dated widget entries.
- Calculation engine vs independent NOAA-series reference: 9,840 comparisons across 5 cities, 4 methods, 2 Asr modes; worst 0.55 min.

## Added in 2.1 (automated, 40 checks, all passing)
Merged Dhikr tab, themed sheet menus (open, choose, close by tap/drag, no un-themed select left), swipe navigation incl. ignored cases, Smooth/Full mode persistence, no horizontal overflow at 320/360/393/412/600 px.
UI suite is now 57 checks; scheduling 16.

## Not verified (needs a real phone / CI)
- APK build in GitHub Actions.
- Alarms ringing with screen locked, after reboot, under battery restrictions.
- Full-length Adhan as a channel sound (Android may shorten it; Tone is the fallback).
- Location permission prompt inside the Android WebView.
- Real-device smoothness (Samsung A17 5G) and swipe feel; automated tests cannot measure frame rate.
- Instagram link opening the Instagram app/browser from the WebView.
- Widgets (prayer, tasbeeh) on a launcher; themed monochrome icon.
- Agreement with local Kashmir mosque timetables (they may differ by a few minutes; use adjustments).

## Known limits
- High-latitude fallback is night-middle only.
- USE_EXACT_ALARM may need justification if published on Google Play.

## V4.0.1 accent selector checks
- `node --check www/accent.js` — passed.
- `node --check www/settings.js` — passed.
- `node --check scripts/patch-android.mjs` — passed.
- Accent runtime smoke test (default, preset, custom, persisted value, CSS token) — passed.
- Prayer-engine comparison — 9,840 comparisons, all within 1.0 minute.
- Playwright browser tests were blocked because the Chromium executable is unavailable in this environment.
- APK build and real-device installation were not performed.


## V4.0.2 first-pass tool checks
- `node tests/test_new_tools.js`: 16 assertions passed for Zakat arithmetic (2.5% estimate, below-nisab, lunar-year gate, liabilities) and Qibla bearing/distance/cardinal direction validation.
- `node --check` passed for the new tool scripts and changed app scripts; HTML parsing passed.
- Existing prayer-engine regression: 9,840 comparisons; worst difference 0.55 minutes; all within the 1-minute test tolerance.
- Full browser suite and Android APK build were not run in this environment: package installation timed out, and the local browser launch was blocked by the container. Compass/GPS behaviour still needs testing on a physical Android device.

## V4.0.4 source update checks (2026-11-10)

Passed:
- `node --check` for every `www/*.js` file.
- `node tests/test_new_tools.js` — 16 assertions.
- `node tests/test_adhkar_core.js` — all assertions.
- `node tests/test_signing.mjs` — all mock signing assertions.
- `python3 tests/verify_salah_engine.py` — 9,840 comparisons, worst difference 0.55 minutes.
- Static check for unique IDs in `index.html` and presence of all seven new feature screens.
- Simulated Android platform patch: native Java files copied into `com/noor/adhkar`, two widget receivers inserted, versionCode set to 40004.

Blocked / not run:
- `npm install` timed out in this environment, so `npm run build` could not be completed.
- Playwright UI tests could not launch because the Chromium executable is unavailable.
- No Gradle APK build or physical Samsung test was run here.
