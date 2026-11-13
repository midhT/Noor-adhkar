"""Glance: the Home card is never empty, the feed request is time-limited, Refresh gives feedback and cannot stack."""
import sys, os, time
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

FEED = '{"schemaVersion":1,"contentVersion":3,"items":[{"published":true,"type":"Daily lesson","title":"Feed item one","body":"From the public feed","reference":"ref"}]}'
srv = Server(8842)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    def new(handler=None, ctx=None):
        ctx = ctx or b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True)
        if not hasattr(ctx, '_seeded'): seed_returning_user(ctx); ctx._seeded = True
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        hits = []
        def route(r):
            hits.append(1)
            if handler == 'hang': return                       # never answers (aborted by the app's own timeout)
            if handler == '404': return r.fulfill(status=404, body='Not Found')
            if handler == 'bad': return r.fulfill(status=200, content_type='application/json', body='{"schemaVersion":9}')
            return r.fulfill(status=200, content_type='application/json', body=FEED)
        pg.route('**/glance.json', route)
        return ctx, pg, errs, hits

    # 1) hanging feed: the card must not stay empty and Refresh must answer
    ctx, pg, errs, hits = new('hang'); t = time.time(); pg.goto(srv.url()); pg.wait_for_timeout(1500)
    title = pg.evaluate("document.getElementById('homeGlanceTitle')?.textContent||''")
    ok('Home card shows content immediately even though the feed hangs', len(title.strip()) > 3, repr(title))
    pg.tap('#homeGlancePreview'); pg.wait_for_timeout(500)
    ok('tapping the Home card opens Glance', pg.evaluate("document.querySelector('.screen.active').id") != 'homeScreen')
    gid = pg.evaluate("document.querySelector('.screen.active').id")
    pg.wait_for_timeout(9500)   # app timeout is 8s
    status = pg.inner_text('#glanceStatus')
    ok('slow feed is reported, not silent', 'slow' in status.lower() or 'built-in' in status.lower() or 'unavailable' in status.lower(), status)
    pg.tap('#glanceRefresh'); pg.wait_for_timeout(300)
    ok('Refresh shows progress and disables itself while working', pg.inner_text('#glanceRefresh').startswith('Refreshing') and pg.evaluate("document.getElementById('glanceRefresh').disabled"))
    n = len(hits); pg.evaluate("document.getElementById('glanceRefresh').click()"); pg.wait_for_timeout(200)
    ok('a second press does not start a second request', len(hits) == n, f'{n} -> {len(hits)}')
    pg.wait_for_timeout(9000)
    ok('Refresh recovers after the timeout', not pg.evaluate("document.getElementById('glanceRefresh').disabled") and pg.inner_text('#glanceRefresh') == 'Refresh Glance')
    ok('no page errors (hang)', errs == [], str(errs)); ctx.close()

    # 2) healthy feed: feed content is used and Refresh moves on to the next item
    ctx, pg, errs, hits = new('ok'); pg.goto(srv.url()); pg.wait_for_timeout(2000)
    pg.evaluate("switchScreen('homeScreen')"); pg.tap('#homeGlancePreview'); pg.wait_for_timeout(500)
    seen = {pg.inner_text('#glanceCard h2') if pg.evaluate("!!document.querySelector('#glanceCard h2')") else pg.inner_text('#glanceCard')[:60]}
    for _ in range(4):
        pg.tap('#glanceRefresh'); pg.wait_for_timeout(900)
        seen.add(pg.inner_text('#glanceCard')[:60])
    ok('Refresh cycles through different items', len(seen) >= 2, str(seen))
    ok('status reports success with the feed version', 'ready' in pg.inner_text('#glanceStatus').lower() and 'v3' in pg.inner_text('#glanceStatus'), pg.inner_text('#glanceStatus'))
    ok('no page errors (ok)', errs == [], str(errs))
    # remember it offline: next launch with a dead feed still shows saved content, never blank
    storage = ctx.storage_state(); ctx.close()
    ctx2 = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True, storage_state=storage); ctx2._seeded = True
    ctx2, pg, errs, hits = new('404', ctx2); pg.goto(srv.url()); pg.wait_for_timeout(1800)
    ok('after a restart with the feed down the Home card still has content', len((pg.evaluate("document.getElementById('homeGlanceTitle')?.textContent||''")).strip()) > 3)
    ctx2.close()

    # 3) error responses
    for mode in ('404', 'bad'):
        ctx, pg, errs, hits = new(mode); pg.goto(srv.url()); pg.wait_for_timeout(1500)
        pg.evaluate("switchScreen('homeScreen')"); pg.tap('#homeGlancePreview'); pg.wait_for_timeout(400); pg.tap('#glanceRefresh'); pg.wait_for_timeout(1200)
        ok(f'{mode}: fallback shown with a clear message', 'built-in' in pg.inner_text('#glanceStatus').lower() or 'unavailable' in pg.inner_text('#glanceStatus').lower() or 'saved' in pg.inner_text('#glanceStatus').lower(), pg.inner_text('#glanceStatus'))
        ok(f'{mode}: button usable again', not pg.evaluate("document.getElementById('glanceRefresh').disabled"))
        ok(f'{mode}: no page errors', errs == [], str(errs)); ctx.close()
    b.close()
srv.stop()
print('Glance:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
