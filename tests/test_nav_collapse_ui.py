"""Navigation bar: collapses to a round button only while the player is on screen and the USER scrolls; audio is untouched."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

COLL = "document.body.classList.contains('nav-collapsed')"
AUDIO = "document.getElementById('quranAudio')"
def wheel(pg, dy, steps=8):
    pg.mouse.move(180, 300)
    for _ in range(steps): pg.mouse.wheel(0, dy / steps); pg.wait_for_timeout(40)
    pg.wait_for_timeout(900)

srv = Server(8865)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 360, 'height': 760}, is_mobile=True, has_touch=True, device_scale_factor=1)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=40.0)
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.evaluate("document.body.classList.remove('lite')")

    wheel(pg, 700)
    cm = pg.evaluate("(()=>{const n=document.querySelector('.bottom-nav'),r=n.getBoundingClientRect();return {c:document.body.classList.contains('nav-compact'),coll:document.body.classList.contains('nav-collapsed'),dock:getComputedStyle(document.querySelector('.nav-dock')).visibility,w:r.width,vis:getComputedStyle(n).visibility,lab:+getComputedStyle(n.querySelector('.nav-item.active small')).opacity}})()")
    ok('no player: scrolling down makes the pill smaller (no round button)', cm['c'] and not cm['coll'] and cm['dock'] == 'hidden' and cm['vis'] == 'visible' and 255 < cm['w'] < 285 and cm['lab'] < .1, str(cm))
    wheel(pg, -900)
    ok("scrolling up restores the full pill", not pg.evaluate("document.body.classList.contains('nav-compact')") and pg.evaluate("document.querySelector('.bottom-nav').getBoundingClientRect().width")>330)

    pg.locator('.nav-item[data-screen="quranReaderScreen"]').tap(); pg.wait_for_timeout(900)
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
    pg.tap('[data-play-ayah="3"]'); pg.wait_for_timeout(2600)
    ok('player is up', pg.evaluate("!document.getElementById('quranPlayer').hidden"))
    ok('the reader scrolling by itself (follow-the-ayah) does not collapse the bar', not pg.evaluate(COLL))

    pg.evaluate("window.__ev=[];" + AUDIO + ".addEventListener('emptied',()=>window.__ev.push('emptied'))")
    wheel(pg, 700)
    ok('user scroll down with the player up collapses the bar', pg.evaluate(COLL))
    st = pg.evaluate("""(()=>{const d=document.querySelector('.nav-dock'),n=document.querySelector('.bottom-nav'),p=document.getElementById('quranPlayer'),b=document.getElementById('quranExpandPlayer');
      const dc=getComputedStyle(d),nc=getComputedStyle(n);const dr=d.getBoundingClientRect(),pr=p.getBoundingClientRect(),br=b.getBoundingClientRect();
      const a=document.querySelector('.bottom-nav .nav-item.active .ni');
      return {dockVis:dc.visibility,dockOp:+dc.opacity,navVis:nc.visibility,navOp:+nc.opacity,dockW:dr.width,dockR:dr.right,pLeft:pr.left,pBottom:pr.bottom,dBottom:dr.bottom,titleW:br.width,same:d.querySelector('.ni').innerHTML===a.innerHTML,vw:innerWidth}})()""")
    ok('round button is visible', st['dockVis'] == 'visible' and st['dockOp'] > .95 and 54 <= st['dockW'] <= 58, str(st))
    ok('full bar is gone', st['navVis'] == 'hidden' and st['navOp'] < .05, str(st))
    ok('button shows the current tab icon', st['same'], str(st))
    ok('player docks beside the button, same row', st['pLeft'] >= st['dockR'] + 6 and abs(st['pBottom'] - st['dBottom']) <= 3 and st['pBottom'] <= 760, str(st))
    ok('docked player still shows its title', st['titleW'] > 40, str(st))
    ok('audio keeps playing, nothing reloaded', (not pg.evaluate(AUDIO + ".paused")) and pg.evaluate("window.__ev") == [], str(pg.evaluate("window.__ev")))
    ok('no horizontal overflow when collapsed', pg.evaluate("document.documentElement.scrollWidth<=innerWidth"))

    wheel(pg, -160)
    ok('scrolling back up expands the bar', not pg.evaluate(COLL))
    wheel(pg, 500)
    ok('collapses again', pg.evaluate(COLL))
    pg.evaluate("document.querySelector('.nav-dock').click()"); pg.wait_for_timeout(900)
    ok('tapping the round button expands the bar', not pg.evaluate(COLL))
    wheel(pg, 500); ok('collapsed once more', pg.evaluate(COLL))
    pg.evaluate("document.querySelector('.bottom-nav .nav-item[data-screen=\"homeScreen\"]').click()"); pg.wait_for_timeout(900)
    ok('changing tab expands the bar', not pg.evaluate(COLL))

    # themes: the round button is tinted glass, not white
    pg.locator('.nav-item[data-screen="quranReaderScreen"]').tap(); pg.wait_for_timeout(900)
    wheel(pg, 700)
    for theme in ['dark', 'light']:
        pg.evaluate("t=>document.body.classList.toggle('light',t==='light')", theme); pg.wait_for_timeout(300)
        bg = pg.evaluate("getComputedStyle(document.querySelector('.nav-dock')).backgroundColor")
        import re
        n = [float(x) for x in re.findall(r'[\d.]+', bg.split('(')[1])]
        if bg.startswith('color('):  # srgb 0..1 channels with an optional "/ alpha"
            rgb = [v * 255 for v in n[:3]]; n = rgb + ([n[3]] if len(n) > 3 else [])
        ok(f'{theme}: round button is translucent and not white', (n[3] if len(n) > 3 else 1) < .7 and (theme == 'light' or sum(n[:3]) / 3 < 140), bg)
    pg.evaluate("document.body.classList.remove('light')")

    # setting off: never collapses
    pg.evaluate("document.querySelector('.nav-dock').click()"); pg.wait_for_timeout(600)
    pg.evaluate("document.getElementById('stNavCollapseToggle').click()")
    ok('toggle shows OFF and is remembered', pg.evaluate("document.getElementById('stNavCollapseToggle').textContent") == 'OFF' and pg.evaluate("localStorage.getItem('naseemNavCollapseV1')") == 'off')
    wheel(pg, 700)
    ok('with the setting off the bar never collapses', not pg.evaluate(COLL))
    pg.evaluate("document.getElementById('stNavCollapseToggle').click()")
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Nav collapse UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
