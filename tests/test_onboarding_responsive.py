"""Prayerly-inspired, Naseem-themed onboarding regression across viewports."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from common import Server

VIEWPORTS = [(320, 568), (360, 640), (412, 915), (600, 960), (768, 1024), (640, 360)]
server = Server(8877)
failures = []
checks = 0

def check(label, condition, detail=''):
    global checks
    checks += 1
    print(('PASS ' if condition else 'FAIL ') + label, detail if not condition else '')
    if not condition:
        failures.append(label)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
    for width, height in VIEWPORTS:
        context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, is_mobile=True, has_touch=True, timezone_id='Asia/Kolkata')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(server.url())
        page.wait_for_timeout(2350)
        check(f'{width}x{height}: onboarding opens', page.locator('.v404-onboarding').count() == 1)

        def layout_state():
            return page.evaluate("""() => {
              const ids=['setupSkip','setupBack','setupFinish'];
              const boxes=ids.map(id=>{const e=document.getElementById(id);if(!e||e.hidden||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}).filter(Boolean);
              let overlap=false;
              for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)overlap=true;}
              return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,overlap};
            }""")

        state = layout_state()
        check(f'{width}x{height}: no horizontal overflow', not state['overflow'])
        check(f'{width}x{height}: setup actions do not overlap', not state['overlap'])

        # Welcome -> Asr preference. The first page intentionally has one clear primary action.
        page.click('#setupFinish')
        if width == 320:
            page.click('#setupSkip')
            check('Skip closes setup from the preference flow', page.locator('.v404-onboarding').count() == 0)
            page.evaluate('localStorage.clear()')
            page.reload()
            page.wait_for_timeout(2350)
            page.click('#setupFinish')
        check(f'{width}x{height}: Asr preference page is reachable', page.locator('[data-asr-choice="standard"]').is_visible())
        page.locator('[data-asr-choice="standard"]').click()
        check(f'{width}x{height}: Earlier Asr choice responds', page.locator('[data-asr-choice="standard"]').get_attribute('aria-pressed') == 'true')
        page.click('#setupFinish')

        # Calculation method
        check(f'{width}x{height}: auto calculation option is available', page.locator('[data-method-choice="auto"]').is_visible())
        page.locator('[data-method-choice="mwl"]').click()
        check(f'{width}x{height}: named method responds', page.locator('[data-method-choice="mwl"]').get_attribute('aria-pressed') == 'true')
        page.click('#setupFinish')

        # Notification opt-in is optional
        page.locator('#setupNotificationStatus').wait_for()
        check(f'{width}x{height}: notification opt-in page is reachable', page.locator('#setupEnableNotifications').is_visible())
        page.click('#setupFinish')

        # Optional profile choice
        page.locator('[data-gender-choice="unspecified"]').click()
        check(f'{width}x{height}: optional profile choice responds', page.locator('[data-gender-choice="unspecified"]').get_attribute('aria-pressed') == 'true')
        page.click('#setupFinish')

        # Manual city selection must actually save coordinates
        page.click('#setupManual')
        page.fill('#setupCitySearch', 'Srinagar')
        page.locator('[data-city-id="srinagar"]').click()
        check(f'{width}x{height}: manual city selection is saved in draft', 'Srinagar' in page.locator('#setupLocationStatus').inner_text())
        page.click('#setupFinish')

        check(f'{width}x{height}: visualise Salah times page is reachable', page.get_by_text('Visualise Salah times.').is_visible())
        page.click('#setupFinish')
        page.wait_for_timeout(150)
        check(f'{width}x{height}: setup completes', page.locator('.v404-onboarding').count() == 0)
        check(f'{width}x{height}: completion persists', page.evaluate("localStorage.getItem('naseem-onboarding-complete-v1')") == '1')
        saved = page.evaluate("({s:JSON.parse(localStorage.getItem('noorSalahV1')||'{}'),p:JSON.parse(localStorage.getItem('noorProfileV1')||'{}')})")
        check(f'{width}x{height}: Asr and calculation choices persist', saved['s'].get('asr') == 'standard' and saved['s'].get('method') == 'mwl')
        check(f'{width}x{height}: manual city coordinates persist', saved['s'].get('loc',{}).get('id') == 'srinagar' and abs(saved['s'].get('loc',{}).get('lat',0)-34.0837)<0.001)
        check(f'{width}x{height}: no JavaScript errors', not errors, str(errors))
        context.close()
    browser.close()
server.stop()
print(f'Responsive onboarding: {checks - len(failures)}/{checks} passed')
sys.exit(1 if failures else 0)
