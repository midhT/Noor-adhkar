"""The glass lens and the hole in the blur layer move on one clock: during a real touch drag (CPU throttled) they never drift apart."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
srv = Server(8872); fails = []
def ok(n, c, d=''):
    print(('PASS ' if c else 'FAIL ') + n, d if not c else '')
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 360, 'height': 760}, is_mobile=True, has_touch=True); seed_returning_user(ctx)
    pg = ctx.new_page(); pg.goto(srv.url()); pg.wait_for_timeout(2600)
    pg.evaluate("document.body.classList.remove('lite')")
    ok('profile button is on the right, theme on the left', pg.evaluate("document.getElementById('brandMark').getBoundingClientRect().x > document.getElementById('themeBtn').getBoundingClientRect().x"))
    c = ctx.new_cdp_session(pg); c.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.evaluate("""window.__d=[];(function f(){const n=document.querySelector('.bottom-nav'),l=document.querySelector('.nav-lens').getBoundingClientRect(),nr=n.getBoundingClientRect(),lx=parseFloat(n.style.getPropertyValue('--lx')),sl=parseFloat(n.style.getPropertyValue('--slot'));window.__d.push((l.left+l.width/2)-nr.left-(lx+sl/2)-parseFloat(getComputedStyle(n).borderLeftWidth||0));requestAnimationFrame(f)})()""")
    c.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': 60, 'y': 700}]})
    for i in range(40):
        c.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': 60 + i * 6, 'y': 700}]}); pg.wait_for_timeout(16)
    c.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(900)
    d = pg.evaluate('__d')
    ok('lens and blur hole stay within 0.5px every frame while dragging and settling', max(abs(x) for x in d) < .5, max(abs(x) for x in d))
    ok('lens lands on the tab under the finger', pg.evaluate("document.querySelector('.nav-item.active').dataset.screen") == 'quranReaderScreen')
    ok('no CSS transition on the lens position (JS owns it)', 'translate' not in pg.evaluate("getComputedStyle(document.querySelector('.nav-lens')).transitionProperty"))
srv.stop()
print('FAILED' if fails else 'OK'); sys.exit(1 if fails else 0)
