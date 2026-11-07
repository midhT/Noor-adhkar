# Noor V5 — Known Limitations

## Build / verification
- **Not compiled or run by me.** No Flutter/Android SDK or package access in the build workspace. The first GitHub Actions run is the first real compile; small fixes may be needed. See `03_VERIFICATION_REPORT.md`.
- Dependencies are the V4 versions plus `audioplayers ^6.1.0`, `file_picker ^8.1.2`, `path_provider ^2.1.4`. Their exact resolved versions come from `pub get` in CI (`pubspec.lock` is not committed). Flutter "stable" moves; if a newer Flutter breaks an old plugin or the AGP 8.11.1 / Kotlin 2.2.20 pins, CI will say so.
- The release APK is signed with a **public test keystore** committed in the repo (so updates install over each other). It is not suitable for the Play Store; create your own keystore for that and keep it out of Git.
- No design-reference files were in the archives. Colours/layout follow V3's navy-and-gold tokens and V3 artwork; compare against your references.

## Prayer times and reminders
- Times are calculated offline with the `adhan` library from the coordinates you give (GPS or manual). They are not verified against your local mosque; use per-prayer minute adjustments to match. High-latitude locations depend on the rule chosen.
- Reminders are scheduled **14 days ahead** and re-planned on every app start/resume and setting change. If you do not open Noor for 14+ days, alerts stop until you do. A reboot is handled by the plugin's boot receiver.
- Exact alarm timing needs Android's "Alarms & reminders" permission (the app asks). Without it, reminders can be a few minutes late. Some phone makers (Xiaomi, Oppo, Vivo, Samsung "sleeping apps", etc.) kill background alarms; set Noor to *Unrestricted* battery use.
- No adhan audio: reminders use the standard notification sound.
- Jamaat times are entered by you; they are not fetched.

## Widgets
- Widgets read data the app last pushed. The Salah widget carries 4 days of timings and ticks natively; open the app at least every few days. Layouts are fixed designs, not user-configurable.
- The Tasbeeh widget shows completed-session totals only, by design.

## Dhikr / content
- Quantity is hidden until a session ends (by design, no toggle). If the app is killed mid-session the hidden in-progress count is restored on next open.
- **Religious content needs scholarly review before public release**: Salah guide (carried over unchanged from V3, Hanafi-oriented), preset adhkar texts/targets, the 23 Qur'anic reflections (a few are shortened to the relevant clause with simplified orthography), and transliterations.
- Arabic renders with the phone's system Arabic font (no font bundled).

## Focus Studio
- Timing is wall-clock based and survives backgrounding; an end notification is scheduled. It does not block calls/notifications or hold a wake lock; the screen can sleep.
- Bundled audio is a generated ambient pad (no third-party recording). Your own file is copied into app storage; if you clear app data it must be chosen again.

## Data
- Everything is local. Backup/restore is via clipboard JSON (no file picker). V3 data lives in the old app's WebView storage and cannot be read automatically — export from V3 and use *Import history*.
- Uninstalling or clearing storage deletes all data.

## Not included
- Full Qur'an reader (Quran tab removed by requirement), cloud sync, accounts, analytics, iOS, tablets-specific layouts, localisation beyond English.
