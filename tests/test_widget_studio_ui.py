import os, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import Server

srv=Server(8792)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox'])
        ctx=browser.new_context(viewport={'width':360,'height':800},is_mobile=True,has_touch=True)
        ctx.add_init_script("localStorage.setItem('naseem-onboarding-complete-v1','1')")
        page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(srv.url());page.wait_for_timeout(900)
        page.evaluate("""() => { window.__widgetStyleCalls=[]; window.__customWidgetCalls=[]; window.NoorNative.widgets={
          setStyle:async s=>{window.__widgetStyleCalls.push(s);return true;},
          setCustomWidget:async s=>{window.__customWidgetCalls.push(s);return true;},
          setPrayerTimes:async()=>true,setTasbeeh:async()=>true,setHijriDate:async()=>true
        }; }""")
        page.click('.nav-item[data-screen="settingsScreen"]');page.wait_for_timeout(100)
        page.click('.you-shortcut[data-open-screen="featuresScreen"]');page.wait_for_timeout(100)
        assert page.locator('.nav-item[data-screen="settingsScreen"]').evaluate("(e) => e.classList.contains('active')")
        page.click('[data-open-v404="widgets"]');page.wait_for_timeout(200)
        page.select_option('#studioWidgetTheme','light')
        page.select_option('#studioWidgetAccent','silver')
        page.select_option('#studioWidgetDensity','compact')
        page.click('#studioWidgetSave');page.wait_for_timeout(100)
        stored=page.evaluate("JSON.parse(localStorage.getItem('naseem-widget-style-v1'))")
        assert stored=={'theme':'light','accent':'silver','density':'compact'},stored
        calls=page.evaluate('window.__widgetStyleCalls')
        assert calls and calls[-1]['theme']=='light' and calls[-1]['accent']=='silver' and calls[-1]['density']=='compact',calls
        assert 'synced to your Android widgets' in page.inner_text('#studioWidgetAppearanceStatus')
        page.uncheck('.studio-widget-block[value="hijri"]')
        page.check('.studio-widget-block[value="dua"]')
        page.select_option('#studioWidgetLayout','compact')
        page.select_option('#studioWidgetAction','count')
        page.fill('#studioWidgetDua','Remember Allah throughout the day')
        page.click('#studioCustomSave');page.wait_for_timeout(100)
        custom=page.evaluate("JSON.parse(localStorage.getItem('naseem-custom-widget-v1'))")
        assert custom['blocks']==['prayer','tasbeeh','dua'] and custom['layout']=='compact' and custom['action']=='count',custom
        assert custom['dua']=='Remember Allah throughout the day',custom
        custom_calls=page.evaluate('window.__customWidgetCalls')
        assert custom_calls and custom_calls[-1]['blocks']=='prayer,tasbeeh,dua' and custom_calls[-1]['action']=='count',custom_calls
        assert 'saved and synced' in page.inner_text('#studioCustomStatus')
        assert not errors,errors
        print('Widget Studio UI: appearance, custom content composition, layout, action, persistence and native bridge passed.')
        browser.close()
finally:
    srv.stop()
