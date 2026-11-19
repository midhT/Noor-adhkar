# Naseem 4.1.0 build 40115 — consolidated source repair

## Changes in this repair
- Quran offline save now reads the IndexedDB index once, downloads up to four surahs concurrently, and stores each surah's Arabic and English payloads in one write transaction. Existing saved surahs are retained and skipped.
- Restored normal document vertical scrolling by overriding the app-shell clipping rule; horizontal overflow remains constrained at the document level.
- Added the Quran Foundation Worker, Mushaf integration, and Quran player core suites to `tests/run.sh`.
- Updated the legacy 40114 static contract test to assert the actual 40115 HTML and service-worker cache versions.
- Excluded the local Android signing keystore and signing directory from this distributable archive. The original local keystore is not modified or deleted. CI signing must continue to use the existing protected credentials.

## Validation boundary
JavaScript syntax and the three newly wired standalone suites are run against this source archive during preparation. Playwright browser UI tests, GitHub Actions, Android Gradle build, installed-app signature comparison, and physical-device QA still require CI/device execution. This archive is not a signed APK or release approval.

## Identity and release constraints
Public version remains 4.1.0; versionCode remains 40115. Keep application ID `com.noor.adhkar` and the existing signing identity/secrets unchanged. Do not generate or rotate a keystore.
