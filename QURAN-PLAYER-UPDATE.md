# Naseem 4.1.0 · Quran/player update · Android build 40110

## Quran and recitation UI
- Added a dedicated full-screen recitation player, separate from the Quran reading surface, with an immersive accent-tinted backdrop, ornamental art, surah/ayah identity, Arabic ayah preview, seek bar, elapsed/duration labels, previous/pause/next/stop controls, and a close action.
- The compact player opens the full player and remains available while navigating other Naseem screens. Playback controls continue to operate on the same audio element/queue.
- Word-by-word synchronisation is included for the full Quran using Muhammad Al-Luhaidan recordings. Each surah loads its CC0 word-timing JSON and the exact audio URL paired with that timing dataset; word positions are highlighted from the recording timeline, including repeated recited words. The selected reciter is shown in the full player. Seeking across the surah also moves the active ayah and word highlight to the matching timestamp. The timing dataset is served from a version-pinned CDN and cached locally after first load; audio streams online from the recording provider. Timing data is CC0 1.0; the recording remains the property of its provider.
- The existing Quran index, reading, bookmarks, offline text, and memorisation flows remain in place.

## Visual treatment
- The player uses static artwork and the existing Naseem accent tokens. No ambience layer or animated background effect is included.

## Update reliability
- App build code advanced to 40110; public display version remains 4.1.0.
- Update checks now bypass stale HTTP caches and use GitHub's Contents API as a fallback if the raw `release.json` endpoint fails.
- Same-version builds are detected by the Android version code.
- Application ID remains `com.noor.adhkar`. Release workflows continue to use the existing protected keystore secrets; no key is generated or replaced.
- The native updater downloads the official GitHub APK, checks its SHA-256 value from the release feed, and opens Android’s package installer for explicit confirmation. A signed CI artifact and in-place installation on the target device are not verified in this source-only environment.

## Validation status
- JavaScript syntax and source-level tests are run before delivery. Word-timing integration is validated against the published CC0 schema; live CDN/audio playback still requires network and device verification.
- GitHub Actions signed build and physical-device UI/update testing remain required.
