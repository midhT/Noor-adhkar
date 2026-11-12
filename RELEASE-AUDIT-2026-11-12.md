# Naseem V4.0.9 — update-test candidate audit (2026-11-12)

## Scoped changes
- Restored the global app accent palette in Settings → Appearance: six presets plus a custom colour picker, applied across light and dark themes.
- Added synchronized Quran recitation playback: active-Ayah highlighting, automatic progression through the remaining Ayahs in the Surah, pause/resume and seeking.
- Consolidated creator, Adhan, Quran text/translation and Hadith provider acknowledgements in Settings → About Naseem. Quran and Hadith screens retain functional/source-scope disclaimers without listing credits.
- Expanded first-run setup to a full-screen experience. Name, learning tradition, prayer city and theme changes are applied as soon as the user changes them; Finish Setup still marks onboarding complete and handles notification permission.
- Bumped the app to 4.0.9 (versionCode 40009) so an installed 4.0.8 build can detect it as an update.

## Checks completed in this environment
- All standalone Node integration/configuration tests passed after updating the version-aware fixtures.
- JavaScript syntax checks passed for all files in `www/`.
- Python scoped static checks passed.
- Prayer-time comparison: 9,840 comparisons; worst difference 0.55 minutes; all within 1.0 minute.

## Checks not completed
- The full `tests/run.sh` suite stops at the native bundle step because `esbuild` is not installed. `npm ci` timed out in this environment, so the production build was not verified.
- Playwright is installed, but its Chromium executable is absent; browser interaction tests were not run.
- Android Gradle compilation and signed APK generation were not run here. They require a network-enabled CI runner and protected signing secrets.

## Release status
**Not release-certified.** Run the complete GitHub Actions test and APK workflows, then test the installed 4.0.9 build on a physical Android device before publishing. The public release feed should be updated only when the matching release artifact is available.
