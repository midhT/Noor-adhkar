"""Layout guard: on every main screen, at three phone widths, no two interactive controls overlap, nothing hides behind the
bottom navigation when scrolled to the end, and the bar itself is opaque (content must not show through it)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

JS_HELPERS = """
const clipped=e=>{const r=e.getBoundingClientRect();for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a);if(c.overflow!=='visible'||c.overflowX!=='visible'||c.overflowY!=='visible'){const q=a.getBoundingClientRect();if(q.height<2||r.bottom<=q.top+1||r.top>=q.bottom-1||r.right<=q.left+1||r.left>=q.right-1)return true}}return false};
const vis=e=>{if(clipped(e))return false;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>6&&r.height>6&&c.visibility!=='hidden'&&c.display!=='none'&&parseFloat(c.opacity)>0.05&&!e.closest('[hidden]')};
const ctl=id=>[...document.getElementById(id).querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=switch]')].filter(vis);
const label=e=>(e.id?'#'+e.id:'')+'.'+String(e.className).split(' ')[0]+':'+(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,22);
"""
OVERLAPS = "(id)=>{" + JS_HELPERS + """
const rs=ctl(id).map(e=>({e,r:e.getBoundingClientRect()})),out=[];
for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];if(a.e.contains(b.e)||b.e.contains(a.e))continue;
 const w=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),h=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(w>3&&h>3)out.push(label(a.e)+' x '+label(b.e))}
return out}"""
CLEARANCE = "(id)=>{" + JS_HELPERS + """
const nav=document.querySelector('.bottom-nav').getBoundingClientRect().top,els=ctl(id);
return Math.round(nav-Math.max(...els.map(e=>e.getBoundingClientRect().bottom)))}"""

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

SCREENS = ['homeScreen', 'dhikrScreen', 'salahScreen', 'quranReaderScreen', 'featuresScreen', 'zakatScreen', 'settingsScreen']
srv = Server(8841)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for theme in ('dark', 'light'):
        for w in (320, 360, 412):
            ctx = b.new_context(viewport={'width': w, 'height': 780}, is_mobile=True, has_touch=True); seed_returning_user(ctx)
            ctx.add_init_script(f"localStorage.setItem('naseem-theme','{theme}')")
            pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            quran_mock.install(pg); pg.goto(srv.url()); pg.wait_for_timeout(2300)
            bg = pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor")
            ok(f'{theme} {w}px: navigation bar is opaque', 'rgba' not in bg or bg.endswith(', 1)'), bg)
            for sid in SCREENS:
                pg.evaluate(f"switchScreen('{sid}')"); pg.wait_for_timeout(600)
                H = pg.evaluate("document.documentElement.scrollHeight"); seen = set(); y = 0
                while True:
                    pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(100)
                    seen.update(pg.evaluate(OVERLAPS, sid))
                    if y >= H: break
                    y += 450
                ok(f'{theme} {w}px {sid}: no overlapping controls', not seen, str(sorted(seen)[:4]))
                pg.evaluate("window.scrollTo(0,document.documentElement.scrollHeight)"); pg.wait_for_timeout(300)
                gap = pg.evaluate(CLEARANCE, sid)
                ok(f'{theme} {w}px {sid}: last control clears the navigation bar', gap >= 4, f'gap {gap}')
                ok(f'{theme} {w}px {sid}: no horizontal overflow', pg.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"))
            ok(f'{theme} {w}px: no page errors', errs == [], str(errs))
            ctx.close()
    b.close()
srv.stop()
print('Layout overlap guard:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
