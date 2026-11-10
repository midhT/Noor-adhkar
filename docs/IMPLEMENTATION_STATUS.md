# Naseem V4.0.5 — implementation status

## Updated in this release candidate
- First-launch setup now includes optional display name and an explicit learning-profile choice; choices are stored locally.
- Setup completion prevents automatic reappearance. Settings provides a manual setup-reopen action.
- Android notification permission is requested automatically after setup completion, with graceful behaviour if declined.
- Asr no longer silently assumes Hanafi on fresh installs. Older unconfirmed Hanafi defaults are migrated to Standard once; explicit user choices are retained.
- More replaces Explore; unavailable placeholder tiles are removed.
- Widget Studio now only controls the Tasbeeh widget. Prayer reminders remain in Salah settings.
- Home has Hijri calendar access and a Ramadan-only Sehri-end/Fajr and Iftar/Maghrib card.
- Online Hijri date refresh and upcoming occasion-date refresh use AlAdhan (Umm al-Qura calendar) as best-effort sources with device-calendar/cached fallback.
- Public release checker reads `midhT/Naseem-public/release.json`, shows an in-app update card and can send a local notification when permission is available. It only links to a release for manual installation.
- `public-content/` contains seed JSON and instructions for the separate public content repository.

## Existing features retained
- Offline Salah calculation and Jamaat settings, Qibla, Adhkar sessions, Tasbeeh, Zakat estimate, Hijri conversion, Dua starter library, learning pages, Glance fallback, backup/restore, and existing Android widget integration.

## Still required before public release
- Create `midhT/Naseem-public` and copy the seed files from `public-content/` to its root. Publish and verify the first GitHub Release and APK link.
- Verify the update feed notification end-to-end with a later version.
- Verify the online Islamic-occasion calendar integration against local moon-sighting practice and complete dedicated Zawal/Ramadan timetable validation.
- Verify remote Dua feed updates and Glance feed on a live public repository.
- Full Samsung device checks for notifications, prayer scheduling, widgets, location, Qibla sensors, startup/onboarding persistence, backup/restore and in-place APK updates.
- Confirm the existing signing key is retained in CI. Never replace it casually: Android will reject an update signed with a different key.
- Review all Arabic text, translations and religious references with qualified reviewers.
- Prepare privacy policy, Data Safety declarations, store listing, and a signed release build before Play Store submission.

This package is a **release candidate**, not a verified public release.
