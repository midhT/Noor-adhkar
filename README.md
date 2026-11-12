# Naseem (نسيم) — Noor Project V4

Naseem is the public-facing name of the Noor Project Islamic daily companion. The private source repository remains `midhT/Noor-adhkar`; public app releases and remote content are published through `midhT/Naseem-public`.

## Architecture
- Capacitor 7 web application with native Android prayer, Tasbeeh and Hijri widgets.
- Local-first user settings, Adhkar progress, reminders and backups. No account or cloud sync.
- Salah calculations run locally; users can set location, calculation method, Asr school, manual adjustments and Jamaat times.
- Glance and Dua Library can update from the public JSON feeds and retain local fallback content.
- Quran Reader and Hadith Library use their respective public APIs; Quran text caches recently opened Surahs locally and offers per-Ayah recitation when online.

## Development
```sh
npm install
npm run build
node tests/test_new_tools.js
bash tests/run.sh
```

The Android project is generated in CI with `npx cap add android`, then native widgets and permissions are copied from `android-native/` by `scripts/patch-android.mjs`. See `RELEASE-SETUP.md` for protected release signing and public-repository publication.

## Release status
This V4.1.0 working archive is a release candidate, not a declaration of Play Store readiness. Read `RELEASE-BLOCKERS.md` before publishing. Static checks do not replace Chromium tests or testing on a physical Android device.
