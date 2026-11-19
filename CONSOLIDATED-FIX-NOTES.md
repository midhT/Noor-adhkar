# Naseem 4.1.0 build 40115 — Quran/browser verification repair

## Changes in this archive
- Quran offline text download fetches surahs sequentially and commits IndexedDB records in batches of ten. This avoids overlapping writers and reduces transaction overhead while retaining already-saved surahs for resumable downloads.
- The offline browser test uses a real locator click, checks that the handler starts, waits for a terminal status, and captures API/CDN requests, failed requests, console errors, and safe DOM state when it fails.
- The word-follow-along browser assertion waits for the asynchronous timing-data request and first audio time update instead of assuming highlighting must appear within 250 ms.
- The bottom-of-reader layout test disables smooth scrolling for its measurement and waits until the document has actually reached its maximum scroll position.
- The responsive foundation restores vertical document scrolling on `.app-shell` while retaining horizontal overflow clipping, so bottom reader controls can clear the floating navigation.
- The Quran offline static contract now checks the actual sequential, batched writer implementation.
- Existing Quran features, app identity, package ID, public version 4.1.0, and versionCode 40115 are retained.
- No local signing keystore is included or changed. CI must continue using the existing protected signing secrets and original signing identity.

## Validation performed in the preparation environment
- All JavaScript syntax checks passed.
- All standalone Node integration checks passed, including Quran reader, Quran memory, Quran Foundation Worker, Mushaf integration, Quran player, release configuration, signing configuration, and public update checks.
- Responsive, navigation, and V4.1.0 static checks passed.
- Python syntax compilation for the Quran browser test passed.
- The local Playwright browser suite could not be executed here because the environment blocks Chromium access to its local test server (`ERR_BLOCKED_BY_ADMINISTRATOR`). The required GitHub Actions browser suite and Android build have therefore **not** been claimed as passed; they must run in GitHub Actions.
