# Naseem 4.1.0 · Quran reciters and playback · Android build 40110

- Added five selectable Qaris: Muhammad Al-Luhaidan, Mishary Rashid Alafasy, Abdurrahman Al-Sudais, Mahmoud Khalil Al-Husary and Mohamed Siddiq Al-Minshawi.
- Muhammad Al-Luhaidan is the only entry labelled **Word by word**, because that is the only recording paired with the timing dataset currently integrated.
- Other reciters use their own per-ayah audio endpoint; the UI does not claim word-level timing for them.
- The selected reciter is persisted and shown in both the mini-player and full-screen player.
- Public version remains 4.1.0; Android versionCode is 40110. Package ID remains `com.noor.adhkar`. The existing protected signing identity is unchanged and no signing material is included.
- Source/static tests passed. Chromium browser tests, Gradle compilation, signed release, physical-device playback and actual in-place update remain unverified in this workspace.
