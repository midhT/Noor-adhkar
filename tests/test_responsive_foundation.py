from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'www/index.html').read_text()
css = (ROOT / 'www/responsive.css').read_text()
js = (ROOT / 'www/v404.js').read_text()
assert 'responsive.css' in html
assert html.index('responsive.css') > html.index('quran-reader.css'), 'responsive overrides must load last'
for token in ['100dvh', 'overflow-y: auto', '-webkit-overflow-scrolling: touch', 'safe-area-inset-top', 'safe-area-inset-bottom']:
    assert token in css, f'missing responsive viewport support: {token}'
for token in ['@media (max-width: 390px)', '@media (max-height: 700px)', '@media (min-width: 600px)', '@media (orientation: landscape)']:
    assert token in css, f'missing responsive breakpoint: {token}'
assert '.v404-onboarding' in css and 'overflow-y: auto' in css
assert '.v404-onboard-actions' in css and 'grid-template-columns: minmax(0, 1fr)' in css
assert '.setup-choice' in css and 'min-height: 58px' in css
assert 'data-page=\"6\"' in js and '/ 07' in js, 'seven-step setup including notification opt-in must be present'
assert 'setupEnableNotifications' in js and 'n.request()' in js, 'notification permission must require explicit user action'
assert 'const finish=(skipped=false)=>{' in js, 'onboarding finish must be synchronous'
finish_start = js.index('const finish=(skipped=false)=>{')
finish_end = js.index('data.setupComplete=true;', finish_start)
finish = js[finish_start:finish_end]
assert 'n.request()' not in finish and 'setupEnableNotifications' not in finish, 'onboarding completion must not block on notification permission'
assert 'id=\"setupTradition\"' not in js and 'id=\"setupTheme\"' not in js, 'duplicate hidden selectors must not shadow visible selection cards'
print('Responsive foundation static checks: all passed')
