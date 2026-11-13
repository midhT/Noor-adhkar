# Naseem Changelog

## 4.1.0 — responsive UI stabilisation patch · 13 November 2026
- Reworked the first-run overlay to use a single scrollable viewport, safe-area insets and dynamic viewport sizing for short, tall and landscape displays.
- Prevented onboarding action buttons from overflowing or colliding on narrow phones; enlarged learning-tradition touch targets and preserved selection state.
- Removed notification-permission prompts from onboarding completion so setup closes immediately; reminders can request permission from their own explicit actions in Settings/features.
- Added a responsive foundation for compact phones, larger phones and tablets, including adaptive content widths, grids and navigation sizing.
- Added static responsive checks and strengthened the onboarding interaction regression test.


## 4.1.0 — redesigned opening experience · 12 November 2026
- Rebuilt the in-app opening screen with a refined Arabic/Latin wordmark, geometric emblem, restrained emerald/silver palette, layered motion and safer screen-inset spacing.
- Preserved the existing startup animation behaviour: it appears at launch, dismisses automatically and does not reopen first-run setup.
- Kept the application ID and automated protected release-signing workflow unchanged. Every update must use the original release keystore and alias.

## 4.0.9 — update-test candidate · 12 November 2026
- Restored the global app accent palette in Settings → Appearance, including six presets and a custom colour; preferences remain persistent across light and dark themes.
- Quran recitation now highlights the active Ayah, advances through subsequent Ayahs automatically, and supports pause, resume and seeking.
- Moved contributor and recording acknowledgements into Settings → About Naseem → Credits & Acknowledgements.
- First-run setup now fills the screen and applies name, learning tradition, prayer city and theme selections immediately; completion is still required only to close setup; notification permission is requested by explicit reminder actions.


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

## 4.1.0 — onboarding, Salah and More stabilisation

- Reworked first-run setup into seven responsive steps, including an explicit notification-permission opt-in.
- Removed duplicate hidden learning-tradition and appearance selectors; visible choice cards now own selection state.
- Moved the live prayer timetable, next-prayer/Jamaat information and countdown into the Salah tab. Added a direct Qibla shortcut and retained Prayer settings access.
- Collapsed recitation learning into a secondary guide so the live prayer schedule remains the primary Salah experience.
- Reduced and separated the Dua Library shortcut from the final Salam recitation.
- Removed the duplicate school-profile shortcut from More; the preference remains editable in Settings → Salah.
- Advanced Android versionCode to 40103 and invalidated the previous service-worker cache.
