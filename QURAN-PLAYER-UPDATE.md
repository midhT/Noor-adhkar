# Naseem 4.1.0 · Quran player, reciters and motion · Android build 40111

## Player
- The mini-player opens the full player when tapped anywhere on it (not only on the title). The full player expands out of the mini-player and shrinks back into it; pulling it down from the top bar or artwork also closes it.
- Play/pause is one morphing icon; the artwork morphs between a rounded square (paused) and a circle (playing).
- **Lyrics** button: shows the surah verse by verse, the verse being recited is highlighted and kept centred, tapping a verse recites from it. For the word-synchronised reciter the current word is highlighted as well.
- Reciter button opens a sheet to switch reciter without leaving the player; playback continues from the same ayah.

## Reciters (13)
Muhammad Al-Luhaidan (word by word), Mishary Alafasy, Abdurrahman Al-Sudais, Mahmoud Al-Husary, Mohamed Al-Minshawi, Saud Al-Shuraim, Abdul Basit, Abdul Basit (Mujawwad), Al-Minshawi (Mujawwad), Ali Al-Hudhaify, Ahmed Al-Ajamy, Muhammad Ayyoub, Muhammad Jibreel. Only Al-Luhaidan has matching word timing; all others are verse by verse and are not labelled as word by word.

## Motion and ambience
- Ambience removed. Accent colours kept.
- Tab pill morph, cross-fading screens, spring press feedback, gliding panels. Transform/opacity only. Disabled by Smooth mode and by reduced-motion.

## Validation status
- Quran UI browser test passes in Smooth mode and with full animations (NASEEM_FULL_MOTION=1). Motion, P0, Adhkar, Glance, onboarding and static suites pass here.
- Not run here: tests needing the native bundle build (scheduling, widget studio), Gradle, signed release, physical-device playback/feel, live audio for the 8 added reciters.
