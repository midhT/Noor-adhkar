# Naseem 4.1.0 (versionCode 40102): Quran reader, recitation follow-along, memorisation, Glance, layout

Public version label stays **4.1.0**; package ID `com.noor.adhkar` and the signing configuration are unchanged.

## Quran
- New index: continue-reading card, underline tabs (Surah / Juz / Page / Bookmarks / Memory), hairline surah rows with play badge.
  The surah list is cached after first load, so the index opens instantly and offline.
- Reader: fixed header, Arabic with ayah markers, optional English meaning, Bismillah shown as its own line
  (display only; the text is unchanged and Al-Fatihah / At-Tawbah are never split).
- Recitation: the ayah being recited is highlighted with a progress line and kept centred between the header and the player.
  Manual scrolling pauses auto-follow for a few seconds; the locate button or the "Keep recitation centred" switch controls it.
  Recitation continues into the next surah. Previous / next ayah, pause, seek, stop.
  Highlighting is per ayah. Word-by-word highlighting needs per-word timing data that this audio source does not provide.
- Memory: add ayahs (or a whole surah) from the reader; hide-text mode blurs the Arabic until tapped; review sessions
  (recite, hear, first-word hint, reveal, Not yet / Remembered) on a 1/3/7/14/30/60-day schedule, stored on the device.
- Offline save now stores Arabic and English meaning for all 114 surahs.

## Glance
- The feed request had no time limit, so on a slow connection the Home card stayed empty and Refresh did nothing.
  Now: content shows immediately (saved or built-in), the request times out after 8 s, Refresh shows progress, cannot stack,
  and moves to the next item.

## Layout
- Bottom navigation is fully opaque with a soft fade underneath; scrolled content no longer shows through it.
- A permanent layout test checks every main screen at 320/360/412 px, dark and light, for overlapping controls,
  bottom-nav clearance and horizontal overflow.
- The floating phone icon seen in a Salah screenshot is not drawn by the app (no such element in the web or Android code);
  it is an Android / device overlay (for example the rotation suggestion button).

## Tests
New: `test_quran_memory.js`, `test_quran_ui.py`, `test_glance.py`, `test_layout_overlap.py` (+ `quran_mock.py` test fixtures).
`test_compass_nav.py` now expects the real seven-tab order. Run `bash tests/run.sh`.
