# Naseem V4.0.4 — implementation status

## Implemented in source

- Existing V4.0.3 base retained: Qibla, Salah calculations/scheduling, Adhkar sessions, Zakat estimate, accent controls, backup/restore and existing progress logic.
- Hijri month calendar and Gregorian ↔ Hijri date conversion using the device ICU Islamic calendar (`islamic-umalqura` where available, otherwise `islamic`). No calendar API is required for this local conversion. Regional moon-sighting differences remain possible.
- Quranic Dua starter library: five supplications with Arabic, transliteration, concise meaning, Quran reference, search/category filters and local favourites. It is not yet a comprehensive Hadith/Sunnah Dua library. Content must be checked by a qualified Arabic/religious editor before public release.
- Salah learning starter centre: seven general learning lessons covering preparation, Wudu, prayer sequence, bowing, prostration, final sitting and Ghusl. This is general education, not a tradition-specific fatwa or full course.
- Traditional learning profile selector: Hanafi, Shafi‘i, Maliki, Hanbali and Ja‘fari preferences are saved locally and included in backup. Current lessons are still general, not yet fully adapted to each profile.
- Islamic occasions list with approximate dates derived from the device Hijri calendar; local reminders can be scheduled through Android notifications. Some dates/observances vary or are disputed and must be confirmed locally.
- Widget Studio connects to the existing Android Prayer and Tasbeeh widget implementations. Tasbeeh data can be pushed from the app; Prayer widget data is supplied by the existing Salah schedule service. Users add widgets through the Android launcher.
- Glance client accepts a configurable public HTTPS JSON feed, selects the latest published item, caches the last successful item locally, and has a bundled Quranic reminder fallback. Feed schema and sample content are in `docs/glance-content/`. The future admin app and hosted public repository are not part of this delivery; the user must configure a feed URL when it exists. Never embed a GitHub token in the APK.
- First-launch setup is skippable and can be reopened from Settings. It saves a learning profile, optional city/GPS location, theme and optional notification permission choice locally.
- Android back-button listener uses `@capacitor/app`.
- GitHub Actions now runs `scripts/patch-icons.mjs` and `scripts/patch-android.mjs`, so the monochrome launcher layer, native widget Java/resources, plugin registration and manifest receivers are copied into the generated Android project before Gradle.
- App version is 4.0.4. Android application ID remains `com.noor.adhkar`; public display name remains Naseem.

## Still pending / not claimed complete

- Full Home dashboard and remaining P2 handover work.
- Masjid finder, Zakat records/payment history and prayer history.
- Comprehensive Dua collection (including verified Hadith/Sunnah sources, audio and memorisation mode).
- Tradition-specific Salah content, detailed comparisons and scholarly review.
- A real Glance admin application and hosted public feed repository.
- Any further APIs that need credentials/hosting; the Glance client is ready for a public HTTPS JSON endpoint but no feed is configured by default.
- Complete physical-device validation: sensors, notifications, widget refresh/reboot, Android back behaviour, backup/restore and in-place update signature.
- Full browser UI tests and Gradle APK build in CI.

## Religious-content and date caveats

All new religious content is a starter implementation. Quranic references and Arabic should be reviewed against a trusted mushaf. Calendar dates are calculated from the device's ICU calendar and may differ from local moon sighting. Do not present this build as a scholarly authority or public-release candidate.
