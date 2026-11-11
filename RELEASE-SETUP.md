# Naseem 4.0.7 release setup

## Scope
This release remains offline-first. Personal data stays on the device. No account, cloud database, or cloud sync dependency is added. User-controlled JSON export/restore remains the manual transfer path.

## GitHub Actions secrets required
Create these repository Actions secrets before running `.github/workflows/release.yml`:

- `NASEEM_KEYSTORE_BASE64`: Base64-encoded contents of the new release `.jks`/`.keystore` file.
- `NASEEM_STORE_PASSWORD`: keystore password.
- `NASEEM_KEY_ALIAS`: key alias.
- `NASEEM_KEY_PASSWORD`: key password.

Generate the new key on a trusted device with Android `keytool`; keep a separate encrypted offline backup. Encode the file as one Base64 line and add it as the secret. Never put the keystore, passwords, or Base64 value in the repository, issue tracker, chat, or build artifacts. Do not rotate this key after shipping V4.0.7; all future updates must use the same certificate.

## Build and publish

- Push ordinary changes to a `naseem-*` branch or run **Build Naseem debug APK** for a test artifact.
- After the release secrets are set, push tag `v4.0.7` to run the signed release workflow. It builds `assembleRelease`, stores the APK as an Actions artifact, and publishes it to GitHub Releases.
- The release workflow rejects a tag that does not match `package.json`.
- Update `Naseem-public/release.json` separately when publishing the public update feed. This source repository's `public-content/release.json` is a template/copy, not the live feed endpoint.

## One-time signing transition
V4.0.7 uses a new signing certificate. Android will not install it over an APK signed with the old certificate. Before installing V4.0.7, export a Naseem backup from Settings → Data & Backup and verify the JSON file exists. Then uninstall the previous app, install V4.0.7, and restore the backup. Do not uninstall until the signed V4.0.7 APK has been built and checked. The application ID remains `com.noor.adhkar`.

## Verification still required
A successful workflow is not a substitute for physical-device checks. Verify install/launch, backup/restore, local data retention after ordinary updates, prayer notifications, widgets, location, Qibla, and the live public content feed on the target Android device. Obtain qualified review of religious text and calculations before public distribution.

## Public update feed
After the APK is successfully published, copy `docs/public-feed/release.json` from this patch to `release.json` in the separate `midhT/Naseem-public` repository. Commit and push that repository separately so the in-app update checker sees V4.0.7. Do not publish the feed before the APK release exists.
