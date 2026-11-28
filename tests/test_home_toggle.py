"""Home has a Tasbih / Adhkar library toggle that opens the matching Dhikr panel."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
R = Results(); srv = Server(8844)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 380, 'height': 800}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(1800)
    R.ok('toggle is on Home', pg.evaluate("!!document.querySelector('#homeScreen .home-seg')"))
    pg.tap('#homeScreen [data-open-screen="libraryScreen"]'); pg.wait_for_timeout(800)
    R.ok('Adhkar library opens in the Dhikr tab', pg.evaluate("document.getElementById('dhikrScreen').classList.contains('active') && !document.getElementById('libraryScreen').hidden"))
    pg.evaluate("document.dispatchEvent(new CustomEvent('naseem:back',{cancelable:true,bubbles:true}))"); pg.wait_for_timeout(600)
    pg.tap('.nav-item[data-screen="homeScreen"]'); pg.wait_for_timeout(600)
    pg.tap('#homeScreen [data-open-screen="counterScreen"]'); pg.wait_for_timeout(800)
    R.ok('Tasbih opens the counter', pg.evaluate("document.getElementById('dhikrScreen').classList.contains('active') && !document.getElementById('counterScreen').hidden"))
    R.ok('no page errors', not errs, str(errs))
    ctx.close(); b.close()
srv.stop(); sys.exit(R.done('home toggle'))
