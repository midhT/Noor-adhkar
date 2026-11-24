#!/usr/bin/env python3
"""Regression checks for Naseem's five main destinations and Quran entry."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
app = (ROOT / "www" / "app.js").read_text(encoding="utf-8")
motion = (ROOT / "www" / "motion.js").read_text(encoding="utf-8")
quran = (ROOT / "www" / "quran-reader.js").read_text(encoding="utf-8")
expected = ["Home", "Dhikr", "Salah", "Quran"]
actual = re.findall(r'<button class="nav-item(?: active)?"[^>]*data-nav-label="([^"]+)"', html)
assert actual == expected, f"Primary navigation order mismatch: {actual!r}"
assert len(re.findall(r'<button class="nav-item(?: active)?"', html)) == 4
assert '"quranReaderScreen"' in app and "'quranReaderScreen'" in motion
assert "data-quran-view=\"surah\"" in quran and "data-quran-view=\"juz\"" in quran
assert "data-quran-view=\"page\"" in quran and "data-quran-view=\"bookmarks\"" in quran
assert "data-bookmark-ayah" in quran and "quranOpenPage" in quran
assert 'data-open-screen="featuresScreen"' in html and 'data-open-screen="zakatScreen"' in html
assert 'data-screen="settingsScreen"' not in html and 'id="brandMark"' in html
print("Four-tab navigation and Quran destination checks passed.")
