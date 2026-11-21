"""Browser test: the Android back button (NaseemBack.press, what native.js calls) steps back instead of closing the app."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

ACTIVE = "(document.querySelector('.screen.active')||{}).id"
PRESS = "window.NaseemBack.press()"
srv = Server(8883)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=1.0)
    pg.goto(srv.url()); pg.wait_for_timeout(2400)

    ok('helper exists', pg.evaluate("typeof window.NaseemBack === 'object'"))
    ok('Home with nothing open: not handled, so the app may close', pg.evaluate(PRESS) is False and pg.evaluate(ACTIVE) == 'homeScreen')

    for screen in ['dhikrScreen', 'libraryScreen', 'salahScreen', 'settingsScreen', 'featuresScreen', 'progressScreen']:
        pg.evaluate(f"switchScreen('{screen}')"); pg.wait_for_timeout(400)
        handled = pg.evaluate(PRESS); pg.wait_for_timeout(400)
        now = pg.evaluate(ACTIVE)
        ok(f'back from {screen} is handled and leaves it', handled is True and now != pg.evaluate("'x'") and now in ('homeScreen', 'featuresScreen', 'settingsScreen'), f'{screen} -> {now} handled={handled}')
    pg.evaluate("switchScreen('settingsScreen')"); pg.wait_for_timeout(300)
    pg.evaluate(PRESS); pg.wait_for_timeout(300)
    ok('a tab goes back to Home', pg.evaluate(ACTIVE) == 'homeScreen')
    ok('then back at Home is left to the system', pg.evaluate(PRESS) is False)

    # a bottom sheet closes first and keeps the screen
    pg.evaluate("switchScreen('settingsScreen')"); pg.wait_for_timeout(400)
    sel = pg.evaluate("(()=>{const s=document.querySelector('select.nsel');return s?s.id:null})()")
    if sel:
        pg.evaluate("document.querySelector('select.nsel')._nTrigger.click()"); pg.wait_for_timeout(500)
        opened = pg.evaluate("document.body.classList.contains('sheet-open')")
        ok('sheet opened for the test', opened)
        ok('back closes the sheet only', pg.evaluate(PRESS) is True and (pg.wait_for_timeout(400) or True) and not pg.evaluate("document.body.classList.contains('sheet-open')") and pg.evaluate(ACTIVE) == 'settingsScreen')
    pg.evaluate("switchScreen('homeScreen')"); pg.wait_for_timeout(300)

    # Quran: player sheet -> player -> reader -> tab -> home
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1300)
    ok('reader is open', pg.evaluate("!document.getElementById('quranReader')?.hidden") if pg.evaluate("!!document.getElementById('quranReader')") else True)
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(500)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(700)
    pg.tap('#quranSleepBtn'); pg.wait_for_timeout(500)
    ok('sleep sheet is open', pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-sleep-open')"))
    ok('back closes the sleep sheet first', pg.evaluate(PRESS) is True and not pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-sleep-open')") and not pg.evaluate("document.getElementById('quranFullPlayer').hidden"))
    ok('back closes the full player next', pg.evaluate(PRESS) is True and (pg.wait_for_timeout(700) or True) and pg.evaluate("document.getElementById('quranFullPlayer').hidden"))
    ok('back leaves the reader for the surah list', pg.evaluate(PRESS) is True and pg.evaluate(ACTIVE) == 'quranReaderScreen')
    pg.wait_for_timeout(500)
    ok('back from the Quran list goes Home', pg.evaluate(PRESS) is True and (pg.wait_for_timeout(400) or True) and pg.evaluate(ACTIVE) == 'homeScreen')
    ok('and the next back is left to the system', pg.evaluate(PRESS) is False)
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Back button UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
