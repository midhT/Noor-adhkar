from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'www/index.html').read_text()
js = (ROOT / 'www/v404.js').read_text()
settings = (ROOT / 'www/settings.js').read_text()
release_workflow = (ROOT / '.github/workflows/release.yml').read_text()
pkg = json.loads((ROOT / 'package.json').read_text())
ids = re.findall(r'id="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate HTML ids'
assert pkg['version'] == '4.0.7'
assert 'content="4.0.7"' in html
assert "VERSION = '4.0.7'" in settings
assert "CURRENT = document.querySelector('meta[name=\"naseem-version\"]')?.content || '4.0.7'" in (ROOT / 'www/public-updates.js').read_text()
assert 'cloud sync' not in settings.lower()
assert 'NASEEM_KEYSTORE_BASE64' in release_workflow
assert 'assembleRelease' in release_workflow
assert '*.keystore' in (ROOT / '.gitignore').read_text()
assert not (ROOT / 'signing/naseem.keystore').exists()
print('V4.0.7 static release checks: all passed')
