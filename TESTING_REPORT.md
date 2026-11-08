# Noor V3.3 — Milestone 1 testing report

Method: phone-sized Chromium (393×852, touch), real touch-drag gestures, native Capacitor layer replaced by recording stubs (`tests/`). Run with `tests/run.sh`.
**Not tested:** anything that needs a real Android device, the Android SDK or GitHub Actions — see "Not verified".

## Verified (automated, 50 UI checks + 19 reminder/widget-sync checks, all passing)
- Exactly five tabs in the required order; Focus gone; each tab opens its screen.
- Touch scrolling works on Home, Adhkar, Tasbeeh, Salah and Settings; no horizontal overflow at 320, 360, 393 and 412 px.
- Progress reachable from Home, back link works, Home tab stays highlighted.
- Home shows only 12-hour times; the editor stores 12 AM as 00:00 and 12 PM as 12:00; edits display as AM/PM; notification text is 12-hour.
- Seven Settings groups present; creator, version and Instagram placeholder shown; theme switch persists.
- Missing `night_pad.wav` is reported honestly; a chosen audio file plays and stops.
- Backup export file shape; nine kinds of bad file are rejected with no data change; declining the confirmation changes nothing; the confirmation summarises the backup.
- Reset → Restore round trip returns identical history and prayer times; Undo works after restore, reset and erase; Erase asks twice.
- Native path: export goes through file write + share sheet; alarms scheduled per prayer, offsets wrap midnight, edits reschedule, master-off cancels, denied permission reverts with an explanation; widget taps merge into the app counter.

## Not verified (needs a device or CI)
- The APK builds (new plugins, Java widget code, manifest patch have never been compiled).
- Alarms actually ring when the phone is locked, after reboot, and under battery optimisation.
- Both widgets on a home screen, resizing and refresh; the 12-hour widget layout.
- The Android share sheet for backups; file picker for restore on a real WebView.
- GPS, prayer calculation, Jamaat, Adhan audio, Adhkar collections, Tasbeeh presets, new streak logic, quote widget, update system, release signing — **not built yet** (Milestones 2–4).

## Known issues found (not fixed yet)
- Choosing a different dhikr in Tasbeeh resets the live count without saving it as a session.
- Routine cards on Home are manual "mark complete" toggles, not tied to actually completing a collection (Milestone 3).
- Streak is recalculated from `goalComplete` flags and has no per-user goal yet (Milestone 3).
- Status-bar icon style may be wrong on dark backgrounds; check on device.
