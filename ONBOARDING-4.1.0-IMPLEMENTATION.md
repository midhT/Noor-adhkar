# Naseem 4.1.0 onboarding implementation — build 40104

The previous onboarding is replaced by a seven-step, responsive setup flow, adapted from the supplied Prayerly references and styled to match Naseem's dark, restrained green identity:

1. Welcome and introductory reminder
2. Earlier Asr time / Later Asr time preference
3. Prayer calculation method, with Auto detect and named regional methods
4. Optional notification permission request
5. Optional profile preference
6. Device location or searchable manual city selection
7. Live Salah-sky explanation and completion

The visible Madhhab/Sunni/Hanafi selector is removed. Internal legacy calculation values are retained so existing saved settings and calculation behavior remain compatible. Manual city selection saves the chosen city's coordinates/time zone; GPS denial opens the manual fallback. The one-time setup completion key remains `naseem-onboarding-complete-v1`.

The onboarding and app screens use the same minimal green-accent theme. The home screen retains its original remembrance-first content; prayer timings are restored to Home without replacing it with the Salah tab. Salah is a separate habit-tracking view with a time-responsive sky, five daily prayer completion controls, a seven-day summary, next-prayer countdown and an approximate optional Tahajjud window. The existing prayer-learning guide remains available through its compact disclosure toggle.

The Qibla visual treatment is inspired by Prayerly's compact compass presentation, but the app retains its own existing Qibla calculation and sensor logic. No new regional moon-sighting feed is claimed; the device Hijri calendar and local correction remain in place.

## Release identity

- Display version: `4.1.0`
- Android `versionCode`: `40104` (must increase for each later APK)
- Application ID: `com.noor.adhkar` (unchanged)
- Existing signing keystore, alias and GitHub secrets must be reused exactly. Never generate or rotate the signing key for an in-place update.

## Local validation status

Source integration and static checks passed, including 9,840 prayer-time calculations with a worst difference of 0.55 minutes. JavaScript syntax, Android patch/version-code, update-checker, signing-configuration, navigation and responsive-foundation checks also passed.

The full browser suite and Android APK build could not be completed in this execution environment: Chromium blocks local loopback navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`) and npm dependency installation timed out, leaving `esbuild` unavailable. GitHub Actions must run the full browser suite, ESLint `no-undef`, web bundle and Android Gradle build before the APK is treated as release-ready.
