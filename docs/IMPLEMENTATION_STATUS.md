# Naseem implementation status — V4.1.0 RC3

## Present in source (device verification pending)
- Offline-first Dhikr sessions, streaks, custom Adhkar routine CRUD/reordering, Salah calculations, local reminder scheduling, profile/theme settings and backup/restore.
- Hijri calendar with complete months, monthly AlAdhan reference comparison and a manual ±1-day local correction.
- Salah settings for location, calculation method, Hanafi/standard Asr, manual times, Jamaat and monthly reference comparison. Comparisons never overwrite local or mosque times.
- Glance and Dua Library public JSON feeds with schema/content versions and local cache fallback.
- Quran Reader with last-read Surah/Ayah resume, Surah/Juz/Ayah navigation, cached opened Surahs and explicit download of Arabic text for offline reading. Recitation remains on-demand/online; full offline audio and word-level synchronization are not implemented.
- Hadith Library integration in Arabic, English and Urdu.
- Prayer, Tasbeeh and Hijri Android widgets with user-configurable theme, accent and spacing, dedicated previews, plus a user-composed Custom Widget. The Custom Widget supports selected content blocks, compact/comfortable spacing and open-app or tap-to-count behavior. Its saved composition is shared across its instances.
- First-run-only onboarding and Android notification permission request.

## Still outstanding
See `RELEASE-BLOCKERS.md`. Physical-device QA, GitHub-hosted browser/Android CI results, signing/publication, Quran audio redistribution rights and qualified religious-content review remain release gates. The Custom Widget does not yet support independent per-instance compositions or drag-and-drop positioning.

## Home-screen widgets (build 40107)

Implemented in source, **not compiled or device-tested**:

| Widget | Provider | Notes |
| --- | --- | --- |
| Prayer Times | `PrayerWidgetProvider` | Wide (`widget_prayer`) or small (`widget_prayer_small`) layout chosen from the placed size; live Chronometer countdown; progress bar; passed prayers dimmed. |
| Salah Countdown | `CountdownWidgetProvider` | Tick-ring dial drawn by `WidgetArt`; dial progress = time since previous prayer / gap to next. |
| Tasbeeh | `TasbeehWidgetProvider` | Tap-to-count; pending taps merge into the app on next open (`takePending`). Shows Arabic name when synced. |
| Hijri date | `HijriWidgetProvider` | Shows "Open Naseem to update" when the synced date is from an earlier day. |
| Daily Reflection | `ReflectionWidgetProvider` | Text comes only from the app's Glance content via `setReflection`; no text is bundled natively. |
| Custom | `CustomWidgetProvider` + `CustomWidgetConfigActivity` | Per-instance settings keyed by appWidgetId (`cw_<id>_*`); Widget Studio values are defaults for instances without their own. |

Shared code: `WidgetArt` (card/dial/bar bitmaps, size-capped), `PrayerMath` (prayer lookups, 15-minute/next-prayer repaint alarm), `NoorWidgetStore` (preferences, sizing, density).

Known limits: backgrounds are static bitmaps (no live blur); sizes come from launcher option bundles, so aspect/corner radius can differ slightly between launchers; the repaint alarm is inexact and non-waking, so the dial and next-prayer switch may lag while the phone is asleep (the countdown text itself is system-drawn); arbitrary drag positioning is not possible with Android widgets; preview images in the picker are mock renders, not screenshots.

Verification still required: Gradle compile, `npm run` test suite with esbuild, launcher resize/refresh on a Samsung device, reboot and time-zone behaviour, in-place upgrade over the previous build.
