# Naseem 4.1.0 build 40115 — consolidated source repairs

This archive is based on the uploaded build 40115 source ZIP and includes:

- The previously prepared motion-test v2 correction for the five real bottom-navigation destinations; Features and Zakat remain nested destinations inside You.
- The returning-user browser test seeding already present in that motion-test patch.
- Updated release-contract assertions to match versionCode 40115 and service-worker cache `noor-adhkar-cache-v4115`; production source already declares these values.
- Added `android-native/res/drawable/ic_media_play.xml`, a vector play icon for the native media service resource reference.

No app ID, public version name, keystore, signing configuration, or GitHub signing secrets were changed.

This is a source repair archive, not a claim that GitHub Actions, Android compilation, live API checks, or device QA have passed. Run the full CI suite after importing.
