# Naseem 4.1.0 · Qari picker capability label · Android build 40109

- Added a Reciter row to Quran reader settings with an expandable Qari selection menu.
- The currently supported word-synchronised reciter, Muhammad Al-Luhaidan, is shown as a selectable Qari entry.
- The capability label **Word by word** appears immediately below the reciter's name, not beside it or as a global label.
- The label is attached only to the reciter whose recording has matching word-level timing data. Do not show it for reciters without matching timing data.
- Public version remains 4.1.0; Android versionCode is 40109 for an in-place update. Existing application ID and signing configuration are preserved.
- Static Quran integration, Android patch, release configuration, public updater, and release requirement tests pass. Physical-device visual testing and signed APK installation remain pending because Chromium is unavailable in this environment.
