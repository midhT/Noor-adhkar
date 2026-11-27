import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
R = Results(); srv = Server(8844)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); ctx = b.new_context(viewport={'width': 380, 'height': 800}, is_mobile=True)
    seed_returning_user(ctx); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2200)
    lab = pg.evaluate("[...document.querySelectorAll('.pd-banner span')].map(e=>e.textContent)")
    R.ok('Quick View shows Suhoor and Iftar', lab[:2] == ['Suhoor', 'Iftar'], str(lab))
    fajr = pg.evaluate("document.querySelector('#pdTimetable .pd-prayer strong').textContent"); s0 = pg.inner_text('#pdSunrise')
    R.ok('suhoor equals Fajr with no margin', fajr == s0, fajr + ' vs ' + s0)
    pg.evaluate("localStorage.setItem('naseem-suhoor-margin','10');localStorage.setItem('naseem-iftar-margin','5');window.dispatchEvent(new Event('noor:schedule'))"); pg.wait_for_timeout(300)
    s1 = pg.inner_text('#pdSunrise'); i1 = pg.inner_text('#pdDhuhr')
    R.ok('margins move the times', s1 != s0 and '10 min before Fajr' in pg.inner_text('#pdSuhoorNote') and '5 min after Maghrib' in pg.inner_text('#pdIftarNote'), s1 + ' ' + i1)
    pg.reload(); pg.wait_for_timeout(2000); open_settings(pg); pg.evaluate("document.getElementById('stAppearance').open=true"); pg.wait_for_timeout(400)
    R.ok('Appearance has both selectors with saved values', pg.evaluate("document.getElementById('stSuhoorMargin').value==='10' && document.getElementById('stIftarMargin').value==='5'"))
    R.ok('no page errors', not errs, str(errs)); b.close()
srv.stop(); sys.exit(R.done('quickview margins'))
