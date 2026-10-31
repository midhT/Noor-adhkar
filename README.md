# Noor — phone-friendly APK build project

This project packages the Noor static web app into an Android APK using GitHub Actions.
You do not need a laptop to run the build, but you do need a GitHub account and internet access.

## Build from your phone

1. Extract this ZIP on your phone.
2. Open GitHub in your browser and create a **new public or private repository** named `noor-adhkar`.
3. Upload the project files and folders from this ZIP into the repository root. Keep the paths exactly as shown:
   - `package.json`
   - `capacitor.config.json`
   - `www/` (all web app files inside)
   - `.github/workflows/build-apk.yml`
   - `README.md`
4. Open the repository's **Actions** tab.
5. Select **Build Noor APK** on the left, tap **Run workflow**, then **Run workflow** again.
   - If the workflow does not appear, ensure the workflow file is at `.github/workflows/build-apk.yml` and reload the page.
6. Wait for the workflow to finish successfully.
7. Open that completed run, scroll to **Artifacts**, and download `Noor-debug-APK`.
8. Extract the downloaded artifact ZIP; tap `app-debug.apk` to install. Android may ask you to allow installs from your browser or file manager.

## Notes
- This produces a **debug APK** for personal testing, not a Play Store release.
- Keep your GitHub repository private if you don't want the source code public.
- This app stores progress on the device. Clearing app data can erase it.
- The starter app is an MVP; verify religious text and references before relying on it.
