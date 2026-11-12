# Naseem V4.0.8 RC3 — verification record

## Re-run in the working environment (12 Nov 2026)
- JavaScript syntax check across `www/*.js`, `scripts/*.mjs`, `tests/*.js` and `tests/*.mjs`: passed.
- Source checks passed: new tools (16 assertions), V4.0.4 source integration, V4.0.7 scope, Android patch, Adhkar core, custom Adhkar, custom Widget Studio composition, signing, Hadith, Quran Reader and release configuration.
- Salah engine: 9,840 comparisons; worst difference 0.55 minutes against its reference set.
- Python test files compile successfully.
- Custom Widget source checks confirm content block selection (Prayer/Tasbeeh/Hijri/personal reminder), layout density, tap action, persisted configuration bridge, native provider, widget metadata and preview asset.
- Android patch integration test confirms the new Custom Widget provider, layout, metadata and preview are copied into a generated Android project and declared in the manifest.

## Not verified in this environment
- `npm install` exceeded the available execution window. `npm run build` and the bundled web app build could not be run here.
- Playwright UI test execution was attempted but Chromium navigation to the local test server was blocked by the execution environment. The UI suite is configured in GitHub-hosted Linux CI.
- Android Gradle compilation, APK signing, installation and physical-device QA have not been performed.
- Public repository publication has not been performed.
- The complete Quran text downloader is source-checked only; test interrupted download recovery, storage limits and a complete 114-Surah download on Android.

These checks are not release approval. See `RELEASE-BLOCKERS.md`.
