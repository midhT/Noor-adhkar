# Noor Project V4 — Naseem (نسيم)

**Project/repository identity:** Noor  
**App name shown to users:** Naseem (نسيم)  
**Android application ID:** `com.noor.adhkar` (intentionally preserved)

Naseem is the public-facing name of the Noor project. This delivery starts the V4 development track from the existing Noor V3.3 M2.1 Capacitor Android source. The repository and internal identifiers remain Noor to preserve compatibility with existing app data, native bridges and Android installations.

## What is in this V4.0.4 development source

- Existing V3.3/V4.0.3 app behaviour and data model retained.
- Functional first-pass Hijri calendar, Dua Library, traditional learning profiles, Islamic occasions, expanded Salah learning, Widget Studio and Glance client.
- First-launch onboarding, emerald startup animation, Home shortcuts and Android back-button handling.
- Native Android widget integration is applied by `scripts/patch-android.mjs` during CI, including Java classes, resources and manifest receivers.
- GitHub Pages Glance feed starter project in `glance-feed-template/`.
- Product blueprint, implementation status, and testing notes in `docs/` and `TESTING_REPORT.md`.

This is a development build. See `docs/V4.0.4_STATUS.md` for verified checks and remaining release gates.

## Build a test APK with GitHub Actions

1. Extract the ZIP and copy the **contents** of `noor-adhkar` into the root of your existing private `midhT/Noor-adhkar` repository, including hidden `.github` files.
2. **Preserve your existing `signing/naseem.keystore` separately.** It is intentionally excluded from source ZIPs. Do not generate a replacement key if you want in-place APK updates.
3. Push to a `naseem-*` branch or `main`, or manually run **Build Naseem APK** in Actions.
4. Download the `Naseem-4.0.4-debug-APK` artifact from the successful run.
5. Install over the previous build only if it is signed with the same key and has a higher version code. Back up app data before device testing.

The workflow can also restore a signing key from `NASEEM_KEYSTORE_BASE64` and use `NASEEM_STORE_PASSWORD`, `NASEEM_KEY_PASSWORD` and `NASEEM_KEY_ALIAS` GitHub Actions secrets. If no stable key is present, it produces a temporary debug-signed APK that may not update an existing installation.

Public Google Play distribution requires a production release build / Android App Bundle (`.aab`), secure Play signing setup, policy review and a privacy policy. Do not publish the sideload key or its passwords.

## Compatibility rule

Do not change `appId: com.noor.adhkar` for this rebrand. The app display name is Naseem; the project/repository remains Noor. Internal Java package names, native plugin identifiers, local storage keys and event names are intentionally retained. This is important for upgrade compatibility and preserving user data.

## Important scope note

The new V4.0.4 modules are first-pass implementations and still require physical-device testing and content review. The Hijri date may vary by moon-sighting authority; Salah/Dua learning content needs qualified review; widget behaviour, notifications, compass sensors and signing compatibility need real-device verification. See `docs/V4.0.4_STATUS.md` for the full list.

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


## V4.0.4 development notes
See `docs/V4.0.4_STATUS.md` and `docs/GLANCE_BACKEND.md`. The separate Glance repository is not created yet; set the public feed URL in `www/glance-config.js` after publishing the feed template.
