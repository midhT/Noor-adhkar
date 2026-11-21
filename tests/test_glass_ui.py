"""Browser test: Liquid Glass toggle (Settings > Appearance) turns the glass look on/off and remembers the choice."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

BF = "getComputedStyle(document.querySelector('.bottom-nav'),'::before').backdropFilter"
srv = Server(8874)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.evaluate("document.body.classList.remove('lite')")
    ok('glass is on by default', pg.evaluate("document.body.classList.contains('glass')"))
    ok('nav glass layer is blurred when glass is on', 'blur' in pg.evaluate(BF), pg.evaluate(BF))
    BG = "getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor"
    on_bg = pg.evaluate(BG)
    ok('toggle exists in settings', pg.evaluate("!!document.getElementById('stGlassToggle')"))
    pg.evaluate("document.getElementById('stGlassToggle').click()"); pg.wait_for_timeout(300)
    ok('turning off removes glass class', not pg.evaluate("document.body.classList.contains('glass')"))
    ok('toggle shows OFF', pg.evaluate("document.getElementById('stGlassToggle').textContent.trim()") == 'OFF'
       and pg.evaluate("document.getElementById('stGlassToggle').getAttribute('aria-pressed')") == 'false')
    ok('nav returns to its previous background when off', pg.evaluate(BG) != on_bg, on_bg + ' vs ' + pg.evaluate(BG))
    ok('glass off: lens takes no space and the 5 tabs share the bar', pg.evaluate("getComputedStyle(document.querySelector('.nav-lens')).display")=='none' and pg.evaluate("[...document.querySelectorAll('.bottom-nav .nav-item')].every(e=>e.getBoundingClientRect().width>40)"))
    ok('choice stored', pg.evaluate("localStorage.getItem('naseemGlassV1')") == 'off')
    pg.reload(); pg.wait_for_timeout(2400)
    ok('off persists after reload', not pg.evaluate("document.body.classList.contains('glass')"))
    pg.evaluate("document.getElementById('stGlassToggle').click()"); pg.wait_for_timeout(300)
    ok('turning on restores glass', pg.evaluate("document.body.classList.contains('glass')"))
    pg.evaluate("document.body.classList.remove('lite')"); pg.wait_for_timeout(200)  # the reload above re-applied Smooth mode, which turns tilt off by design
    # ---- light has a direction and follows the phone's tilt a little ----
    ok('floating glass has a specular rim', pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav'),'::after').content") not in ('none', 'normal'))
    a0 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rim-angle').trim()")
    pg.evaluate("window.dispatchEvent(Object.assign(new Event('deviceorientation'),{gamma:30,beta:75}))"); pg.wait_for_timeout(400)
    a1 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rim-angle').trim()")
    ok('rim light moves when the phone is tilted', a1 and a1 != a0, f'{a0} -> {a1}')
    pg.evaluate("document.getElementById('stGlassToggle').click()"); pg.wait_for_timeout(300)
    pg.evaluate("window.dispatchEvent(Object.assign(new Event('deviceorientation'),{gamma:-30,beta:10}))"); pg.wait_for_timeout(400)
    ok('with glass off the light does not move', pg.evaluate("document.documentElement.style.getPropertyValue('--rim-angle')") == '')
    pg.evaluate("document.getElementById('stGlassToggle').click()"); pg.wait_for_timeout(300)
    ok('no horizontal overflow', pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Glass UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
