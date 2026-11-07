# Noor V5 — Build & Install

You develop in Termux and build in GitHub Actions. Nothing here force-pushes or rewrites history.

## 1. Put the source on a new branch of your repo (Termux)
```bash
pkg install -y git tar
termux-setup-storage            # once, to read ~/storage/downloads
git clone https://github.com/<YOU>/<REPO>.git noor && cd noor
git checkout -b v5-rebuild
# remove old tracked sources so stale V4 files cannot break the build
git rm -r -q --ignore-unmatch lib android test .github docs assets tool
rm -rf lib android test .github docs assets tool
# unpack V5 on top (archive has no .git)
tar -xzf ~/storage/downloads/noor-v5-source.tar.gz --strip-components=1
git add -A
git commit -m "Noor V5: Flutter rebuild"
git push -u origin v5-rebuild   # plain push, never --force
```
`--strip-components=1` assumes the archive's top folder is `noor-v5/`.

## 2. Build the APK
Pushing branch `v5-rebuild` triggers **Build Noor Android** (`v5*` is in the trigger list). Or open a PR into `main`.

1. GitHub → **Actions** → latest run.
2. Two jobs: **Analyze and test** and **Build release APK**. They run in parallel; the APK job does not wait for tests.
3. Open the run → **Artifacts** → `Noor-5.0-Android-APK` → download and unzip → `app-release.apk`.
4. If a job is red, open it and send me the failing step's log.

## 3. Install on the phone
```bash
cp ~/storage/downloads/app-release.apk ~/storage/downloads/noor.apk
termux-open ~/storage/downloads/noor.apk
```
Allow "Install unknown apps" for your file manager/Termux when asked.

- V5 builds are signed with a fixed **test** key (`android/app/noor-test.keystore`, public by design), so each new V5 APK installs over the previous one and keeps your data.
- V4 (if installed) was signed with a different key, so Android will refuse to update it: **uninstall V4 once** first (its only data was the counter and Jamaat times). V3 is a different app and can stay.

## 4. First-run setup
1. Salah tab → **Use location** (or enter coordinates).
2. Settings → choose calculation method and Asr (Hanafi/Shafi‘i).
3. Settings → **Prayer reminders** on → allow notifications → allow "Alarms & reminders" → send the test notification.
4. Settings → battery: set Noor to *Unrestricted* (Android battery settings) so alarms are not killed.
5. Long-press home screen → Widgets → Noor: add Salah / Tasbeeh / Verse.

## 5. Bringing over V3 history
In V3 use *Export my data*, open the JSON, copy it, then Noor → Settings → **Import history** (reads the clipboard).

## Local checks (no Flutter needed)
```bash
python3 -I tool/check_dart.py
```
With Flutter installed: `flutter pub get && flutter analyze && flutter test && flutter build apk --release`.
