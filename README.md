# Noor V3.3 — Islamic Daily Companion

Noor is an offline-first mobile web app packaged for Android with Capacitor. The default Salah learning path is Hanafi-oriented.

## Included in this V3 source
- Tasbeeh counter, starter Dhikr library, local progress, streaks, and JSON data export.
- Salah & Duas learning cards with Arabic, transliteration, meanings, and contextual notes.
- Focus Studio with 5/10/20/30-minute sessions.
- Optional celestial motion and reduced-motion support.
- Optional user-selected audio file. No unlicensed nasheed is bundled; audio is off by default and must be selected again after a restart.
- App icon, responsive layout, and an updated offline cache including the V3 script.

## Build a test APK with GitHub Actions
1. Extract this ZIP. Upload the **contents** of the `noor-adhkar` folder to the root of your GitHub repository (including the hidden `.github` folder). Do not upload the ZIP as a single file.
2. Open the repository's **Actions** tab and run **Build Noor APK**, or push to the `main` branch.
3. Open the successful workflow run and download the `Noor-debug-APK` artifact.
4. Extract the artifact ZIP and install `app-debug.apk` on your Android phone for testing.

The debug APK is for testing only. Public Google Play distribution requires a signed release build (usually an Android App Bundle, `.aab`) and secure release-key handling. Do not commit a signing key or passwords to GitHub.

## Important scope notes
- This build does **not** yet implement scheduled reminders, native notification permissions, a full Qur'an reader, automatic prayer-time calculations, or cloud sync. Browser vibration support varies by Android/WebView.
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


## V3.1 dashboard update
The home screen now includes a compact prayer dashboard inspired by the supplied reference: next-prayer panel, five-prayer timetable, sunrise/Dhuhr banners, paired circular countdown cards, and a date panel. Prayer times are deliberately left blank until the user enters a trusted local timetable; this update does not invent times or claim automatic location-based calculation. Values are saved locally on the device.


## V3.2 — graphite theme, salah alarms, widgets
- **Theme:** `www/theme.css` (loaded after `styles.css`) restyles the whole app to the supplied reference: near-black graphite cards, hairline borders, small letter-spaced captions, white progress rings, floating icon navigation. Light theme is kept (toggle in the header). Layout is phone-first (safe-area aware, 44 px touch targets, tested 320–412 px wide).
- **Salah reminders:** a "Salah reminders" card on Home (under the prayer dashboard). Per-prayer switches, alert at the prayer time or 5/10/15/30 minutes before, and a "Test alarm in 10 s" button. Alarms are repeating exact alarms (`@capacitor/local-notifications`) on a max-importance "Salah alarms" channel, restored after reboot, and rescheduled automatically when you edit prayer times. They use the times you enter in the dashboard — there is still no automatic calculation.
- **Widgets (Android home screen):** *Noor · Prayer times* (next prayer, live countdown, the five times) and *Noor · Tasbeeh* (tap to count). Taps on the Tasbeeh widget are added to the app's counter, daily totals and history the next time Noor opens. Native sources live in `android-native/`; `scripts/patch-android.mjs` (run by the workflow after `cap add android`) copies them in and adds the permissions and widget receivers.
- **Permissions added:** POST_NOTIFICATIONS, VIBRATE, RECEIVE_BOOT_COMPLETED, SCHEDULE_EXACT_ALARM (Android 12 and below), USE_EXACT_ALARM (Android 13+). Google Play restricts USE_EXACT_ALARM to alarm/calendar-type apps, so review that before a Play release.

### Known limits
- The alarm uses the phone's default notification sound on a high-priority channel. No adhan audio is bundled (licensing); a custom sound can be added later as an Android raw resource.
- Alarms and widgets only work in the installed Android app. In a browser the reminders card says "Preview only".
- Some phone makers (Xiaomi, Oppo, Samsung power saving, etc.) kill background alarms; if an alarm is missed, exclude Noor from battery optimisation.
- The Java widget code, manifest patch and Gradle build could not be compiled in the authoring environment (no Android SDK or network); the first GitHub Actions build is the real compile test. Test the alarm and both widgets on a physical phone.


## V3.3 Milestone 1
See `CHANGELOG.md` and `TESTING_REPORT.md`. Run the automated UI tests with `tests/run.sh` (needs `npm install`, `pip install playwright`, `playwright install chromium`).

### Push to GitHub (new branch, no history rewriting)
```bash
git checkout -b v3.3-milestone-1
git add -A
git commit -m "Noor V3.3 Milestone 1: five-tab navigation, Settings, 12-hour time, backup and restore"
git push -u origin v3.3-milestone-1
```
Then open a pull request on GitHub, check that the Build Noor APK run passes, and merge.
