# Naseem Quran word-by-word synchronisation

## Current implementation

- Reciter: Muhammad Al-Luhaidan (Hafs).
- Coverage: 114 surahs, using the published `quran-com` timing JSON format.
- Timing source: `its3li/quran-word-timings`, pinned to `v1.0.0` and licensed CC0 1.0.
- Audio: the exact `audio_url` contained in each surah's timing JSON. Do not substitute another recording or reciter while reusing these timestamps.
- Playback: one full-surah audio stream. Each ayah queue item stores absolute `timestamp_from`, `timestamp_to`, and word `segments` in milliseconds.
- Rendering: Arabic words are wrapped with `data-word-key="surah:ayah:word"`; the active timing segment receives `.qr-word-active`. The containing ayah receives `.quran-playing`.
- Seeking: seeking through the full-surah track resolves the current ayah and word from the same absolute timeline.
- Cache: timing JSON is cached in the existing bounded local Quran cache after first successful fetch. Audio remains streamed and requires a connection.

## Important source and rights boundary

The timing data is CC0 1.0. The recordings are not included in that licence and remain the property of their recording provider. The source dataset pairs each timing file with its own audio URL. Keep that pairing intact. Do not point this timing data at the previous Alafasy ayah audio or any other reciter's recording.

## Runtime source

`https://cdn.jsdelivr.net/gh/its3li/quran-word-timings@v1.0.0/data/muhammad-al-luhaidan/quran-com/NNN.json`

`NNN` is the three-digit surah number. Each file provides `audio_url` and `verse_timings`; each verse contains `verse_key`, `timestamp_from`, `timestamp_to`, and `segments` (`[word_position, start_ms, end_ms]`).

## Validation still required

- Run the phone-sized Playwright Quran UI suite with Chromium available.
- Verify all 114 live timing JSON files and audio URLs on a real network.
- Listen-check representative surahs, including Al-Fatihah, a long surah, a short surah, and a recording with repeated words.
- Verify Android background playback, audio focus, seeking, and app navigation on the target device.
