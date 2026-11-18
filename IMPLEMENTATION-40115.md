# Naseem 4.1.0 — candidate build 40115

## Implemented in this source candidate

- Kept the existing five-destination navigation, LastWave-inspired Liquid Glass bottom bar, and animated waveform seek bar from build 40114.
- Preserved the existing You hub and its consolidated Settings/More entry points.
- Added an edition-aware Quran page reader with distinct Madani, Indo-Pak, Indo-Pak 15-line and Indo-Pak 16-line choices.
- Added a Quran Foundation server-side Worker adapter. It supports secure OAuth2 Content API access without putting client secrets or access tokens in the Android app.
- Added Mushaf-specific page boundaries:
  - Madani: existing AlQuran Cloud 604-page reader.
  - Indo-Pak: Quran Foundation Mushaf ID 3, 604 pages.
  - Indo-Pak 15-line: Mushaf ID 6, 610 pages, with word-level page/line positions and the compatible IndoPak Nastaleeq font.
  - Indo-Pak 16-line: Mushaf ID 7, 548 pages, page-bounded verse/word rendering.
- Added verse-to-page lookup when switching editions, page previous/next controls and swipe navigation, page/verse/15-line reading modes, and page bookmarks.
- Page rendering filters word data by each word's own `page_number`, so ayahs spanning pages are not duplicated as full verses on adjacent pages.
- Added proper skeleton states to network-backed Hadith loading, in addition to existing Quran list/verse skeletons.
- Kept public versionName `4.1.0`, package ID `com.noor.adhkar`, and advanced Android versionCode to `40115`.
- Bumped the service-worker cache to `noor-adhkar-cache-v4115`.
- Did not alter the existing signing configuration, keystore, alias or GitHub signing secrets.

## External service activation required

The Indo-Pak editions use Quran Foundation Content APIs. The source includes `quran-foundation-worker/`, which must be deployed with a Quran Foundation Backend/server app's approved Content API credentials. The client secret must remain in Worker secrets. Pre-live contains only Al-Fatihah and Al-Baqarah; full-Quran use requires production access approval. Configure the deployed Worker URL in `www/quran-config.js`.

No API credentials, tokens, font binaries, or Quran text dumps are included in this ZIP. The compatible IndoPak Nastaleeq font and Indo-Pak content are fetched at runtime from Quran Foundation.

“Makki” is not exposed as a separate standard Mushaf page-layout ID in the Quran Foundation Mushaf catalogue. The app does not mislabel a script or page mapping as a Makki edition.

## Validation

- JavaScript syntax checks: quran reader, Hadith library, Worker and Android patch script.
- Source-level Mushaf integration contract test.
- Existing regression tests for Quran reader, navigation, release configuration, Android patching, fluid motion, Quran memory, responsive foundation and static source.
- Full `npm run build` remains dependent on installing the declared `esbuild` dev dependency.
- No Android Gradle APK build or physical-device QA is claimed in this source-only delivery.
