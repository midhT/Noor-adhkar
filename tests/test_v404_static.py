from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'www/index.html').read_text()
js = (ROOT / 'www/v404.js').read_text()
app = (ROOT / 'www/app.js').read_text()
settings = (ROOT / 'www/settings.js').read_text()
intro = (ROOT / 'www/intro.js').read_text()
pkg = json.loads((ROOT / 'package.json').read_text())
ids = re.findall(r'id="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate HTML ids'
assert pkg['version'] == '4.0.8'
assert 'data-open-v404="hijri"' in html and "glance:'glanceScreen'" in js
assert 'widgetStudioScreen' in js and 'glanceScreen' in js and 'traditionScreen' in js
assert 'naseem-onboarding-complete-v1' in js and 'naseem:open-onboarding' not in js
assert 'notifications.request()' in js
assert 'data-theme="system"' in html and 'prefers-color-scheme' in app and 'prefers-color-scheme' in intro
assert 'BUILTIN_GLANCE' in js and 'glanceRefresh' in js and 'data-quiz-answer' in js
assert 'HIJRI_MONTHS' in js and 'Dhul-Hijjah' in js
assert 'SCHOOL_GUIDANCE' in js and 'sistani.org/english/book/48' in js
assert 'before_sleep' in (ROOT / 'www/adhkar-data.js').read_text()
assert 'setHijriDate' in (ROOT / 'www/native.js').read_text()
assert 'HijriWidgetProvider' in (ROOT / 'scripts/patch-android.mjs').read_text()
assert 'noor-adhkar-cache-v4081' in (ROOT / 'www/sw.js').read_text()
assert 'naseem-onboarding-complete-v1' in settings
print('V4.0.8 scoped feature static checks: all passed')

assert 'refreshHijriReference' in js
assert 'checkOnline' in (ROOT / 'www/salah-settings.js').read_text()
assert 'studioWidgetSave' in js
assert 'customRoutineGrid' in (ROOT / 'www/app.js').read_text()
