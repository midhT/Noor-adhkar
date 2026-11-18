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
assert pkg['version'] == '4.1.0'
assert 'data-open-v404="hijri"' in html and "glance:'glanceScreen'" in js
assert 'widgetStudioScreen' in js and 'glanceScreen' in js and 'traditionScreen' not in js
assert 'naseem-onboarding-complete-v1' in js and 'naseem:open-onboarding' not in js
setup_start = js.index('const finish=(skipped=false)=>{')
setup_finish = js[setup_start:js.index('data.setupComplete=true;', setup_start)]
assert 'n.request()' not in setup_finish, 'first-run completion must not block on notification permission'
assert 'You can skip this and enable notifications later.' in js
assert 'data-theme="system"' in html and 'prefers-color-scheme' in app and 'prefers-color-scheme' in intro
assert 'BUILTIN_GLANCE' in js and 'glanceRefresh' in js and 'data-quiz-answer' in js
assert 'HIJRI_MONTHS' in js and 'Dhul-Hijjah' in js
assert 'data-asr-choice' in js and 'Earlier Asr time' in js and 'Later Asr time' in js
assert 'before_sleep' in (ROOT / 'www/adhkar-data.js').read_text()
assert 'setHijriDate' in (ROOT / 'www/native.js').read_text()
assert 'HijriWidgetProvider' in (ROOT / 'scripts/patch-android.mjs').read_text()
assert 'noor-adhkar-cache-v4115' in (ROOT / 'www/sw.js').read_text()
assert 'salah-experience.js' in (ROOT / 'www/sw.js').read_text()
assert 'naseem-version-code' in html and '40115' in html
assert 'methodAuto' in (ROOT / 'www/salah.js').read_text()
assert 'Later Asr time' in (ROOT / 'www/salah-settings.js').read_text() and 'Earlier Asr time' in (ROOT / 'www/salah-settings.js').read_text()
assert 'naseem-onboarding-complete-v1' in settings
assert 'accentPalette' in html and 'accentCustom' in html
assert 'Credits &amp; Acknowledgements' in html
assert 'Omar Hisham Al Arabi' in html
assert 'Marmaduke Pickthall' in html
assert 'AlQuran Cloud' in html and 'HadeethEnc.com' in html
quran = (ROOT / 'www/quran-reader.js').read_text()
hadith = (ROOT / 'www/hadith-library.js').read_text()
for credit in ['Omar Hisham Al Arabi', 'Marmaduke Pickthall', 'GlobalQuran.com']:
    assert credit not in quran and credit not in hadith, f'{credit} must appear only in About credits'
assert 'data-accent="emerald"' in html and 'data-accent="silver"' in html
assert 'data-accent="purple"' in html and 'data-accent="gold"' in html
assert 'data-accent="forest"' in html and 'data-accent="blue"' in html
assert 'quran-playing' in (ROOT / 'www/features-v404.css').read_text()
assert 'setupEnableNotifications' in js and 'n.request()' in js
assert 'traditionSelect' not in js and 'themeSelect' not in js
assert 'data-tradition-choice' not in js and 'data-theme-choice' not in js
assert 'data-page=\"6\"' in js and 'setupProgress' in js and 'setupCitySearch' in js
assert 'Visualise Salah times.' in js and 'setupGps' in js and 'setupManual' in js
print('V4.1.0 scoped feature static checks: all passed')

assert 'refreshHijriReference' in js
assert 'checkOnline' in (ROOT / 'www/salah-settings.js').read_text()
assert 'studioWidgetSave' in js
assert 'customRoutineGrid' in (ROOT / 'www/app.js').read_text()
