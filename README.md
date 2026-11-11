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

## Build and release with GitHub Actions

- **Debug test build:** run **Build Naseem debug APK** manually, or push to a `naseem-*` branch. Download the APK from the Actions artifact.
- **Signed release build:** configure the four protected signing secrets described in `RELEASE-SETUP.md`, then push a matching version tag such as `v4.0.7`. The release workflow builds `assembleRelease` and publishes the APK to GitHub Releases.
- Release signing material is not stored in this repository. Never commit a keystore, password, or Base64-encoded key.

V4.0.7 uses a new signing certificate. Back up app data before the one-time uninstall/reinstall transition. See `RELEASE-SETUP.md` for the exact procedure and required secrets. The Android application ID remains `com.noor.adhkar`.

## Compatibility rule

Do not change `appId: com.noor.adhkar` for this rebrand. The app display name is Naseem; the project/repository remains Noor. Internal Java package names, native plugin identifiers, local storage keys and event names are intentionally retained. This is important for upgrade compatibility and preserving user data.

## Important scope note

This ZIP is the first V4 development foundation, not the finished implementation of every feature in the approved blueprint. See `docs/IMPLEMENTATION_STATUS.md` for what is included now and what remains planned. The advanced Qibla, full Zakat engine, complete Hijri calendar, expanded Dhikr/Dua content, multi-tradition learning, onboarding and expanded widgets require subsequent development and testing.

## Testing

Run `npm install`, `npm run build`, `node tests/test_release_config.mjs`, and `bash tests/run.sh` with the dependencies listed in the test instructions. Native Android alarms/widgets and upgrade behaviour must be tested on a physical device. Review all religious text and calculations with qualified sources/editors before public release.

## V4.0.1 accent update

This incremental update adds a persistent accent-colour selector under **Settings → Appearance**:
- Islamic emerald (default), deep forest, royal blue, midnight purple, muted gold, silver/grey, and a custom colour picker.
- Applies across the existing dark and light theme tokens.
- Saved locally and included in JSON backup/restore.
- Android build metadata is set from `package.json` by `scripts/patch-android.mjs` (derived from the current `package.json` version). The application ID remains `com.noor.adhkar`.

### Installing as an update
Android only installs an APK over an existing app when the application ID **and signing certificate** match and the incoming version code is higher. This source preserves the application ID and raises the version code. The release workflow now uses one persistent signing key from protected GitHub Actions secrets. The V4.0.7 key is intentionally new, so this release requires one backup/uninstall/reinstall/restore transition; future updates must reuse this same new key.

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


## V4.0.4 feature work

See `docs/IMPLEMENTATION_STATUS.md` for the exact implemented/pending split and `TESTING_REPORT.md` for what has and has not been verified. Glance feed structure and setup are documented in `docs/glance-content/`. The APK workflow installs the Capacitor Android platform, generates icons, integrates native widget sources/manifest entries, applies the existing signing configuration, and builds the debug APK. Keep the signing key out of shared source archives and back it up securely.


## V4.0.4 feature work

See `docs/IMPLEMENTATION_STATUS.md` for the exact implemented/pending split and `TESTING_REPORT.md` for what has and has not been verified. Glance feed structure and setup are documented in `docs/glance-content/`. The APK workflow installs the Capacitor Android platform, generates icons, integrates native widget sources/manifest entries, applies the existing signing configuration, and builds the debug APK. Keep the signing key out of shared source archives and back it up securely.
