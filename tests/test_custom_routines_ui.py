import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import Server

srv=Server(8791)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox'])
        ctx=browser.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True)
        ctx.add_init_script("localStorage.setItem('naseem-onboarding-complete-v1','1')")
        page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(srv.url());page.wait_for_timeout(900)
        page.evaluate("switchScreen('dhikrScreen')");page.click('#tabLibrary');page.wait_for_timeout(300)
        page.click('#customRoutineAdd');page.wait_for_timeout(150)
        page.fill('#crName','Test Routine')
        card=page.locator('#crItems .cr-item').first
        card.locator('.crTitle').fill('Test dhikr')
        card.locator('.crArabic').fill('سُبْحَانَ اللَّهِ')
        card.locator('.crMeaning').fill('Glory be to Allah')
        card.locator('.crSource').fill('Personal test entry')
        card.locator('.crCount').fill('2')
        page.click('#crSave');page.wait_for_timeout(200)
        assert page.locator('#customRoutineGrid .routine-title').filter(has_text='Test Routine').count()==1
        page.locator('#customRoutineGrid .routine-card').click();page.wait_for_timeout(200)
        assert page.locator('#asTitle').inner_text()=='Test Routine'
        tap=page.locator('#asList .as-tap').first
        tap.click();assert '1 / 2' in page.locator('#asList .as-count').first.inner_text()
        page.click('#asUndo');assert '0 / 2' in page.locator('#asList .as-count').first.inner_text()
        tap.click();tap.click();assert not page.locator('#asDone').is_hidden()
        page.click('#asDone + *',timeout=500) if False else None
        page.click('#adhkarSessionScreen [data-back="dhikrScreen"]');page.wait_for_timeout(150)
        page.locator('#customRoutineGrid .custom-routine-edit').click();page.fill('#crName','Edited Routine');page.click('#crSave');page.wait_for_timeout(150)
        assert page.locator('#customRoutineGrid .routine-title').filter(has_text='Edited Routine').count()==1
        page.on('dialog',lambda dialog:dialog.accept())
        page.locator('#customRoutineGrid .custom-routine-edit').click();page.click('#crDelete');page.wait_for_timeout(150)
        assert page.locator('#customRoutineGrid .routine-title').filter(has_text='Edited Routine').count()==0
        assert not errors,errors
        print('Custom routine UI: create, count, undo, completion, edit and delete passed.')
        browser.close()
finally:
    srv.stop()
