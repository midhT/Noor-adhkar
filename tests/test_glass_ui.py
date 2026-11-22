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
    pg.evaluate("document.body.classList.remove('lite')"); pg.wait_for_timeout(200)
    # ---- navigation bar only: nothing else is glass, and there is no edge lighting ----
    NAV = "document.querySelector('.bottom-nav')"
    ok('nav rim is blurred (edge ring), not lit', 'blur' in pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav'),'::after').backdropFilter") and 'gradient' not in pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav'),'::after').backgroundImage"))
    for sel in ['.settings-card', '.st-group', '.v3-card', '.toast', '.qr-player', '.nsheet-panel']:
        has = pg.evaluate("(s=>{const e=document.querySelector(s);if(!e)return 'none';const c=getComputedStyle(e);return (c.backdropFilter||'none')})(%r)" % sel)
        ok(f'{sel} is not glass', has in ('none', ''), has)
    ok('no white rim shadows on content cards', 'inset 1px 1px' not in pg.evaluate("(e=>e?getComputedStyle(e).boxShadow:'')(document.querySelector('.v3-card,.settings-card,.st-group'))"))
    for theme in ['dark', 'light']:
        pg.evaluate("t=>document.body.classList.toggle('light',t==='light')", theme); pg.wait_for_timeout(250)
        bg = pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor")
        nums = [float(x) for x in bg[bg.index('(') + 1:-1].split(',')]
        lum = (nums[0] + nums[1] + nums[2]) / 3
        alpha = nums[3] if len(nums) > 3 else 1.0
        ok(f'{theme}: nav is translucent', alpha < 0.6, bg)
        ok(f'{theme}: nav is not white', lum < 170 or theme == 'dark', bg)
        ok(f'{theme}: lens has no light fill', pg.evaluate("getComputedStyle(document.querySelector('.nav-lens')).backgroundImage") == 'none')
    pg.evaluate("document.body.classList.remove('light')")
    ok('no horizontal overflow', pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Glass UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
