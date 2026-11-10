from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'www/index.html').read_text()
js = (ROOT / 'www/v404.js').read_text()
settings = (ROOT / 'www/settings.js').read_text()
workflow = (ROOT / '.github/workflows/build-apk.yml').read_text()
intro = (ROOT / 'www/intro.js').read_text()
pkg = json.loads((ROOT / 'package.json').read_text())
ids = re.findall(r'id="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate HTML ids'
for feature in ['hijriScreen','duaScreen','traditionScreen','occasionScreen','salahLearnScreen','widgetStudioScreen','glanceScreen']:
    assert f"addScreen('{feature}'" in js, f'Missing screen: {feature}'
for label in ['Hijri calendar','Dua library','Islamic occasions','Widget Studio','Glance']:
    assert label in js or label in html, f'Missing feature label: {label}'
assert "Qur’an 2:152" in js and 'glanceCache' in js and 'expires_at' in js
assert "'naseem-v404'" in settings and "VERSION = '4.0.4'" in settings
assert pkg['version'] == '4.0.4'
assert '@capacitor/app' in pkg['dependencies']
assert 'NASEEM_FRESH_INSTALL' in intro and 'NASEEM_FRESH_INSTALL' in js
assert 'scripts/patch-android.mjs' in workflow and 'scripts/patch-icons.mjs' in workflow
assert 'NASEEM_KEYSTORE_BASE64' in workflow
assert 'signing/*.keystore' in (ROOT / '.gitignore').read_text(), 'Signing keys should be excluded from future source exports'
print('V4.0.4 static feature checks: all passed')
