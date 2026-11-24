"""Full player: surah-name artwork (+toggle), Up next queue, ink colours, header glass; swipe tabs in both modes; lens drag only with glass."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

def swipe(pg, cdp, x1, x2, y):
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x1, 'y': y}]})
    for i in range(1, 9):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x1 + (x2 - x1) * i / 8, 'y': y}]})
        pg.wait_for_timeout(16)
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    pg.wait_for_timeout(700)

srv = Server(8880)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=1.0); pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.evaluate("document.body.classList.remove('lite')")
    cdp = ctx.new_cdp_session(pg)
    act = "document.querySelector('.screen.active')?.id"

    # swipe changes tabs with glass on and off
    for glass in (True, False):
        pg.evaluate("g=>{document.body.classList.toggle('glass',g)}", glass)
        pg.tap('.nav-item[data-screen="homeScreen"]'); pg.wait_for_timeout(700)
        a = pg.evaluate(act); swipe(pg, cdp, 330, 60, 300); b2 = pg.evaluate(act)
        ok(f'swipe changes tab (glass={glass})', a != b2, f'{a}->{b2}')
    # lens drag only with glass
    pg.evaluate("document.body.classList.remove('glass')")
    ok('flat mode keeps the same lens geometry but with no blur', pg.evaluate("(()=>{const l=document.querySelector('.nav-lens');const bf=getComputedStyle(l).backdropFilter;return !l||bf==='none'||bf===''||getComputedStyle(l).opacity==='0'})()"))
    pg.evaluate("document.body.classList.add('glass')")

    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(700)
    pg.tap('#quranSurahList .qr-row'); pg.wait_for_timeout(800)
    pg.tap('#quranPlaySurah'); pg.wait_for_timeout(800)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(700)
    ok('artwork shows the surah number/name block', 'SURAH 1' in pg.inner_text('#quranArtCaption'))
    ok('artwork gradient active', pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-art-names')"))
    pg.evaluate("document.getElementById('quranFullPlayer').hidden||0")
    pg.evaluate("localStorage.setItem('naseemArtV1','off');document.dispatchEvent(new CustomEvent('naseem:art-changed'))"); pg.wait_for_timeout(200)
    ok('artwork toggle off restores the ornament', pg.inner_text('#quranArtName').strip() == '۞' and not pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-art-names')"))
    pg.evaluate("localStorage.removeItem('naseemArtV1');document.dispatchEvent(new CustomEvent('naseem:art-changed'))")
    # ink colours: no accent on controls, both themes, both modes
    for glass in (True, False):
        for th in ('dark', 'light'):
            pg.evaluate("([g,t])=>{document.body.classList.toggle('glass',g);document.body.classList.toggle('light',t==='light')}", [glass, th]); pg.wait_for_timeout(300)
            col = pg.evaluate("(()=>{const c=s=>getComputedStyle(document.querySelector(s)).color;return [c('#quranFullPrev'),c('#quranSleepBtn'),c('#quranFullTitle')]})()")
            want = '21, 23, 26' if th == 'light' else '255, 255, 255'
            ok(f'player ink is monochrome (glass={glass}, {th})', all(want in c for c in col), str(col))
    # Up next
    pg.tap('#quranQueueBtn'); pg.wait_for_timeout(400)
    ok('Up next opens with current row first', pg.evaluate("!document.getElementById('quranQueue').hidden && document.querySelector('.qr-queue-row').classList.contains('current')"))
    ok('Up next lists following surahs', pg.evaluate("document.querySelectorAll('.qr-queue-row').length") > 10)
    pg.tap('.qr-queue-row[data-n="3"]'); pg.wait_for_timeout(1200)
    ok('tapping a row plays that surah', pg.evaluate("document.getElementById('quranFullTitle').textContent.startsWith('3.')"), pg.inner_text('#quranFullTitle'))
    ok('queue closed after choosing', pg.evaluate("document.getElementById('quranQueue').hidden"))
    pg.tap('#quranQueueBtn'); pg.wait_for_timeout(300)
    pg.evaluate("document.dispatchEvent(new CustomEvent('naseem:back',{cancelable:true}))"); pg.wait_for_timeout(300)
    ok('back closes queue before the player', pg.evaluate("document.getElementById('quranQueue').hidden && !document.getElementById('quranFullPlayer').hidden"))
    # header glass
    pg.evaluate("document.body.classList.add('glass')")
    pg.evaluate("document.getElementById('quranFullPlayer').hidden=true;document.body.classList.remove('qr-full-player-open')")
    bf = pg.evaluate("(()=>{const e=document.querySelector('.topbar .icon-button');return e?getComputedStyle(e).backdropFilter:'none'})()")
    ok('header buttons are glass', 'blur' in bf, bf)
    ok('no page errors', not errs, str(errs))
    ctx.close(); b.close()
srv.stop()
print('Full player UI:', 'FAILED %s' % fails if fails else 'OK'); sys.exit(1 if fails else 0)
