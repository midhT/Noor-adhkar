# Naseem 4.0.8 release audit — RC3

## Implemented in source (not all device-verified)
- V4.0.7 cumulative feature work is integrated into the V4.0.6 source baseline; app version metadata is 4.0.8.
- First-run onboarding is not exposed as a repeatable Settings action. Notification permission is explained/requested during setup and its status is visible in Settings.
- Quran Reader stores reading progress, supports Surah/Juz/Ayah navigation, caches opened Surahs, and includes an explicit IndexedDB download action for complete Arabic text (114 Surahs). Translation is cached as opened. Audio remains online/on-demand; offline audio and word-by-word synchronized highlighting are not implemented.
- Custom Adhkar routines support create/edit/delete/reorder, per-item counts, local persistence, progress and undo. They are separate from core daily routine streak credit.
- Glance and Dua feeds use versioned JSON, validation and local fallback content.
- Hijri date uses the device ICU calendar with a local ±1-day correction; monthly external reference checks are informational.
- Salah reference checks use selected coordinates, calculation method and Asr rule; they do not overwrite locally configured or mosque Jamaat times.
- Startup animation and theme-aware presentation are implemented.
- Android has Prayer Times, Tasbeeh and Hijri widgets with dedicated preview artwork and configurable shared appearance.
- Widget Studio now provides a user-composed Custom Widget: selectable Prayer/Tasbeeh/Hijri/personal-reminder blocks, compact or comfortable spacing, preview, persisted configuration, open-app or tap-to-count action, and a native Android home-screen provider. Existing widget data updates refresh it. All Custom Widget instances currently share one saved composition; independent per-instance configurations and arbitrary drag-and-drop positioning are not implemented.
- Signing material is excluded from the source tree; release signing expects protected CI secrets.

## Remaining verification and release blockers
- `npm install` and `npm run build` were not verified in this execution environment. GitHub-hosted Linux CI is configured to run source/browser tests and compile a debug APK.
- Playwright browser tests could not run in this environment. They must pass in GitHub Actions.
- Android Gradle compilation, APK signature validation, installation and physical-device QA remain outstanding. Test widget placement/resizing/refresh (including Custom Widget), notification grant/denial, reboot recovery, exact alarms, Adhan/Jamaat scheduling, theme/onboarding persistence, Quran offline download, feed fallback and upgrade compatibility on the target Samsung device.
- The complete Quran audio download and word-by-word synchronized highlighting are not implemented. Recitation audio redistribution rights have not been established; do not bundle or redistribute recordings without verified permission.
- Quran text, translations, Hadith, duas, references and school-specific guidance require qualified review before public release. No scholarly approval is claimed.
- The actual `midhT/Naseem-public` release and feed publication must be confirmed after CI. The five protected GitHub secrets listed in `RELEASE-SETUP.md` must be configured by the repository owner.

Do not publish until all applicable blockers are cleared.
