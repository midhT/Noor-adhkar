# Naseem 4.1.0 release setup

## CI pipeline
- `.github/workflows/tests.yml` runs source checks and the browser/UI suite on GitHub-hosted Linux with Chromium.
- `.github/workflows/build-apk.yml` builds an unsigned debug APK for device testing.
- `.github/workflows/release.yml` builds a signed release APK, publishes it to `midhT/Naseem-public`, and updates the public release, Glance and Dua JSON feeds.

## Required GitHub Actions secrets
Configure these secrets in the **private `midhT/Noor-adhkar` source repository**:
- `NASEEM_KEYSTORE_BASE64` — base64-encoded new release keystore.
- `NASEEM_STORE_PASSWORD`
- `NASEEM_KEY_ALIAS`
- `NASEEM_KEY_PASSWORD`
- `NASEEM_PUBLIC_REPO_TOKEN` — fine-grained token with Contents read/write access to `midhT/Naseem-public`.

The old embedded signing key was exposed and must not be reused. A new signing certificate cannot update-install over an APK signed by a different certificate. Back up app data before migration; preserve the new key and passwords securely and never rotate the key after first publication.

## Release gate
1. Run the Linux verification workflow and confirm all browser tests pass.
2. Run the debug build workflow and install/test the APK on the target Samsung device.
3. Verify widgets, notification permissions, alarm/reboot behavior, Salah/Jamaat, theme/onboarding persistence, Quran offline download, Glance/Dua feeds and offline fallbacks.
4. Complete qualified review of religious text and references.
5. Configure all five secrets, run the release workflow, verify the APK signature and checksum, then confirm the public GitHub release and feed URLs resolve.

Do not publish until the remaining items in `RELEASE-BLOCKERS.md` are cleared. Widget Studio supports a shared user-composed Custom Widget template; independent per-instance layouts are not implemented. Quran audio is not bundled offline; physical-device QA and religious review remain mandatory.
