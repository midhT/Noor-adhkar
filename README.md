# Noor 4.0 — Android

A Flutter-based, dark monochrome Islamic daily companion.

## Included
- Dashboard with daily Quran verse and next prayer summary
- Prayer-time calculation using the Karachi convention by default
- Device location or manual latitude/longitude
- Editable local Jamaat times
- Persistent Tasbeeh counter and custom dhikr
- Offline verse collection with Arabic, translation and references
- Duas starter library
- Notification permission flow and daily scheduling service
- GitHub Actions APK build workflow

## Build
Install Flutter stable and Android SDK, then run:

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

APK output: `build/app/outputs/flutter-apk/app-release.apk`

## GitHub Actions
Push to `main` or run **Build Noor Android** manually. Download the
`Noor-4.0-Android-APK` workflow artifact.

## Important implementation notes
- Prayer times use the `adhan` package. Current UI calculation defaults to
  Karachi/Hanafi; calculation-method and Asr settings are stored, but wiring
  the selected values into PrayerService is a follow-up integration task.
- Notifications include a daily scheduling service and permission request;
  per-prayer scheduling UI still needs to be connected to the prayer schedule.
- Three native Android home-screen widgets are included (Tasbeeh, next Salah, verse).
  Add them from the Android launcher widget picker after installing Noor.
- Prayer reminders schedule the next seven days using inexact Android alarms.
  Refresh them from Settings after changing location or Jamaat times; Android
  may delay inexact reminders under battery restrictions.
- Quran translations are brief English renderings; verify Arabic script and
  translation against a trusted Mushaf/translation before public distribution.
- The included launcher mark is a typographic placeholder. Replace it with
  the user's supplied calligraphic artwork before publishing.
- Package ID is `com.midhat.noor`. An in-place update of an older app is only
  possible if its package ID and signing certificate match. Do not uninstall
  an existing Noor installation until that is confirmed.
