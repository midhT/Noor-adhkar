# Naseem (نسيم) — Noor Project V4 Master Blueprint

**Project/repository:** Noor / `noor-adhkar`  
**Product name shown to users:** Naseem (نسيم)  
**Android application ID:** `com.noor.adhkar` (preserved for upgrade compatibility)  
**Starting codebase:** Noor V3.3 M2.1 GitHub APK Builder

> Naming rule: this is still the Noor project and repository. Only the app's public/display brand is Naseem. Internal Java package names, storage keys, plugin identifiers, event names and application ID remain unchanged unless a separately reviewed migration is required.

## Product vision

Naseem is an offline-first Islamic daily companion that combines daily remembrance, Salah, Duas, Zakat, the Hijri calendar and personal progress in one polished Android experience. Religious accuracy, data integrity, dependable reminders and accessibility take priority over decorative effects.

## Main navigation

1. Home
2. Dhikr
3. Salah & Dua
4. Progress
5. Zakat

Settings and profile are reached separately from the Home/profile area. The Progress tab remains distinct; Home must not duplicate its full analytics dashboard.

## Home

- Personal greeting and current Gregorian/Hijri dates.
- Preserve the existing Arabic next-prayer countdown circle, including Arabic prayer name, prayer time and remaining time.
- Replace the other English countdown circle with a live Qibla compass: bearing in degrees, Kaaba marker, distance to Makkah, sensor calibration guidance and accuracy warnings.
- Morning/evening Adhkar cards that open real guided sessions.
- Quick Dhikr access and a daily Quranic verse with translation/reference.
- Clear setup/reminder status where permissions or schedules are not configured.

## Dhikr centre

- Categorised library: morning/evening, after Salah, sleep/waking, protection, forgiveness, gratitude, Quranic duas and sourced Sunnah supplications.
- Two counter modes: traditional circular Tasbeeh and modern digital counter.
- Guided sessions, custom Dhikr, collections/folders, favourites, ordering, import/export and history.
- Arabic, transliteration, meaning, repetition target and reliable source/reference where applicable.
- Optional individual and guided audio, repeat controls, speed control and offline availability where licensing permits.
- Completion animation, relevant verse and reference, session summary, progress update and optional next suggestion.
- Streaks/rewards only after actual completion; prevent duplicate completion and duplicate reward events.

## Salah centre

- Five daily prayer timings, next-prayer countdown, manual completion, history and optional reminders.
- Traditions supported in learning guidance: Sunni Hanafi, Shafi'i, Maliki, Hanbali and Shia Ja'fari (Twelver). The user's selection controls default guidance; comparisons are available without presenting one tradition as superior.
- Prayer calculation method is separate from jurisprudence selection. Recommend a regional calculation method, explain it and allow overrides/adjustments. Support Hanafi and standard Asr calculation settings.
- Learning: Wudu, Ghusl, prerequisites, step-by-step Salah, positions, recitations, Rakats, tradition differences, invalidators and common mistakes.
- Minimalist position illustrations/silhouettes; audio learning where recordings are reliable and licensed.
- Adhan options: selectable recordings, per-prayer settings, full Adhan/silent/disabled, volume and test playback. Do not bundle unlicensed recordings.
- Jamaat manager: multiple saved mosques, manually entered times for all five prayers, per-prayer reminders, temporary schedule changes. Never guess mosque times.
- Android widgets: next prayer, five-prayer timetable, Jamaat countdown, Qibla shortcut and daily prayer status; independent sizes where Android widget constraints allow.

## Dua centre

- Searchable categories: study/exams, stress/peace, Rizq, family, forgiveness, protection, guidance, sleep/waking, patience, health, morning/evening and hardship.
- Arabic, transliteration, translation/meaning, source and grading/reference when available.
- Quranic duas, authentic Hadith supplications and personal permissible duas clearly distinguished.
- Favourites, recents, copy/share, audio, offline access, daily suggestions and memorisation mode (phrase-by-phrase, repeat-after-reciter and revision).

## Zakat centre

- Guided and advanced modes with category-by-category entry and optional detailed asset records.
- Wealth categories: cash/bank savings, gold, silver, investments, business inventory/assets, receivables and other eligible wealth; record applicable liabilities/debts separately.
- Nisab using gold/silver threshold selection, current local price source/last update, stale-cache warning and manual offline price entry.
- Explain eligibility, asset treatment, deductions and final amount; apply 2.5% only where appropriate.
- Madhhab-aware rules must be sourced and transparently described. Where scholarly differences exist, show the difference; do not invent a universal mapping. Complex cases should be referred to a qualified scholar.
- Payment history: partial/full payments, recipients, dates, amounts, optional receipts, outstanding balance, annual comparisons and Hijri anniversary reminders.

## Hijri calendar

- Monthly/yearly Hijri views, Gregorian/Hijri conversion, important Islamic dates, Ramadan/Eid indicators and optional reminders.
- Regional calendar source plus manual local moon-sighting adjustment; not locked to one country's convention.
- Entry points from Home and Zakat, not a sixth main navigation tab.

## Progress

- Dhikr/session history, morning/evening completion, manually confirmed prayers, daily/weekly/monthly summaries, streaks and personal goals.
- All metrics derived from genuine activity; no assumed prayer completion and no click-only Dhikr completion.

## Onboarding

- Welcome, mandatory tradition selection, location (GPS with manual city fallback), prayer calculation recommendation, English/Arabic/Urdu, notification explanation/permission, optional Jamaat setup, theme/preferences, final review.
- Optional steps can be skipped and revisited. Location/notification denial must not block the app.
- Ask for compass/orientation access only when needed; do not request unnecessary permissions.
- Keep profile/local data separate from future authentication so optional registration/cloud sync can be added later.

## Design system

- Adaptive premium + modern Islamic aesthetic.
- Dark default: charcoal/near-black with restrained Islamic emerald; light: clean ivory/white with emerald.
- Subtle geometric motifs, ambient gradients, layered cards, fine borders, controlled shadows and rounded corners.
- Accent choices: Islamic emerald (default), forest green, royal blue, midnight purple, muted gold, silver/grey and custom picker.
- Modern English sans-serif, readable Arabic, readable Urdu Nastaliq, correct RTL.
- Highly animated direction: fluid transitions, Dhikr counter motion, Qibla interaction, prayer progress, premium splash/loading and subtle micro-interactions. Provide reduced-motion controls and optimise battery/GPU usage.
- Brand: Arabic نسيم, abstract light and breeze forms, restrained Islamic geometry. Do not use the previous Noor wordmark in public-facing app artwork.

## Audio and background playback

- Preserve existing background audio capability unless separately agreed otherwise.
- Focus Mode is not in the current scope.
- Audio should be optional, offline-capable where permitted, and bundled/downloaded only with suitable usage rights.

## Data, privacy and reliability

- Offline-first local storage; no cloud upload without explicit consent.
- Automatic periodic on-device backups, backups after important changes, before migrations, plus manual JSON export/restore.
- Validate backups before restore and protect good backups from corrupted overwrite.
- Preserve current storage keys and app ID during initial rebrand. Any later schema changes need versioned migration and rollback tests.
- Test notification scheduling, reboot restoration, battery restrictions, widget refresh, location denial, sensor accuracy and offline paths on real Android devices.

## Delivery phases

1. Rebrand and compatibility baseline (display name, icon/splash, metadata, docs, preserve app ID/data).
2. Home/navigation/Qibla and design system.
3. Dhikr library, sessions, counter modes, completion integrity and custom collections.
4. Salah engine, tradition guidance, notifications, Jamaat and widgets.
5. Dua centre, references, audio and memorisation.
6. Zakat calculations, transparent rules, prices and payment records.
7. Hijri calendar and reminders.
8. Onboarding, settings, profile and progress integration.
9. Accessibility, performance, security/privacy review, full device QA and release packaging.

## Release gates

- No invented prayer or Jamaat times.
- No false claims of religious authenticity; all content reviewed by qualified editors/scholars before public release.
- Zakat test cases reviewed against documented scholarly standards.
- No data loss on update from existing Noor installation.
- Android alarm/widget/reboot testing on physical devices.
- Arabic/Urdu RTL and accessibility verification.
- Signed release key kept outside source control; Play Store policy review for exact-alarm permissions.
