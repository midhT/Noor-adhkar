# Naseem 4.1.0 — build 40104 source delivery

## Implemented in this source update

- Restored the existing Home-first layout and identity. The original remembrance, streak, Hijri and Dhikr content remains on Home; the prayer dashboard and the prayer timings that previously lived there are restored below the Home greeting rather than replacing Home with the Salah screen.
- Reworked first-run setup into a seven-step flow inspired by the supplied Prayerly references, restyled to Naseem's restrained dark/green theme: Welcome, Earlier/Later Asr, calculation method with Auto detect, optional notification permission, optional profile preference, GPS/manual city selection, and the live Salah-sky introduction.
- Manual location search now renders selectable city results and saves the selected city's coordinates and time zone. GPS denial/unavailability falls back to manual city selection. The list uses the app's bundled city catalogue; it is not a live global geocoder.
- Removed the visible Sunni/Hanafi/Madhhab selector. The user-facing preference is now Earlier Asr time / Later Asr time. Internal legacy calculation values remain for existing saved settings and calculation compatibility.
- Added a Salah habit tracker for the five daily prayers, local daily history, seven-day consistency, next-prayer countdown, live sky phase and moving sun based on local prayer times, plus a separately marked optional Tahajjud estimate based on the last third of the night.
- Kept the existing step-by-step Salah learning/recitation guide behind its existing compact details toggle; it remains available below the tracker rather than taking over the Salah screen.
- Restyled the Qibla compass with a dark radial dial, green directional marker and central live-degree readout, taking interaction/layout inspiration from Prayerly. Existing Qibla bearing calculations, sensor filtering, left/right guidance and alignment hysteresis are retained.
- Improved update detection to compare Android version codes as well as the public version name. The displayed app version remains `4.1.0`; the Android build code is `40104`, higher than previous 4.1.0 builds. The release workflow replaces assets on the existing `v4.1.0` release tag and publishes `androidVersionCode` in the public feed.
- Added JavaScript syntax checks for edited/source JS and an ESLint `no-undef` check to the CI test runner. Required browser tests fail the CI run if they would otherwise be skipped.

## Compatibility and preserved identity

- Display version: `4.1.0`
- Android versionCode: `40104`
- Application ID: `com.noor.adhkar` (unchanged)
- Public app name: `Naseem`
- Internal source/project identity and data keys remain compatible.
- Existing protected GitHub signing secrets and signing configuration were not changed. No keystore or signing secret is included in this ZIP; do not generate or rotate a signing key.

## Verification performed in this workspace

Passed:
- JavaScript syntax checks across `www/*.js`, `scripts/*.mjs`, and test JS/MJS files.
- Source integration, responsive-foundation, navigation, Android patch/version-code, public update checker, signing configuration, Adhkar, custom routines, custom widgets, Hadith, Quran, release configuration and Salah calculation checks.
- Salah-engine comparison: 9,840 comparisons; worst difference 0.55 minutes; no comparison exceeded the 1-minute tolerance.

Not verified locally:
- Full `tests/run.sh` stopped at `tests/build_native_bundle.cjs` because `esbuild` was unavailable; npm registry access timed out while attempting to install dependencies.
- ESLint `no-undef` could not be fetched locally, so that new CI check was explicitly skipped for the local run. GitHub Actions will run it without the skip flag.
- Chromium browser tests were blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`) when opening the local test server. The complete browser suite must pass in GitHub Actions.
- Android Gradle APK compilation, signing-certificate comparison, install/update, notifications, widgets and physical-device checks have not been run in this workspace.

This is a source ZIP for the repository's CI build, not a prebuilt APK. Run the signed-candidate/release workflow with the existing protected signing secrets and require the full browser suite and APK build to pass before distributing an update.

## Deliberate limitation

The Hijri calendar's existing device-calendar calculation, monthly reference check and local ±1-day correction are preserved. This source update does not introduce a new verified, per-region moon-sighting authority feed; such a feed should only be added once trusted regional data sources and their update rules are established.
