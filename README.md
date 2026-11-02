# Noor V3 — Islamic Daily Companion

Noor is an offline-first mobile web app packaged for Android with Capacitor. The default Salah learning path is Hanafi-oriented.

## Included in this V3 source
- Tasbeeh counter, starter Dhikr library, local progress, streaks, and JSON data export.
- Salah & Duas learning cards with Arabic, transliteration, meanings, and contextual notes.
- Focus Studio with 5/10/20/30-minute sessions.
- Optional celestial motion and reduced-motion support.
- Optional user-selected audio file. No unlicensed nasheed is bundled; audio is off by default and must be selected again after a restart.
- App icon, responsive layout, and an updated offline cache including the V3 script.

## Build a test APK with GitHub Actions
1. Extract this ZIP and upload/commit the project files to your GitHub repository, keeping the `.github/workflows/build-apk.yml` path.
2. Open the repository's **Actions** tab and run **Build Noor APK**, or push to the `main` branch.
3. Open the successful workflow run and download the `Noor-debug-APK` artifact.
4. Extract the artifact ZIP and install `app-debug.apk` on your Android phone for testing.

The debug APK is for testing only. Public Google Play distribution requires a signed release build (usually an Android App Bundle, `.aab`) and secure release-key handling. Do not commit a signing key or passwords to GitHub.

## Important scope notes
- This build does **not** yet implement scheduled reminders, native notification permissions, a full Qur'an reader, prayer-time calculations, cloud sync, or native haptics. Browser vibration support varies by Android/WebView.
- The audio picker uses a temporary local object URL. Audio is not uploaded, and the file must be selected again after the app restarts.
- Progress is stored locally. Export it before clearing app data; uninstalling or clearing app storage can remove it.
- Focus timers may pause when the app process is closed or suspended; this version does not promise a background timer or system-level focus blocking.

## Religious-content review before public release
The Salah section is a learning aid, not a fatwa. The Arabic, transliteration, translation, and references—especially long Qur'anic and prayer passages—must be reviewed by a qualified Hanafi scholar/editor before public release. Transliteration is approximate, and recognised differences should be labelled respectfully rather than presented as errors.

## Privacy
Core data stays in local app/browser storage. No account or analytics service is configured in this source build. A public release still needs a store-compliant privacy policy and accurate data-safety disclosures.


### Android system bars and haptics
The build bundles Capacitor Haptics and Status Bar plugins. The status bar is explicitly shown with a dark navy background and light icons, and WebView content does not overlay it. Haptic feedback uses native Android impact feedback in the APK; browser preview uses the vibration API when available. Test on a physical device.


## Noor celestial identity
- `assets/icon.png` is the source artwork used to generate the native Android launcher icon.
- `assets/splash.png` is the source artwork used for the native Android splash screen.
- `www/intro.js` and the intro styles provide the short animated crescent/wordmark reveal after the web app starts.
- The GitHub Actions workflow generates Android icon/splash resources with `@capacitor/assets`.
