# Noor V5

Noor is an offline-first Islamic daily companion built with Flutter.

## Included in this source package
- Dhikr counter with ten presets, custom dhikr, session completion and saved progress.
- Salah schedule calculation using the `adhan` package, with selectable calculation method and madhab.
- Focus timer with optional local ambient audio asset.
- Journey screen with streak and session history.
- Local preferences using SharedPreferences.
- Dark navy and warm-gold visual system.
- GitHub Actions workflow for analysis, tests and Android APK build.

## Build
Install Flutter stable and Android SDK, then run:

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

APK: `build/app/outputs/flutter-apk/app-release.apk`

## Important
Prayer times depend on the coordinates, calculation method and local authority. Confirm them against your local mosque before relying on them. Notification delivery depends on Android permissions and battery settings. This source has not been compiled or tested on a physical device in this generation session.
