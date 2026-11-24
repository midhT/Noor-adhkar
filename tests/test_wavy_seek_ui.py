"""Browser test: canvas wavy seek bar (rolls while playing, flat when paused/dragged, seeks) and the glass nav lens."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

SNAP = "document.querySelector('#quranFullSeek canvas').toDataURL()"
srv = Server(8876)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True, device_scale_factor=1)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=1.0)
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.evaluate("document.body.classList.remove('lite')")

    # ---- glass navigation lens ----
    ok('nav lens exists', pg.evaluate("!!document.querySelector('.bottom-nav .nav-lens')"))
    ok('lens starts on the active tab', float(pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav')).getPropertyValue('--lens')")) == 0)
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
    idx = pg.evaluate("[...document.querySelectorAll('.bottom-nav > .nav-item')].findIndex(e=>e.classList.contains('active'))")
    ok('lens follows the selected tab', float(pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav')).getPropertyValue('--lens')")) == idx and idx > 0, str(idx))
    box = pg.evaluate("(()=>{const l=document.querySelector('.nav-lens').getBoundingClientRect(),t=document.querySelectorAll('.bottom-nav > .nav-item')[%d].getBoundingClientRect();return [l.left+l.width/2,t.left+t.width/2]})()" % idx)
    ok('lens sits under the selected tab', abs(box[0] - box[1]) < 6, str(box))
    pg.evaluate("document.querySelector('.bottom-nav').classList.add('lens-press')"); pg.wait_for_timeout(700)
    box2 = pg.evaluate("(()=>{const l=document.querySelector('.nav-lens').getBoundingClientRect(),t=document.querySelectorAll('.bottom-nav > .nav-item')[%d].getBoundingClientRect();return [l.left+l.width/2,t.left+t.width/2]})()" % idx)
    ok('pressed (swollen) lens stays centred on its tab', abs(box2[0] - box2[1]) < 3, str(box2))
    ok('no ambient backdrop layer', pg.evaluate("getComputedStyle(document.body,'::before').content") in ('none','normal'))
    pg.evaluate("document.querySelector('.bottom-nav').classList.remove('lens-press')")
    ok('nav does not animate flex-grow any more', 'flex-grow' not in pg.evaluate("getComputedStyle(document.querySelector('.nav-item.active')).transitionProperty"))

    # ---- wavy seek bar ----
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
    pg.tap('[data-play-ayah="3"]'); pg.wait_for_timeout(500)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(700)
    ok('seek bar is a canvas with real size', pg.evaluate("(()=>{const c=document.querySelector('#quranFullSeek canvas');return !!c&&c.width>100&&c.height>20})()"))
    ok('canvas has painted pixels', pg.evaluate("(()=>{const c=document.querySelector('#quranFullSeek canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n>200})()"))
    a = pg.evaluate(SNAP); pg.wait_for_timeout(500); b2 = pg.evaluate(SNAP)
    ok('wave rolls while audio plays', a != b2)
    pg.evaluate("document.getElementById('quranAudio').pause()"); pg.wait_for_timeout(500)
    c1 = pg.evaluate(SNAP); pg.wait_for_timeout(500); c2 = pg.evaluate(SNAP)
    ok('wave is still when paused', c1 == c2)
    r = pg.evaluate("(()=>{const r=document.getElementById('quranFullSeek').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
    pg.evaluate("document.getElementById('quranAudio').play()"); pg.wait_for_timeout(200)
    pg.tap('#quranFullSeek', position={'x': r[2] * 0.7, 'y': r[3] / 2}); pg.wait_for_timeout(500)
    dur = pg.evaluate("document.getElementById('quranAudio').duration"); cur = pg.evaluate("document.getElementById('quranAudio').currentTime")
    ok('tapping the bar seeks', dur > 0 and 0.5 < cur / dur < 0.9, f'{cur}/{dur}')
    ok('aria value follows', int(pg.evaluate("document.getElementById('quranFullSeek').getAttribute('aria-valuenow')")) >= 50)
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Wavy seek UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
