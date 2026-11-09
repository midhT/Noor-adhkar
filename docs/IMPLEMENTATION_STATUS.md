# Noor Project V4 / Naseem — Implementation Status

## Included in this delivery

- Existing Noor V3.3 M2.1 source preserved as the starting point.
- Capacitor `appName` changed to **Naseem**.
- Android application ID deliberately remains `com.noor.adhkar` for upgrade compatibility.
- Web app title, metadata, wordmark, About screen and relevant user-facing Android widget labels updated to Naseem.
- PWA manifest updated for Naseem and emerald theme colour.
- Default dark-theme accent shifted toward Islamic emerald.
- Launcher icon source layers, monochrome icon and splash artwork redrawn around Arabic **نسيم** and breeze motifs.
- GitHub Actions workflow label/artifact updated to `Build Naseem APK` / `Naseem-debug-APK`.
- Full product requirements recorded in `docs/NASEEM_V4_BLUEPRINT.md`.
- Visual direction reference included at `docs/design/naseem-product-vision-mockup.png`.

## Not yet implemented in this first V4 development delivery

The full blueprint is a multi-phase build, not a claim that every feature is already functional. In particular, the advanced Qibla compass, five-tradition learning system, expanded Dhikr/Dua libraries and audio, full Zakat engine, Hijri calendar, onboarding wizard, seven-choice accent picker and expanded widget set remain planned work unless already present in the inherited V3.3 code. Do not treat the concept mockup as a screenshot of a working app.

## Compatibility notes

- Keep `com.noor.adhkar` unchanged. Changing the Android application ID would make this a separate Android app and prevent in-place upgrades.
- Keep internal identifiers such as `NoorNative`, `NoorWidgets`, storage keys, Java package names, widget resource identifiers and `noor:` events unchanged during the display-name migration. Renaming these risks breaking stored data, native bridges, widget state or event listeners.
- Existing local user data should remain in place. Back up before installing test builds.

## Build and validation

- Run `npm install` and `npm run build` in an environment with Node.js/network access.
- Run `bash tests/run.sh` with the test dependencies documented in the repository.
- Run the GitHub Actions workflow and inspect the APK artifact.
- Install over an existing Noor build signed with the same key to verify upgrade compatibility. If signing keys differ, Android may reject the update; uninstalling can erase local data.
- Test native widgets, Adhan/reminders, reboot restoration, location and backup/restore on a physical Android device.

This delivery is a branded development foundation and implementation handover, not a Play Store-ready release or a completed implementation of every blueprint feature.


## V4.0.1 — Accent personalisation (implemented in this delivery)
- Added six named accent presets plus a custom colour picker.
- Islamic emerald is the default.
- Accent selection persists locally and is included in JSON backup/restore.
- Accent variables apply to the existing theme tokens, so dark and light modes both inherit the selected colour.
- This release does not claim that the remaining V4 blueprint features are implemented.


## V4.0.2 first-pass feature expansion (2026-11-09)
- Public app branding remains **Naseem (نسيم)**; repository/internal project identity remains Noor. Android application ID remains `com.noor.adhkar`.
- Replaced the previous launcher artwork with a new mosque-and-crescent emerald emblem; updated SVG, Capacitor icon layers, splash artwork and Android monochrome icon.
- Added an Explore hub. New roadmap cards are UI previews marked **Under development** and do not pretend to work.
- Added a first-pass Zakat estimate: user-entered INR asset values, liabilities, manually verified nisab, lunar-year toggle and simple 2.5% estimate. It is educational only and is not a complete fiqh calculator.
- Added a first-pass Qibla finder: bearing/distance from the Kaaba using saved prayer-city coordinates or device geolocation, plus a device-orientation compass where the device/browser exposes a supported sensor.
- Neither new tool has been validated on a physical Android phone yet. Compass sensor support, location permission flow and sensor calibration require device testing. Zakat formulas require scholarly/fiqh review before release.
- Home dashboard now uses the English countdown circle as a compact Qibla compass preview; the Arabic prayer-countdown circle is preserved. The home compass reflects the calculated bearing and follows the live sensor once compass access is enabled in the finder.
