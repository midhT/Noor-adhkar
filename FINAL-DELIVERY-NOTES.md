# Naseem 4.1.0 — final onboarding, Salah and More source package

## Included changes

- Replaced the prior first-run setup with a seven-step responsive onboarding flow.
- Visible tradition and theme cards now own their state; obsolete hidden duplicate selects were removed.
- Added an explicit notification opt-in step. Android permission is requested only after the user presses the button. The setup never silently enables prayer alarms; Adhan/Jamaat schedules remain under Settings → Notifications.
- Retained city search, city selection, device-location handling, optional profile name, theme selection, skip/back/continue/finish and one-time completion persistence.
- Made the Salah tab a prayer hub: next prayer, five-prayer timetable, countdown, Jamaat details, Qibla shortcut and Prayer settings shortcut.
- Kept recitation learning available in a collapsible secondary section.
- Reduced and separated the Dua Library shortcut from the final Salam recitation.
- Removed the duplicate School & Salah profile shortcut from More because the same preference is already editable in Settings → Salah.
- Preserved the Quran, Adhkar, Dua, Zakat, widgets, reminders and other existing features.

## Release identity

- Display version: `4.1.0`
- Android versionCode: `40103`
- Application ID: `com.noor.adhkar`
- Public app name: `Naseem`
- Internal project identity: Noor Adkar
- Existing GitHub signing secrets and signing configuration are preserved. No new keystore is included or generated.

## Build and verification status

Static source, integration, signing-configuration, native-patch, Quran, Adhkar, custom routine, custom widget, Hadith, update-checker, responsive-foundation and Salah calculation checks passed. Salah engine comparison: 9,840 comparisons, worst difference 0.55 minutes.

Playwright browser interaction tests could not be run in this environment: browser navigation to local HTTP and file URLs is blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`). `npm ci` timed out, so the local native bundle/build could not be completed because `esbuild` was unavailable. Run the repository's GitHub Actions workflow for the actual APK build, then test first-run onboarding on a clean install and returning-user behaviour on an existing install.

This is a source ZIP for GitHub Actions, not a prebuilt APK. Do not rotate signing credentials or change the package ID for this update.
