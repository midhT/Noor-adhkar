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


## Build 40114 Quran UI, player and performance refinement
- Replaced the high-saturation player surface with a restrained graphite layout and a single muted accent.
- Added consistent monochrome identity thumbnails for each reciter in the mini-player, full-screen player and picker. They are abstract identity markers with initials, not photographic portraits.
- Refined the full Quran surface: home/index, Surah/Juz/Page/Bookmarks/Memory tabs, search/list rows, reader toolbar/settings, ayah presentation, memorisation cards and the full player hierarchy around surah, ayah reference, reciter identity, lyrics and transport controls.
- Applied translucent glass only to the audio seek bars; bottom navigation remains unchanged.
- Quran index and ayah content now show skeleton placeholders and render in animation-frame batches. Quran search is debounced.
- Global screen entry animation now targets only the first four content blocks to avoid dozens of simultaneous animations on long screens.
- Existing playback pipeline, reciter edition IDs, word timing, lyrics follow-along, bookmarks and memorisation remain in place.


## Build 40115 Mushaf reader integration

Build 40115 retains the wavy waveform player and adds the Mushaf-aware page/line reader. See `IMPLEMENTATION-40115.md` and `quran-foundation-worker/README.md` for the API and deployment details.
