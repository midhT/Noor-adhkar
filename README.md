# Noor Project V4 — Naseem (نسيم)

**Project/repository identity:** Noor  
**App name shown to users:** Naseem (نسيم)  
**Android application ID:** `com.noor.adhkar` (intentionally preserved)

Naseem is the public-facing name of the Noor project. This delivery starts the V4 development track from the existing Noor V3.3 M2.1 Capacitor Android source. The repository and internal identifiers remain Noor to preserve compatibility with existing app data, native bridges and Android installations.

## What is in this delivery

- Existing V3.3 M2.1 application source and Android widget/notification integration.
- Naseem display-name and visual identity foundation.
- Emerald-forward dark theme baseline.
- Arabic Naseem launcher/splash source artwork.
- Updated PWA metadata and GitHub Actions APK artifact naming.
- `docs/NASEEM_V4_BLUEPRINT.md`: complete approved product blueprint.
- `docs/IMPLEMENTATION_STATUS.md`: implemented vs planned scope and compatibility notes.
- `docs/design/naseem-product-vision-mockup.png`: concept reference only, not a screenshot of a running app.

## Build a test APK with GitHub Actions

1. Extract the ZIP and upload the **contents** of the `noor-adhkar` folder to the root of the existing Noor GitHub repository, including hidden files such as `.github`.
2. Open Actions and run **Build Naseem APK**, or push to the branch configured by the workflow.
3. Download the `Naseem-debug-APK` artifact from a successful run.
4. Install `app-debug.apk` for device testing.

The debug APK is for testing only. Public Google Play distribution requires a signed release build (usually an Android App Bundle, `.aab`), secure release-key handling, policy review and a privacy policy. Never commit signing keys or passwords.

## Compatibility rule

Do not change `appId: com.noor.adhkar` for this rebrand. The app display name is Naseem; the project/repository remains Noor. Internal Java package names, native plugin identifiers, local storage keys and event names are intentionally retained. This is important for upgrade compatibility and preserving user data.

## Important scope note

This ZIP is the first V4 development foundation, not the finished implementation of every feature in the approved blueprint. See `docs/IMPLEMENTATION_STATUS.md` for what is included now and what remains planned. The advanced Qibla, full Zakat engine, complete Hijri calendar, expanded Dhikr/Dua content, multi-tradition learning, onboarding and expanded widgets require subsequent development and testing.

## Testing

Run `npm install`, `npm run build`, and `bash tests/run.sh` with the dependencies listed in the test instructions. Native Android alarms/widgets and upgrade behaviour must be tested on a physical device. Review all religious text and calculations with qualified sources/editors before public release.

## V4.0.1 accent update

This incremental update adds a persistent accent-colour selector under **Settings → Appearance**:
- Islamic emerald (default), deep forest, royal blue, midnight purple, muted gold, silver/grey, and a custom colour picker.
- Applies across the existing dark and light theme tokens.
- Saved locally and included in JSON backup/restore.
- Android build metadata is set from `package.json` by `scripts/patch-android.mjs` (`versionName 4.0.1`, `versionCode 40001`). The application ID remains `com.noor.adhkar`.

### Installing as an update
Android only installs an APK over an existing app when the application ID **and signing certificate** match and the incoming version code is higher. This source preserves the application ID and raises the version code. The current GitHub workflow still produces a debug APK; a debug key generated on a fresh GitHub runner is not guaranteed to match a previously installed APK. For reliable in-place updates, configure one persistent signing keystore in GitHub Actions secrets and use it for every subsequent build. Otherwise Android may require uninstalling the old app first, which can erase local data; export a Naseem backup before doing that.

### Validation performed for 4.0.1
- JavaScript syntax checks passed for the new accent module and settings integration.
- Runtime checks passed for default emerald, preset selection, custom colour selection, persistence and CSS variable application.
- Existing prayer-engine comparison: 9,840 comparisons passed within 1 minute.
- Browser-driven scheduling/UI tests could not run here because the Playwright Chromium executable is not installed. No APK build or physical-device test is claimed.


## V4.0.2 — Explore, Qibla and Zakat first pass
- Added an Explore tab separating available tools from roadmap previews. Planned modules are labelled **Under development** and do not simulate unfinished behaviour.
- Added a first-pass Qibla finder with Kaaba bearing/distance calculations, saved prayer-city coordinates, optional device location and device-orientation sensor support. The Home English countdown circle is now a Qibla compass preview; the Arabic prayer countdown remains.
- Added a preliminary Zakat estimate using user-entered INR asset values, due liabilities, a manually verified nisab value and a lunar-year confirmation. The estimate applies 2.5% only when the simplified conditions are met.
- Replaced the previous launcher artwork with an emerald mosque-and-crescent emblem.
- The Android application ID remains `com.noor.adhkar`; build metadata advances to version 4.0.2 / versionCode 40002.
- Physical-device checks are still required for compass sensor behaviour and GPS permissions. The Zakat estimator requires additional asset-specific and scholarly review before public release.
