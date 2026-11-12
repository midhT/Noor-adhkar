# Naseem implementation status — V4.0.9 RC3

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
