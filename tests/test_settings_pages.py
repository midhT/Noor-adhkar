"""Settings groups open as full-screen sub-pages; brand button opens Settings; header sticks."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
fails = []
def ok(n, c, d=''):
    print(('PASS ' if c else 'FAIL ') + n, d if not c else '')
    if not c: fails.append(n)
srv = Server(8871)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 360, 'height': 760}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    ok('4 tabs only', pg.locator('.bottom-nav .nav-item').count() == 4)
    pg.tap('#brandMark'); pg.wait_for_timeout(900)
    ok('brand button opens the Settings list (no page auto-opened)', pg.evaluate("document.getElementById('settingsScreen').classList.contains('active') && !document.querySelector('.st-group[open]')"))
    pg.tap('#stAccount > summary'); pg.wait_for_timeout(700)
    r = pg.evaluate("(()=>{const r=document.getElementById('stAccount').getBoundingClientRect();return [r.x,r.y,r.width,r.height,innerWidth,innerHeight]})()")
    ok('account page is full screen', r[0] == 0 and r[1] == 0 and r[2] == r[4] and r[3] == r[5], r)
    pg.evaluate("document.dispatchEvent(new CustomEvent('naseem:back',{cancelable:true,bubbles:true}))"); pg.wait_for_timeout(700)
    ok('back closes the page, stays in settings', pg.evaluate("!document.getElementById('stAccount').open && document.getElementById('settingsScreen').classList.contains('active')"))
    pg.tap('#stAppearance > summary'); pg.wait_for_timeout(700)
    ok('appearance opens', pg.evaluate("document.getElementById('stAppearance').open"))
    ok('controls reachable', pg.locator('#stGlassToggle').is_visible())
    pg.tap('#stAppearance > summary'); pg.wait_for_timeout(700)
    pg.evaluate("document.body.classList.add('light')"); pg.wait_for_timeout(300)
    acc = pg.evaluate("[getComputedStyle(document.getElementById('stGlassToggle')).backgroundColor, getComputedStyle(document.body).getPropertyValue('--accent').trim()]")
    ok('ON toggle keeps the accent colour in light mode', acc[0].startswith('rgb(32, 168, 117)') or acc[1] == '', acc)
    ok('arrow does not animate (settings rows are pages, not dropdowns)', pg.evaluate("getComputedStyle(document.querySelector('.st-chev')).transitionDuration") == '0s')
    pg.evaluate("document.body.classList.remove('light')")
    ok('summary tap closes', pg.evaluate("!document.getElementById('stAppearance').open"))
    ok('no page errors', not errs, errs)
srv.stop() if hasattr(srv, 'stop') else None
print('FAILED' if fails else 'OK'); sys.exit(1 if fails else 0)
