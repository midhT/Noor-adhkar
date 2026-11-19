# Naseem 4.1.0 — candidate build 40114

## Scope implemented

### Primary navigation and You hub
- Reduced the bottom navigation to five destinations: Home, Dhikr, Salah, Quran and You.
- Combined the former More and Settings entry points under You. The You screen contains direct links to More features and Zakat, followed by the existing account and settings groups.
- The profile button in the top bar still opens the account section; profile photo/name editing remains available and local-only.
- Added a LastWave-inspired Liquid Glass treatment to the bottom navigation, with a muted emerald active state and light-theme adaptation.

### Quran player and reading
- Replaced both mini-player and full-player range tracks with an interactive waveform seek control. Progress fill and playhead remain synchronized with audio time; pointer seeking and keyboard arrow seeking are supported.
- Preserved the existing recitation queue, reciter selection, word-timing path, verse follow-along, lyrics, bookmarks, memorisation and cross-screen playback.
- Added a true Madani page reader using the provider's 604-page Uthmani mapping, including previous/next page navigation and page-specific ayah rendering.
- Added verse mode and a one-ayah-per-line text mode. The line mode is a reading presentation, not a reproduction of the printed 15-line Mushaf's exact line breaks.
- Kept the existing Arabic / English translation display control.
- Added visible Indo-Pak and Makki layout choices, but left them disabled. The available provider/source set in this workspace does not establish verified page maps and line assets for those layouts. They must not be presented as ready until their source text, page mapping, line mapping and licensing are verified.

### Loading and performance
- Preserved visible skeleton placeholders for the Quran index and reader, including the new page reader.
- Retained animation-frame batching for long Surah/ayah lists and debounced Quran search.
- Added content/paint containment for long Quran lists to reduce off-screen rendering work.
- The rest of the app's existing motion/performance modes and reduced-motion handling remain intact.

## Release identity
- Public version: `4.1.0`
- Android versionCode: `40114`
- Application ID: `com.noor.adhkar`
- Service-worker cache: `noor-adhkar-cache-v4114`
- Signing workflow, keystore configuration and protected signing secrets were not changed.
- This is a candidate source archive, not a built or published APK. The public release feed remains unchanged.

## Validation completed
- JavaScript syntax checks for changed files.
- `tests/test_quran_reader.js`
- `tests/test_v404_source.js`
- `tests/test_release_config.mjs`
- `tests/test_android_patch.mjs`
- `tests/test_public_release_requirements.cjs`
- `tests/test_fluid_motion.cjs`
- `tests/test_quran_memory.js`
- `tests/test_navigation_contract.py`
- `tests/test_responsive_foundation.py`
- `tests/test_v404_static.py`

## Validation not completed
- Full `tests/run.sh` did not finish within the available execution window.
- `npm run build` cannot run because `node_modules` / `esbuild` are not installed in this workspace.
- Browser automation and visual comparison on a phone have not been completed.
- Android Gradle build, signed APK generation, in-place update test and physical-device performance/audio QA remain outstanding.

Do not install or distribute this source as an APK until the build workflow succeeds, the original signing certificate is confirmed, and device QA passes.
