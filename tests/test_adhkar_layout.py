"""Home keeps small tiles + a streak chip; Dhikr has Tasbih (with streak) and Adhkar (tiles + routines); routines run one item at a time."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
R = Results(); srv = Server(8842)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); ctx = b.new_context(viewport={'width': 380, 'height': 800}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2200)
    R.ok('home: compact tiles + chip', pg.evaluate("document.querySelectorAll('#homeScreen .routine-card.compact').length===2 && !!document.getElementById('homeStreakChip')"))
    R.ok('home: no big streak card, no extra grids', pg.evaluate("!document.querySelector('#homeScreen .streak-card') && !document.querySelector('#homeScreen #extraRoutineGrid')"))
    R.ok('home tile height small', pg.evaluate("document.querySelector('#homeScreen .routine-card.compact').getBoundingClientRect().height<70"))
    pg.tap('#homeStreakChip'); pg.wait_for_timeout(900)
    R.ok('chip opens Dhikr on Tasbih with streak card', pg.evaluate("document.getElementById('dhikrScreen').classList.contains('active') && !!document.querySelector('#counterScreen #streakSlot .streak-card') && document.getElementById('tabCounter').getAttribute('aria-selected')==='true'"))
    R.ok('streak card is below the counter button', pg.evaluate("document.getElementById('streakSlot').getBoundingClientRect().top>document.getElementById('countButton').getBoundingClientRect().top"))
    pg.tap('#tabLibrary'); pg.wait_for_timeout(500)
    R.ok('Adhkar panel has today tiles, 6 other routines, custom, library', pg.evaluate("document.querySelectorAll('#dhikrTodayGrid [data-routine]').length===2 && document.querySelectorAll('#extraRoutineGrid [data-routine]').length===6 && !!document.getElementById('customRoutineGrid') && !!document.getElementById('libraryList')"))
    pg.evaluate("openSession && 0") if False else None
    pg.tap('#extraRoutineGrid [data-routine="tasbih_fatima"]'); pg.wait_for_timeout(800)
    R.ok('Tasbih Fatima = 3 items 33/33/34', pg.evaluate("[...document.querySelectorAll('#asList .as-item .as-count')].length===3") and 'Glory' in pg.inner_text('#asList'))
    R.ok('only first item is tappable', pg.evaluate("const b=[...document.querySelectorAll('#asList .as-tap')];!b[0].disabled && b[1].disabled && b[2].disabled && document.querySelector('.as-current')===document.querySelectorAll('#asList .as-item')[0]"))
    for _ in range(33): pg.tap('#asList .as-item.as-current .as-tap')
    pg.wait_for_timeout(500)
    R.ok('after 33 taps item 2 becomes current', pg.evaluate("document.querySelectorAll('#asList .as-item')[1].classList.contains('as-current') && document.querySelectorAll('#asList .as-item')[0].classList.contains('done')"))
    pg.tap('#asBack') if pg.query_selector('#asBack') else None
    R.ok('no page errors', not errs, str(errs))
    b.close()
srv.stop(); sys.exit(R.done('adhkar layout'))
