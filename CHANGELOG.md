# Naseem Changelog

## 4.1.0 · Android build 40109 (candidate)

- Added a Qari selection menu in Quran reading settings. The supported Muhammad Al-Luhaidan reciter displays a clear “Word by word” capability label directly beneath the reciter name.
- Increased Android `versionCode` to 40109 while retaining public version 4.1.0, the existing application ID and the original signing configuration.
- Not verified: signed APK build and physical-device visual testing.

## 4.1.0 · Android build 40108 (candidate)

- Added a dedicated full-screen Quran recitation player, separate from the Quran reader, with accent-responsive ambience and synced transport/seek controls.
- The compact player remains available while browsing other Naseem screens.
- The app-wide background ambience now follows the selected accent colour in dark and light themes.
- Hardened public update checks with cache-busting, a GitHub Contents API fallback, and same-version build-code comparison on every launch.
- Android `versionCode` advanced to 40108 while the public version remains 4.1.0. The existing application ID and protected signing configuration are preserved.
- Not verified: signed APK build, in-place installation over the currently installed app, and physical-device playback/UI testing.


## 4.1.0 — Salah tracker and release-readiness patch · 14 November 2026
- Added per-prayer check-ins for on-time, not-early and very-late Salah, with the female-only Periods option.
- Periods entries are excluded from daily completion denominators and weekly prayer totals; they are not treated as missed Salah.
- Added a seven-day improvement summary so users can review timing patterns prayer by prayer.
- Preserved the selected gender in the local profile across profile refreshes and edits.
- Kept prayer-time gating for prayer completion; Periods can be recorded independently of a prayer time.
- Included regression checks for gender-specific options, profile persistence and Periods statistics.


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


## 4.1.0 · Android build 40107 (candidate)

- Rebuilt the home-screen widgets with a new charcoal-glass and deep-emerald design, drawn natively (card, glow, tick-ring dial and progress bars).
- Added two widgets: **Salah Countdown** (dial with live countdown and progress to the next prayer) and **Daily Reflection** (shows the text Glance already holds; no religious text is bundled natively).
- Redesigned Prayer Times (wide and small layouts chosen from the placed size, progress to next prayer, passed prayers dimmed), Tasbeeh (Arabic name, target bar) and Hijri (large day, Gregorian date, honest "open Naseem to update" when the synced date is from an earlier day).
- Custom widget: each placed instance now keeps its own content, spacing, tap action and personal reminder through a configure screen (also reachable from the launcher's reconfigure action). Widget Studio values remain the defaults for older instances.
- Widgets repaint after reboot, time change, time-zone change and date change, and at least every 15 minutes; Custom widget taps now also update Tasbeeh widgets.
- Not verified: Gradle compilation, launcher resizing and refresh timing need the GitHub Actions build and a physical-device test. Android versionCode advanced to 40107; the public release feed is unchanged until a release is published.

## 4.1.0 · Android build 40106 (candidate)

- Added an optional menstrual cycle tracker for female profiles, with period start history, configurable typical cycle interval and duration, and an approximate next-start estimate.
- Cycle information is stored locally, can be cleared from Settings, and is included in user-requested backups.
- Cycle estimates are informational only and are not medical advice or contraception guidance.
- Preserved the existing per-prayer Salah tracker and excluded Periods entries from missed-prayer consistency totals.
