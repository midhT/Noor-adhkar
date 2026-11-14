# V4.0.3: live compass readout / aligned state, and iOS-style press-and-drag on the bottom nav.
import os, sys, re, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
R = Results(); srv = Server(8798); ok = R.ok
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True, timezone_id='Asia/Kolkata')
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2600); ev = pg.evaluate; cdp = ctx.new_cdp_session(pg)
    # ================= compass =================
    pg.evaluate("switchScreen('qiblaScreen')"); pg.wait_for_timeout(400)
    bearing = ev("NaseemQibla.bearing(34.0837,74.7973)")
    ok('before any reading the dial shows the fixed Qibla bearing', pg.inner_text('#qiblaBearing') == f'{round(bearing)}°')
    def fire(h, n=14):
        # a real sensor emits many readings per second; the smoothing converges over a handful of them
        ev(f"(()=>{{for(let i=0;i<{n};i++){{const e=new Event('deviceorientationabsolute');e.alpha={(360 - h) % 360};e.absolute=true;window.dispatchEvent(e)}}}})()"); pg.wait_for_timeout(40)
    fire(10); a = pg.inner_text('#qiblaBearing'); fire(100); c = pg.inner_text('#qiblaBearing'); fire(200); d = pg.inner_text('#qiblaBearing')
    ok('big angle is the live heading and changes as the phone turns', (a, c, d) == ('10°', '100°', '200°'), str((a, c, d)))
    ok('subtitle shows heading cardinal plus Qibla bearing', 'Facing' in pg.inner_text('#qiblaCardinal') and f'{round(bearing)}°' in pg.inner_text('#qiblaCardinal'), pg.inner_text('#qiblaCardinal'))
    # direction + size of the turn
    fire(bearing - 30)
    t = pg.inner_text('#qiblaAlignment'); ok('30° left of Qibla: "Turn right 30°"', 'Turn right 30°' in t, t)
    ok('not aligned when off by 30°', not ev("document.getElementById('qiblaCompass').classList.contains('is-aligned')"))
    fire(bearing + 30); t = pg.inner_text('#qiblaAlignment'); ok('30° right of Qibla: "Turn left 30°"', 'Turn left 30°' in t, t)
    # aligned state + haptic once
    ev("state.vibrate=true; window.__v=0; navigator.vibrate=(x)=>{if(x===12)window.__v++;return true}")
    fire(bearing + 2)
    ok('aligned within a few degrees', ev("document.getElementById('qiblaCompass').classList.contains('is-aligned')"))
    ok('says "You are facing the Qibla."', 'You are facing the Qibla.' in pg.inner_text('#qiblaAlignment'))
    ok('state chip says Facing Qibla', 'Facing Qibla' in pg.inner_text('#qiblaCompassState'), pg.inner_text('#qiblaCompassState'))
    ok('big angle highlighted when aligned', ev("document.getElementById('qiblaBearing').classList.contains('aligned')"))
    fire(bearing + 1); fire(bearing + 3)
    ok('haptic (the app\'s own call) fires once on arrival, not on every reading', ev("window.__v") == 1, str(ev("window.__v")))
    fire(bearing + 6)
    ok('hysteresis: 6° off keeps aligned (no flicker)', ev("document.getElementById('qiblaCompass').classList.contains('is-aligned')"))
    fire(bearing + 12)
    ok('leaves aligned past the exit angle', not ev("document.getElementById('qiblaCompass').classList.contains('is-aligned')"))
    fire(bearing + 6)
    ok('hysteresis: re-entering needs the tighter angle', not ev("document.getElementById('qiblaCompass').classList.contains('is-aligned')"))
    # no long-way spin across north
    rot = lambda: float(re.search(r'rotate\((-?[\d.]+)deg', ev("document.getElementById('qiblaRose').style.transform")).group(1))
    fire(355); r1 = rot(); fire(358, 1); fire(2, 1); r2 = rot()
    ok('crossing 359°→0° turns the short way (no 360° spin)', abs(r2 - r1) < 30, f'{r1} -> {r2}')
    ok('Kaaba mark sits at the Qibla bearing on the dial', abs(float(re.search(r'rotate\((-?[\d.]+)deg', ev("document.getElementById('qiblaMark').style.transform")).group(1)) - bearing) < 0.01)
    ok('fixed notch present', ev("!!document.querySelector('#qiblaCompass .qibla-notch')"))
    # Home mini compass shows live heading, not the fixed bearing
    pg.evaluate("switchScreen('homeScreen')"); pg.wait_for_timeout(300); fire(77)
    ok('Home compass number is the live heading', pg.inner_text('#homeQiblaMiniBearing') == '77°', pg.inner_text('#homeQiblaMiniBearing'))
    fire(bearing); ok('Home compass says Facing the Qibla ✓ when aligned', 'Facing the Qibla' in pg.inner_text('#homeQiblaMiniDirection') and ev("document.querySelector('.home-qibla-dial').classList.contains('aligned')"))
    ok('Home mini compass keeps N fixed upright at the top', ev("document.querySelector('.home-qibla-dial > span').style.transform") == 'translateX(-50%)', ev("document.querySelector('.home-qibla-dial > span').style.transform"))
    fire(bearing + 30)
    _pa = float(ev("parseFloat(document.getElementById('homeQiblaArrow').style.getPropertyValue('--home-qibla-angle'))"))
    ok('Home mini pointer turns by Qibla bearing minus heading', abs(((_pa + 30 + 180) % 360) - 180) < 1, str(_pa))
    # ================= nav press-and-drag =================
    cur = lambda: ev("document.querySelector('.screen.active').id")
    rects = lambda: ev("[...document.querySelectorAll('.bottom-nav .nav-item')].map(e=>{const r=e.getBoundingClientRect();return [e.dataset.screen,r.left+r.width/2,r.top+r.height/2]})")
    peek = lambda: ev("(document.querySelector('.nav-item.peek')||{dataset:{}}).dataset.screen")
    ids = [c[0] for c in rects()]; ok('seven tabs in the bar, in order', ids == ['homeScreen', 'dhikrScreen', 'salahScreen', 'quranReaderScreen', 'featuresScreen', 'zakatScreen', 'settingsScreen'], str(ids))
    def touch(t, x, y): cdp.send('Input.dispatchTouchEvent', {'type': t, 'touchPoints': [{'x': x, 'y': y}] if t != 'touchEnd' else []})
    def drag(from_id, to_id, mid_id=None, check=None):
        r = {c[0]: c for c in rects()}; x0, y = r[from_id][1], r[from_id][2]
        touch('touchStart', x0, y); step = 10 if r[to_id][1] > x0 else -10
        touch('touchMove', x0 + step, y); time.sleep(0.05)           # starts the drag; tabs become equal width
        r = {c[0]: c for c in rects()}                               # fresh positions in drag layout
        x1 = r[to_id][1]
        for i in range(1, 13): touch('touchMove', x0 + step + (x1 - x0 - step) * i / 12, y); time.sleep(0.012)
        if check: check()
        touch('touchEnd', 0, 0); time.sleep(0.6)
    seen = {}
    def mid():
        seen['cur'] = cur(); seen['peek'] = peek(); seen['cls'] = ev("document.querySelector('.bottom-nav').classList.contains('dragging')")
    drag('homeScreen', 'settingsScreen', check=mid)
    ok('while dragging the highlight follows the finger but the screen has not switched yet', seen == {'cur': 'homeScreen', 'peek': 'settingsScreen', 'cls': True}, str(seen))
    ok('lifting the finger on Settings opens Settings', cur() == 'settingsScreen', cur())
    ok('highlight is on Settings and drag styling cleaned up', ev("document.querySelector('.nav-item.active').dataset.screen") == 'settingsScreen' and ev("!document.querySelector('.nav-item.peek')") and ev("!document.querySelector('.bottom-nav.dragging')"))
    seen.clear()
    def mid2(): seen['peek'] = peek()
    drag('settingsScreen', 'dhikrScreen', check=mid2)
    ok('drag right-to-left: highlight on Dhikr, then opens Dhikr (no extra page swipe)', seen.get('peek') == 'dhikrScreen' and cur() == 'dhikrScreen', f'{seen} {cur()}')
    # sliding across tabs updates the highlight continuously
    r = {c[0]: c for c in rects()}; x0, y = r['dhikrScreen'][1], r['dhikrScreen'][2]
    touch('touchStart', x0, y); touch('touchMove', x0 + 12, y); time.sleep(0.05)
    r = {c[0]: c for c in rects()}; trail = []
    for sid in ['salahScreen', 'featuresScreen', 'zakatScreen', 'featuresScreen']:
        touch('touchMove', r[sid][1], y); time.sleep(0.05); trail.append(peek())
    touch('touchEnd', 0, 0); time.sleep(0.6)
    ok('highlight tracks the finger tab by tab, forwards and back', trail == ['salahScreen', 'featuresScreen', 'zakatScreen', 'featuresScreen'], str(trail))
    ok('release lands on the tab under the finger', cur() == 'featuresScreen', cur())
    ok('release off the end of the bar clamps to the last tab', (lambda: (touch('touchStart', *rects()[4][1:]), touch('touchMove', rects()[4][1] + 14, rects()[4][2]), time.sleep(0.05), touch('touchMove', 392, rects()[4][2]), touch('touchEnd', 0, 0), time.sleep(0.6), cur() == 'settingsScreen')[-1])())
    r = {c[0]: c for c in rects()}
    pg.touchscreen.tap(r['salahScreen'][1], r['salahScreen'][2]); pg.wait_for_timeout(500)
    ok('plain tap on a tab still works', cur() == 'salahScreen', cur())
    r = {c[0]: c for c in rects()}; x, y = r['salahScreen'][1], r['salahScreen'][2]
    touch('touchStart', x, y); touch('touchMove', x + 3, y); touch('touchEnd', 0, 0); time.sleep(0.5)
    ok('a 3px wiggle is a tap, not a drag (stays on Salah)', cur() == 'salahScreen' and ev("!document.querySelector('.bottom-nav.dragging')"), cur())
    # page swipe elsewhere unaffected
    ev("switchScreen('homeScreen')"); pg.wait_for_timeout(300)
    swipe_up = None
    touch('touchStart', 330, 300)
    for i in range(1, 9): touch('touchMove', 330 + (60 - 330) * i / 8, 302); time.sleep(0.012)
    touch('touchEnd', 0, 0); time.sleep(0.6); ok('page swipe still works above the bar', cur() == 'dhikrScreen', cur())
    ok('no page errors', not errs, str(errs))
    b.close()
srv.stop(); sys.exit(R.done('Compass + nav drag'))
