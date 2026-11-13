# Naseem 4.1.0 — UI refinement and dedicated Quran tab

## Included
- Added Quran as a first-class bottom-navigation destination, between Salah and More.
- Updated primary tab ordering for screen transitions and swipe navigation.
- Reworked the Quran entry screen around a reading-resume panel and Surah / Juz / Page / Bookmarks navigation.
- Added local verse bookmarks, page navigation (1–604), adjustable Arabic text size, and persistent font-size preference.
- Kept existing AlQuran Cloud text/audio handling, recently opened text cache, IndexedDB offline text storage, translation selector and acknowledgements.
- Refined bottom-navigation geometry and reserved additional scroll space so the bar does not cover the final content.
- Reduced excessive card rounding and tightened spacing/button dimensions.
- Tightened Salah learning profile and search layout so lessons receive more visual priority.

## Preserved
- Public app version remains 4.1.0; this change does not change the release version.
- Package ID, signing configuration/secrets, release feed and update checker are not modified.
- Prayer calculations, Adhkar data/logic, notifications and native widgets are not intentionally changed.
- Existing first-run onboarding and startup animation source is retained.

## Verification
Passed: JavaScript syntax checks; Quran reader integration checks; update-checker tests; V4.1.0 source/static checks; scoped feature checks; Android patch tests; Adhkar core; custom Adhkar; custom widget; signing tests; Hadith integration; release configuration; seven-tab navigation checks; Salah engine (9,840 comparisons, worst difference 0.55 min).

Not completed in this environment: `npm run build` because the local `esbuild` package is missing from the mounted `node_modules`; browser-based Playwright UI tests because the Chromium executable is not installed. GitHub Actions and physical-device QA remain required before release.
