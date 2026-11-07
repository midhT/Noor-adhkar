# Noor V5 — Feature Verification Report

**Read this first.** The workspace this was built in has no Flutter SDK, Android SDK, pub.dev or
Gradle access. Therefore **the app was never compiled, analysed, unit-tested or run on a device
here, and no APK was produced here.** Everything below is split into what *was* checked and what
*must be confirmed by your first GitHub Actions run and a phone test*. Nothing is marked "works".

## 1. Checks that were actually run (and passed)

| Check | Result |
|---|---|
| `tool/check_dart.py`: bracket balance (string/interpolation aware), all local imports resolve, no symbol used from another local file without an import, no unused local imports — 32 Dart files (`lib/` + `test/`) | 0 problems |
| All 15 Android XML files parse | pass |
| Every `@drawable/@mipmap/@color/@string/@layout/@xml/@style` and `R.id.*` / `R.layout.*` reference in manifest, layouts and Kotlin resolves to an existing resource | none missing |
| All 12 V3 Salah steps (Arabic, transliteration, meaning, note) found verbatim in `salah_guide.dart`; all 5 V3 dhikr Arabic texts present | 0 differences |
| `night_pad.wav`: valid 22.05 kHz mono 16-bit, 24 s, peak 0.32 FS; loop seam step 146/32768 (inaudible click) | pass |
| `pubspec.yaml` asset path exists | pass |
| adhan API names used (`CalculationMethod.*`, `Madhab`, `HighLatitudeRule.*`, `adjustments.*`, `PrayerTimes(…)`) compared with the package's published docs; adhan returns device-local `DateTime`s, code additionally calls `.toLocal()` (safe either way) | consistent |

**Not a compiler.** The checker cannot find type errors, wrong argument names, or API drift in
plugins. Expect the first CI run to possibly need small fixes; paste the log and they are quick.

## 2. Written but NOT yet executed (run by CI)

42 tests exist (`test/`): prayer calculation honouring method/madhab/adjustments, current/next
prayer rollover (after Isha → tomorrow's Fajr, sunrise never "next"), reminder planner (ids stable,
lead time, mute, Jamaat), session rules (count not recorded until the session ends, 33→33→34 set,
early end, discard, persistence across restart), V3/V5 import/export, streaks incl. DST, formatting,
and a widget test asserting 5 tabs and no "Quran". The `verify` job runs `flutter analyze` and
`flutter test`; the `build` job runs independently so an APK is produced regardless.

## 3. Requirement → implementation → what you must confirm on a phone

Status key: **Implemented** = code present and statically consistent; not device-verified.

| Requirement | Where | Status | Confirm on device |
|---|---|---|---|
| V3 functionality preserved | see `01_AUDIT_AND_PLAN.md` matrix | Implemented (light/dark theme kept, V3 export JSON importable) | Walk each V3 feature once |
| Quran not a bottom-nav tab | `ui/shell.dart` (Home, Dhikr, Salah, Focus, Journey); no Quran screen exists | Implemented | Nav shows 5 tabs |
| Quranic reflections in dhikr completion | `completion_sheet.dart`, `data/reflections.dart` (23 verses, themed per dhikr; text spot-checked against my knowledge of the Qur'an, not scholar-reviewed) | Implemented | End a session → reflection shown |
| Quantity shown only after session ends | `dhikr_screen.dart` (ring only, no number), `store.dart` records only on `endSession`; Home/widget show ended-session totals only | Implemented + unit-tested (unrun) | Tap 5×: no number anywhere; End → number appears |
| Multiple presets + custom dhikr | `data/dhikr_data.dart` (10 presets incl. the 33/33/34 post-prayer set), `library_sheet.dart` create/edit/delete | Implemented | Add a custom dhikr with Arabic + target |
| Live Salah countdown | `LiveClock` (wall-clock-aligned, from `DateTime.now()`), `resolvePrayerState` | Implemented | Counts down per second; after Isha shows tomorrow's Fajr |
| Method & madhab applied | `prayer.dart` `computeDay`; Salah/Home/reminders/widget all use it | Implemented + tested (unrun) | Switch Hanafi↔Shafi‘i: only Asr moves |
| Real reminders + rescheduling | `reminders.dart` (14-day rolling plan, stable ids), `AppSync` on start/resume/any setting change, manifest receivers, boot restore | Implemented | Settings → Prayer reminders → send the test notification; set Fajr ±2 min away and lock phone |
| Varied dashboard cards | `home_screen.dart` (hero Next-Salah card, 6:4 split row, routines, reflection) | Implemented | Visual review vs your references |
| Navy + gold design | `core/palette.dart` from V3 CSS tokens + V3 artwork | Implemented | **Your design reference files were not in the archives** — compare and tell me deltas |
| Focus Studio, audio, celestial motion, splash | `focus_screen.dart` (wall-clock timer, end notification), `audio_service.dart` (bundled pad or your file, kept across restarts), `CosmosBackground`, `splash.dart` + native launch theme | Implemented | Run 5-min session, lock phone, expect end alert; play/stop audio |
| Improved widgets | `NoorWidgets.kt`: Salah (native ticking countdown, rolls to next prayer, tap opens Salah), Tasbeeh (completed total), Verse (daily) | Implemented | Add all three; check countdown ticks with app closed |
| Settings + history persisted | `store.dart` (SharedPreferences, V4 keys migrated) | Implemented + tested (unrun) | Force-stop app; data remains |
| Offline-first | No network code in `lib/` (no http/Uri use); audio is bundled; Arabic uses the system font | Implemented | Airplane mode run-through |

## 4. Design decisions to be aware of
- "Show quantity only after the session ends" is applied strictly: no live number, no toggle.
- Light theme is kept (V3 had it); dark navy/gold is the default.
- Export is clipboard JSON, not a file (avoids an unverifiable plugin).
