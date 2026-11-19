Naseem 4.1.0 / build 40115 — Dhikr swipe regression-test correction

This patch updates only tests/test_motion.py.

Root cause:
The app intentionally preserves the last selected Dhikr subpanel when the
user leaves Dhikr. The test first switched Counter -> Adhkar, then navigated
away. On returning from Salah, the app correctly restored Adhkar. The prior
test incorrectly expected Counter, which desynchronized every later swipe and
left #countButton hidden at the final click.

Corrected expected sequence:
Salah -> Dhikr (Adhkar restored) -> Counter -> Home.
Then it re-enters Dhikr and independently verifies Counter -> Adhkar -> Counter.

No production app code, app version, package ID, Android signing configuration,
keystore, GitHub secrets, or release assets are changed.

Apply from the repository root:
  cd ~/noor-adhkar
  unzip -o ~/storage/downloads/Naseem-40115-motion-test-fix-v2.zip -d .
  python3 -m py_compile tests/test_motion.py
  git diff -- tests/test_motion.py

Then commit and push:
  git add tests/test_motion.py README-MOTION-TEST-FIX.txt
  git commit -m "Correct Dhikr swipe test for preserved panel state"
  git push origin HEAD

GitHub Actions remains the final Playwright/browser validation environment.
