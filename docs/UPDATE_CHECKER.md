# Naseem public update checker

Naseem checks the public `midhT/Naseem-public` release feed without a GitHub token. It compares the published semantic version with the app's embedded `naseem-version` value, checks automatically on launch (after the initial UI settles) and when connectivity returns, and exposes **Settings → About Naseem → Check for updates** for a manual check.

When a newer release is found, Naseem displays an in-app banner with the direct APK asset and release-notes links. On Android, it schedules one local notification per newly detected version only when notification permission is already granted. The user dismisses the banner or notification and chooses whether to download and install. Android remains responsible for the final package-install approval; the app never silently installs an APK.

The release workflow publishes `app-release.apk`, `app-release.apk.sha256`, and the SHA-256 value plus checksum URL in `release.json`. The current updater exposes the official download and checksum metadata but deliberately opens GitHub's release asset in the system browser: it does not yet implement an in-app APK download manager, automatic byte-level checksum verification, or Android package-installer handoff. Those require a dedicated native download/install plugin and device-level testing, and must not be described as implemented.

The M2 Playwright suite is a returning-user/navigation suite. It seeds the onboarding-complete key in its isolated browser context. First-launch onboarding and persistence remain covered separately by `tests/test_ui_logic.cjs`.
