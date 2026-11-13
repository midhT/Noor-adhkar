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
assert 'const finish=(skipped=false)=>{' in js, 'onboarding finish must be synchronous'
finish = js[js.index('const finish=(skipped=false)=>{'):js.index('let current=0;', js.index('const finish=(skipped=false)=>{'))]
assert 'notifications' not in finish, 'onboarding must not wait for notification permission'
print('Responsive foundation static checks: all passed')
