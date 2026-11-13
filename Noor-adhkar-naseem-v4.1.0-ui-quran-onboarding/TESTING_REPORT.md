# Naseem 4.1.0 — onboarding, UI and Quran integration verification

## Included in this source package
- Six-page first-launch onboarding with working tradition, city search, GPS request, theme selection, back/continue navigation and completion persistence.
- Seven main destinations: Home, Dhikr, Salah, Quran, More, Zakat and Settings.
- Dedicated Quran reader with Surah/Juz/Page/Bookmarks navigation, reading progress, bookmarks, Arabic text sizing, translation selection, online recitation and optional offline text storage.
- Compact bottom navigation and adjusted page padding for the seven-tab layout.
- Existing Salah, Adhkar, prayer calculation, widget, startup animation, update checker and app identity source retained.
- Public app version remains 4.1.0. Android patch script calculates internal versionCode 40101 (previous baseline 40100) while keeping versionName 4.1.0.
- Android signing material is not included. Release workflow must use the existing protected signing secrets and same keystore/certificate.

## Checks run in this environment (12 Nov 2026)
- JavaScript syntax checks across www, scripts and test JS files: passed.
- Source integration, new tools, V4.0.7 scope, Android patch, Adhkar core, custom routines, Custom Widget, signing, Hadith, Quran reader, release configuration and public update checker tests: passed.
- Seven-tab navigation and Quran destination contract test: passed.
- V4.1.0 static source test, including six onboarding pages and setup controls: passed.
- Salah engine: 9,840 comparisons; worst difference 0.55 minutes; no failures.

## Not verified here
- Full `tests/run.sh` is blocked at the native bundle test because `esbuild` is not installed. `npm install` exceeded the environment execution window.
- Playwright browser tests were not run in this environment; local-file and loopback navigation were blocked by the browser execution policy.
- Android Gradle build, signed APK generation, signature comparison against the installed app, device installation and physical UI testing have not been performed.
- Full offline Quran download recovery, storage limits and complete 114-Surah download remain device QA items.

This package is a source candidate, not a signed APK or release approval. GitHub Actions must pass before installation. Preserve the existing signing key and all four NASEEM signing secrets.
- Added a manual `Build signed Naseem 4.1.0 candidate (no public release)` workflow. It uses the existing four signing secrets, builds and verifies a signed APK, records its certificate fingerprint and uploads an Actions artifact without creating a public GitHub release or changing the public update feed.

## Responsive UI stabilisation patch (13 November 2026)
- Added `www/responsive.css` after all existing stylesheets; it provides dynamic viewport/safe-area handling, narrow-phone action reflow, larger touch targets, tablet content sizing and landscape fallbacks.
- The onboarding overlay now scrolls as one surface. Completion closes immediately and no longer waits for notification permission; explicit reminder actions retain their own permission requests.
- The service-worker cache was advanced to `noor-adhkar-cache-v4082` and now precaches `responsive.css`.
- Added static responsive-source checks and expanded the existing layout-overlap viewport matrix to compact phones, larger phones, tablets and landscape. The onboarding browser regression now taps the visible school choice card and checks that it synchronises with the stored selection.
- Passed in this environment: JavaScript syntax checks, responsive CSS parse (42 rules, zero parse errors), responsive/static source checks, navigation contract, source integration, V4.0.9 scope, release configuration, update checker, signing source checks, new tools, Adhkar core, custom routines/widgets, Hadith and Quran reader/memory tests.
- Not verified in this environment: Chromium UI interaction or physical-device rendering. The installed browser was blocked from navigating to local-file and loopback test URLs, and the Node Playwright dependency was not installed. CI must run the new browser tests and the expanded layout matrix before the APK is distributed.
- No Android APK was built in this patch. The existing package identity, release signing workflow and protected signing secrets were left unchanged; this is a source update for CI validation.
