# Quran offline-download repair candidate

- Serializes offline IndexedDB writes instead of running four simultaneous download workers. This avoids overlapping read/write transaction pressure on mobile Chromium while retaining resumable per-surah saves.
- Reports the actual download exception in the status line and browser console.
- Keeps the browser regression test. It now exits on either completion or a surfaced failure and prints the failure reason.

Validation: JavaScript syntax and Python test syntax checked. Full Playwright/GitHub Actions and Android artifact build are not claimed as passed; they must be rerun in CI.
