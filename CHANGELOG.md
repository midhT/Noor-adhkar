# Naseem Changelog

## 4.1.0 — redesigned opening experience · 12 November 2026
- Rebuilt the in-app opening screen with a refined Arabic/Latin wordmark, geometric emblem, restrained emerald/silver palette, layered motion and safer screen-inset spacing.
- Preserved the existing startup animation behaviour: it appears at launch, dismisses automatically and does not reopen first-run setup.
- Kept the application ID and automated protected release-signing workflow unchanged. Every update must use the original release keystore and alias.

## 4.0.9 — update-test candidate · 12 November 2026
- Restored the global app accent palette in Settings → Appearance, including six presets and a custom colour; preferences remain persistent across light and dark themes.
- Quran recitation now highlights the active Ayah, advances through subsequent Ayahs automatically, and supports pause, resume and seeking.
- Moved contributor and recording acknowledgements into Settings → About Naseem → Credits & Acknowledgements.
- First-run setup now fills the screen and applies name, learning tradition, prayer city and theme selections immediately; completion is still required only to close setup and request notification permission.


## 4.0.8 — working release candidate · 12 November 2026
- Quran Reader saves and resumes the last Surah/Ayah, caches recently opened text for offline reading, and supports on-demand per-Ayah recitation when available.
- First-run onboarding no longer has a Settings reopen action; Android notification permission is explained and requested only when Android reports `prompt`.
- Widget Studio now saves native widget theme, accent and spacing preferences for Prayer, Tasbeeh and Hijri widgets.
- Android widget picker entries use dedicated preview images instead of the app icon.
- Glance and Dua public feeds carry schema/content versions and preserve local fallback data.
- Hijri calendar performs a monthly AlAdhan UAQ comparison and supports a local ±1-day correction.
- Salah settings perform a monthly AlAdhan reference comparison for the selected location, method and Asr rule; local prayer times are never overwritten.
- Startup animation refreshed with theme-aware silver/emerald styling.
- Removed the previously exposed signing key from source; release signing now uses protected CI secrets.

## Release blockers
The user-authored native widget builder, full custom Adhkar routine manager, full offline Quran text/audio corpus, word-level recitation highlighting, qualified religious review and physical-device release QA remain outstanding. See `RELEASE-BLOCKERS.md`.


## V4.0.8 RC3 — Custom Widget Studio
- Added a native Custom Widget users compose from Prayer Times, Tasbeeh, Hijri date and a personal reminder text block.
- Added compact/comfortable spacing, preview, persistent configuration and configurable tap behavior (open Naseem or tap the Tasbeeh block to count).
- Existing native Prayer, Tasbeeh and Hijri widgets refresh the Custom Widget when their data changes.
- Added a dedicated launcher preview image and Android widget-provider metadata.
- The composition is a shared template across Custom Widget instances; independent per-instance layouts are not yet supported.
