# V4.0.3: genuine Adhkar completion, persistence, streak rules and date rollover, exercised in a real browser.
import os, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
R = Results(); srv = Server(8796); ok = R.ok
SHIFT = """(()=>{window.__off=0;const RD=Date;class FD extends RD{constructor(...a){if(a.length===0){super(RD.now()+window.__off*86400000)}else{super(...a)}}static now(){return RD.now()+window.__off*86400000}}window.Date=FD})()"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True, timezone_id='Asia/Kolkata')
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())
    pg.add_init_script(SHIFT)
    pg.goto(srv.url()); pg.wait_for_timeout(2600); ev = pg.evaluate
    cur = lambda: ev("document.querySelector('.screen.active').id")
    items_n = ev("NaseemAdhkarData.items('morning').length")
    # ---- opening must not complete anything
    pg.click('.routine-card[data-routine="morning"]'); pg.wait_for_timeout(500)
    ok('tapping Morning opens the session screen', cur() == 'adhkarSessionScreen')
    ok('items listed with prescribed counts', ev("document.querySelectorAll('#asList .as-item').length") == items_n and '0 / 100' in ev("document.querySelector('[data-id=tasbih-100] .as-count').textContent"))
    ok('opening does NOT mark complete', not ev("(state.completed[AC_T()]||{}).morning".replace('AC_T()', 'today()')))
    ok('nav keeps Home highlighted', ev("document.querySelector('.nav-item.active').dataset.screen") == 'homeScreen')
    pg.click('#asDone', timeout=500) if False else None
    ok('undo disabled with nothing counted', ev("document.getElementById('asUndo').disabled"))
    # ---- counting + undo
    pg.click('[data-id=ikhlas] .as-tap'); pg.wait_for_timeout(100)
    ok('count advances 1 / 3', '1 / 3' in pg.inner_text('[data-id=ikhlas] .as-count'))
    pg.click('#asUndo'); pg.wait_for_timeout(100)
    ok('undo removes last count', '0 / 3' in pg.inner_text('[data-id=ikhlas] .as-count'))
    pg.click('[data-id=ayat-al-kursi] .as-tap'); pg.wait_for_timeout(100)
    ok('single-count item completes in one tap and locks', ev("document.querySelector('[data-id=ayat-al-kursi] .as-tap').disabled"))
    for _ in range(2): pg.click('[data-id=ikhlas] .as-tap')
    ok('partial progress is not completion', not ev("(state.completed[today()]||{}).morning") and ev("!document.getElementById('asDone').hidden") is False)
    # persistence across restart
    pg.reload(); pg.wait_for_timeout(2300)
    saved = ev("JSON.parse(localStorage.getItem('noor-adhkar-v1')).adhkar[today()].morning.progress")
    ok('counter progress persisted', saved.get('ayat-al-kursi') == 1 and saved.get('ikhlas') == 2, str(saved))
    ok('Home shows partial progress, not completed', '/' in pg.inner_text('#morningStatus') and 'Completed' not in pg.inner_text('#morningStatus'), pg.inner_text('#morningStatus'))
    pg.click('.routine-card[data-routine="morning"]'); pg.wait_for_timeout(400)
    ok('reopened session resumes counts', '2 / 3' in pg.inner_text('[data-id=ikhlas] .as-count'))
    # ---- finish morning automatically
    ev("""(()=>{for(const b of document.querySelectorAll('#asList .as-tap')){let g=0;while(!b.disabled&&g++<200)b.click()}})()""")
    pg.wait_for_timeout(300)
    ok('session auto-completes when every item is done', ev("state.completed[today()].morning") is True)
    ok('completion banner shown', ev("!document.getElementById('asDone').hidden"))
    ok('morning alone does NOT start the streak (both required)', ev("state.streak") == 0 and 'Evening' in pg.inner_text('#asDoneText'), pg.inner_text('#asDoneText'))
    ok('completion timestamp stored', bool(ev("state.adhkar[today()].morning.completedAt")))
    ok('every item shows full count', ev("[...document.querySelectorAll('#asList .as-count')].every(e=>{const [a,b]=e.textContent.split(' / ');return a===b})"))
    # ---- reopening a completed session awards nothing
    before = ev("JSON.stringify([state.streak,state.best,state.completed,state.adhkar])")
    pg.click('[data-back=homeScreen] >> visible=true') if False else pg.evaluate("switchScreen('homeScreen')"); pg.wait_for_timeout(300)
    pg.click('.routine-card[data-routine="morning"]'); pg.wait_for_timeout(400)
    ok('completed session: buttons locked, undo hidden', ev("[...document.querySelectorAll('.as-tap')].every(b=>b.disabled)") and ev("document.getElementById('asUndo').hidden"))
    ev("document.querySelectorAll('.as-tap').forEach(b=>b.click()); tapItem('tasbih-100'); undoItem()")
    ok('reopen/re-tap changes nothing and awards no streak', ev("JSON.stringify([state.streak,state.best,state.completed,state.adhkar])") == before)
    # ---- evening has its own record
    ok('evening untouched by morning', not ev("(state.completed[today()]||{}).evening") and (pg.evaluate("switchScreen('homeScreen')") or True) and (pg.wait_for_timeout(250) or True) and 'Not started' in pg.inner_text('#eveningStatus'))
    pg.click('.routine-card[data-routine="evening"]'); pg.wait_for_timeout(400)
    ok('evening session starts at zero', '0 / 100' in pg.inner_text('[data-id=tasbih-100] .as-count'))
    ev("""(()=>{for(const b of document.querySelectorAll('#asList .as-tap')){let g=0;while(!b.disabled&&g++<200)b.click()}})()""")
    pg.wait_for_timeout(300)
    ok('both sessions complete => streak 1', ev("state.streak") == 1 and ev("state.best") == 1 and 'Streak: 1 day' in pg.inner_text('#asDoneText'), pg.inner_text('#asDoneText'))
    pg.evaluate("switchScreen('homeScreen')"); pg.wait_for_timeout(300)
    ok('Home shows streak and 2 / 2', pg.inner_text('#homeStreak') == '1' and '2 / 2' in pg.inner_text('#dailyProgress'))
    ok('Progress screen agrees', (pg.evaluate("switchScreen('progressScreen')"), pg.inner_text('#progressStreak'))[1] == '1'); pg.evaluate("switchScreen('homeScreen')")
    # ---- date rollover: next day resets progress, keeps history, streak alive
    ev("window.__off=1; document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(300)
    ok('new day: routines reset to not started', 'Not started' in pg.inner_text('#morningStatus') and 'Not started' in pg.inner_text('#eveningStatus'))
    ok('new day: yesterday kept as history', ev("Object.keys(state.completed).length") == 1 and ev("Object.keys(state.adhkar).length") == 1)
    ok('new day: streak still alive until today passes', pg.inner_text('#homeStreak') == '1', pg.inner_text('#homeStreak'))
    ev("window.__off=2; document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(300)
    ok('missed a full day: streak resets, best remembered', pg.inner_text('#homeStreak') == '0' and ev("state.best") == 1, pg.inner_text('#homeStreak'))
    # ---- session open across midnight starts fresh instead of writing to the old day
    pg.click('.routine-card[data-routine="morning"]'); pg.wait_for_timeout(300)
    ev("window.__off=3")
    pg.click('[data-id=ikhlas] .as-tap'); pg.wait_for_timeout(200)
    ok('tap after midnight does not count on the old day', '0 / 3' in pg.inner_text('[data-id=ikhlas] .as-count') and ev("Object.keys(state.adhkar).length") == 1)
    ev("window.__off=0"); pg.evaluate("switchScreen('homeScreen')")
    # ---- legacy data: earlier button-press records are kept and still count, no data loss
    ev("state.completed={}; state.adhkar={}; state.days={}; const t=today(); const y=NaseemAdhkarCore.addDays(t,-1); state.completed[y]={morning:true,evening:true}; save(); updateStreak(); renderAll()")
    ok('legacy completed history still counts', ev("state.streak") == 1)
    # ---- reset progress clears adhkar records
    ev("document.getElementById('stResetProgress').click()"); pg.wait_for_timeout(300)
    ok('Reset progress clears sessions and streak', ev("Object.keys(state.adhkar).length") == 0 and ev("state.streak") == 0)
    # ---- backup validation accepts new field, rejects damaged one
    ok('page has no errors', not errs, str(errs))
    b.close()
srv.stop(); sys.exit(R.done('Adhkar sessions'))
