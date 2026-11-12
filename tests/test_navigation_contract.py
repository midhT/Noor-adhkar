#!/usr/bin/env python3
"""Regression checks for the primary navigation and Widget Studio DOM contract."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
js = (ROOT / "www" / "v404.js").read_text(encoding="utf-8")

expected = ["Home", "Dhikr", "Salah", "More", "Zakat", "Settings"]
actual = re.findall(r'<button class="nav-item(?: active)?"[^>]*data-nav-label="([^"]+)"', html)
assert actual == expected, f"Primary navigation order mismatch: {actual!r}"
assert len(re.findall(r'<button class="nav-item(?: active)?"', html)) == 6, "Expected exactly six primary navigation buttons"

required = [
    "studioWidgetLayout", "studioWidgetAction", "studioWidgetDua",
    "studioCustomPreviewBlocks", "studioCustomPreview", "studioCustomSave", "studioCustomStatus",
]
for element_id in required:
    assert f'id="{element_id}"' in js, f"Widget Studio markup is missing #{element_id}"

# The custom widget initializer must not blindly dereference optional DOM nodes.
assert "const customLayout=$('studioWidgetLayout')" in js
assert "if(customLayout)customLayout.value=customWidget.layout" in js
assert "if(customSave)customSave.addEventListener" in js
print("Navigation/Widget Studio contract: passed")
