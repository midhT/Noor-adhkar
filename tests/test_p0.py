# V4.0.3 P0 regression tests: accent in light+dark, Zakat in main nav, Home Qibla follows the sensor.
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
R = Results(); srv = Server(8793); ok = R.ok
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True, timezone_id='Asia/Kolkata')
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2600); ev = pg.evaluate
    # ---- accents: every preset + custom, both themes. Compare the colour the UI actually uses (computed), not the variable we set.
    probe = "(()=>{const t=document.createElement('i');t.style.cssText='background:var(--accent);color:var(--gold)';document.body.appendChild(t);const cs=getComputedStyle(t);const r=[cs.backgroundColor,cs.color];t.remove();return r})()"
    def hex2rgb(h): return 'rgb(%d, %d, %d)' % tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
    presets = ev("NaseemAccent.presets")
    for theme in ('dark', 'light'):
        ev(f"document.body.classList.toggle('light', {'true' if theme=='light' else 'false'})")
        for name, col in list(presets.items()) + [('custom', '#e0457b')]:
            ev(f"NaseemAccent.set('{name}', '#e0457b')")
            bg, fg = ev(probe)
            ok(f'accent {name} applies in {theme}', bg == hex2rgb(col) and fg == hex2rgb(col), f'{bg} {fg} want {hex2rgb(col)}')
    ev("NaseemAccent.set('emerald')"); ev("document.body.classList.remove('light')")
    # persistence across reload (light theme saved in app state)
    ev("NaseemAccent.set('purple')"); ev("state.theme='light'; save()"); pg.reload(); pg.wait_for_timeout(2300)
    bg, _ = pg.evaluate(probe)
    ok('purple accent survives reload in light theme', bg == hex2rgb(presets['purple']), bg)
    ev("state.theme='dark'; save(); NaseemAccent.set('emerald')"); pg.reload(); pg.wait_for_timeout(2300)
    # ---- Zakat in main navigation
    ok('Zakat nav item exists', ev("!!document.querySelector('.bottom-nav .nav-item[data-screen=zakatScreen]')"))
    pg.click('.nav-item[data-screen="zakatScreen"]'); pg.wait_for_timeout(500)
    ok('Zakat tab opens calculator and is highlighted', ev("document.querySelector('.screen.active').id") == 'zakatScreen' and ev("document.querySelector('.nav-item.active').dataset.screen") == 'zakatScreen')
    ok('Zakat screen has no stale Explore back link', ev("!document.querySelector('#zakatScreen .back-link')"))
    pg.fill('#zCash', '1000000'); pg.fill('#zNisab', '50000'); pg.check('#zHaul'); pg.wait_for_timeout(200)
    ok('existing calculator still works (2.5% of 10,00,000)', '25,000' in pg.inner_text('#zResult'), pg.inner_text('#zResult'))
    pg.click('.nav-item[data-screen="featuresScreen"]'); pg.wait_for_timeout(400)
    pg.click('[data-open-feature="zakatScreen"]'); pg.wait_for_timeout(400)
    ok('Explore card still opens Zakat', ev("document.querySelector('.screen.active').id") == 'zakatScreen')
    # ---- Home Qibla: arrow follows device heading
    pg.click('.nav-item[data-screen="homeScreen"]'); pg.wait_for_timeout(500)
    bearing = ev("NaseemQibla.bearing(34.0837,74.7973)")
    def fire(alpha, absolute=True):
        ev("(a,abs)=>{const e=new Event('deviceorientationabsolute');e.alpha=a;e.absolute=abs;window.dispatchEvent(e)}" if False else f"(()=>{{const e=new Event('deviceorientationabsolute');e.alpha={alpha};e.absolute={'true' if absolute else 'false'};window.dispatchEvent(e)}})()")
        pg.wait_for_timeout(150)
    def rot():
        value = ev("""(() => {
            const el = document.getElementById('homeQiblaArrow');
            if (!el) return null;
            const m = getComputedStyle(el).transform;
            if (!m || m === 'none') return null;
            const v = m.match(/matrix\(([^)]+)\)/);
            if (!v) return null;
            const n = v[1].split(',').map(Number);
            if (n.length < 2 || !Number.isFinite(n[0]) || !Number.isFinite(n[1])) return null;
            return (Math.atan2(n[1], n[0]) * 180 / Math.PI + 360) % 360;
        })()""")
        return float(value) if value is not None else float('nan')

    fire(0)   # phone facing north: arrow should sit at the bearing
    ok('sensor auto-started: Home label leaves compass off without pressing Enable', 'compass off' not in pg.inner_text('#homeQiblaMiniDirection'), pg.inner_text('#homeQiblaMiniDirection'))
    ok('Home arrow at the bearing when phone faces north', abs(((rot() - bearing + 180) % 360) - 180) < 2, f'{rot()} vs {bearing}')
    fire(360 - 90)  # phone now facing east (heading 90): arrow = bearing - 90
    want = (bearing - 90) % 360
    ok('Home arrow turns as the phone turns', abs(((rot() - want + 180) % 360) - 180) < 2, f'{rot()} vs {want}')
    fire(360 - bearing)  # facing the Qibla: arrow straight up
    ok('Home arrow points straight up when facing Qibla', min(rot(), 360 - rot()) < 2, str(rot()))
    ok('Home label says facing the Qibla when aligned', 'Facing the Qibla' in pg.inner_text('#homeQiblaMiniDirection'), pg.inner_text('#homeQiblaMiniDirection'))
    ok('no page errors', not errs, str(errs))
    b.close()
srv.stop(); sys.exit(R.done('P0 fixes'))
