# Noor V3.3 — Milestone 2 / 2.1 testing report

## Verified (automated, run `bash tests/run.sh`)
- 58 UI checks, all passing: five tabs, touch scrolling on every screen, Kashmir defaults pre-filled in 12-hour time, Home has no editor, Settings groups, method/Asr/city/GPS (mocked fix)/±minutes/reset, Jamaat offset and fixed time, My own times, account name and photo, user-chosen audio, backup export and 10 kinds of rejected restore, restore of Salah/profile/progress.
- 16 scheduling checks, all passing (mocked notification plugin): three channels, Adhan sound file, 21-day horizon, unique ids, no duplicates after changes, Fajr silent, heads-up and Jamaat separate, reschedule on prayer edits, cancel on off, test alarm, 21 dated widget entries.
- Calculation engine vs independent NOAA-series reference: 9,840 comparisons across 5 cities, 4 methods, 2 Asr modes; worst 0.55 min.

## Added in 2.1 (automated, 40 checks, all passing)
Merged Dhikr tab, themed sheet menus (open, choose, close by tap/drag, no un-themed select left), swipe navigation incl. ignored cases, Smooth/Full mode persistence, no horizontal overflow at 320/360/393/412/600 px.
UI suite is now 57 checks; scheduling 16.

## Not verified (needs a real phone / CI)
- APK build in GitHub Actions.
- Alarms ringing with screen locked, after reboot, under battery restrictions.
- Full-length Adhan as a channel sound (Android may shorten it; Tone is the fallback).
- Location permission prompt inside the Android WebView.
- Real-device smoothness (Samsung A17 5G) and swipe feel; automated tests cannot measure frame rate.
- Instagram link opening the Instagram app/browser from the WebView.
- Widgets (prayer, tasbeeh) on a launcher; themed monochrome icon.
- Agreement with local Kashmir mosque timetables (they may differ by a few minutes; use adjustments).

## Known limits
- High-latitude fallback is night-middle only.
- USE_EXACT_ALARM may need justification if published on Google Play.
