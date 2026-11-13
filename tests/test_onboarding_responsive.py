"""First-run onboarding regression across compact, tablet and landscape viewports."""
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
        context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, is_mobile=True, has_touch=True)
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

        if width == 320:
            page.click('#setupSkip')
            check('Skip closes setup immediately', page.locator('.v404-onboarding').count() == 0)
            page.evaluate('localStorage.clear()')
            page.reload()
            page.wait_for_timeout(2350)

        page.click('#setupFinish')
        page.fill('#setupName', 'Responsive test')
        page.click('#setupFinish')
        page.locator('[data-tradition-choice="shafii"]').click()
        check(f'{width}x{height}: school option responds to a tap', page.locator('[data-tradition-choice="shafii"]').get_attribute('aria-pressed') == 'true')
        check(f'{width}x{height}: no duplicate learning-path dropdown', page.locator('#setupTradition').count() == 0)
        state = layout_state()
        check(f'{width}x{height}: tradition page fits', not state['overflow'] and not state['overlap'])

        page.click('#setupFinish')
        page.click('#setupFinish')
        page.locator('[data-theme-choice="light"]').click()
        check(f'{width}x{height}: theme option responds to a tap', page.locator('[data-theme-choice="light"]').get_attribute('aria-pressed') == 'true')
        page.click('#setupFinish')
        page.locator('#setupNotificationStatus').wait_for()
        check(f'{width}x{height}: notification opt-in page is reachable', page.locator('#setupEnableNotifications').is_visible())
        page.click('#setupFinish')
        page.wait_for_timeout(100)
        check(f'{width}x{height}: setup completes', page.locator('.v404-onboarding').count() == 0)
        check(f'{width}x{height}: completion persists', page.evaluate("localStorage.getItem('naseem-onboarding-complete-v1')") == '1')
        check(f'{width}x{height}: no JavaScript errors', not errors, str(errors))
        context.close()
    browser.close()
server.stop()
print(f'Responsive onboarding: {checks - len(failures)}/{checks} passed')
sys.exit(1 if failures else 0)
