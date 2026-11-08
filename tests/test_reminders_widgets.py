import os, json, subprocess, time
from playwright.sync_api import sync_playwright
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'.build')
srv=subprocess.Popen(['python3','-m','http.server','8781','-d',S+'/wwwtest'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
SCHED={"fajr":"05:02","dhuhr":"12:34","asr":"15:45","maghrib":"18:32","isha":"00:05","sunrise":"06:20"}
INIT="""
window.Capacitor={isNativePlatform:()=>true};
window.__w={prayer:null,tas:[],pending:3};
window.__plugins={NoorWidgets:{
  setPrayerTimes:async o=>{window.__w.prayer=JSON.parse(o.json)},
  setTasbeeh:async o=>{window.__w.tas.push(o)},
  takePending:async()=>{const n=window.__w.pending;window.__w.pending=0;return {count:n}}}};
localStorage.setItem('noorPrayerScheduleV1', %s);
"""%json.dumps(json.dumps(SCHED))
res={}
def ok(name,cond,extra=''):
    print(('PASS' if cond else 'FAIL'),name,extra); res[name]=cond
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':393,'height':852},device_scale_factor=2,is_mobile=True,has_touch=True)
    ctx.add_init_script(INIT)
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8781/index.html'); pg.wait_for_timeout(2500)
    # widget sync: pending 3 taps merged into the app counter on launch
    ok('widget taps merged', pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1')).count")==3)
    last=pg.evaluate("window.__w.tas[window.__w.tas.length-1]")
    ok('tasbeeh pushed to widget', last and last['count']==3 and last['name']=='Astaghfirullah' and last['target']==100, str(last))
    ok('prayer times pushed to widget', pg.evaluate("window.__w.prayer")['dhuhr']=='12:34')
    # counting pushes
    pg.click('.nav-item[data-screen="counterScreen"]'); pg.click('#countButton'); pg.wait_for_timeout(200)
    ok('count pushes to widget', pg.evaluate("window.__w.tas[window.__w.tas.length-1].count")==4)
    # reminders on
    pg.click('.nav-item[data-screen="homeScreen"]')
    pg.click('#rmMaster'); pg.wait_for_timeout(600)
    calls=pg.evaluate("window.__ln.calls")
    sch=[c for c in calls if c[0]=='schedule'][-1][1]
    ok('permission requested', any(c[0]=='request' for c in calls))
    ok('channel created max importance', any(c[0]=='channel' and c[1]['importance']==5 for c in calls))
    ok('5 alarms scheduled', [n['id'] for n in sch]==[1001,1002,1003,1004,1005], str([(n['id'],n['schedule']['on']['hour'],n['schedule']['on']['minute']) for n in sch]))
    ok('fajr time exact', (sch[0]['schedule']['on']['hour'],sch[0]['schedule']['on']['minute'])==(5,2))
    ok('status text', 'On · 5 prayers' in pg.inner_text('#rmStatus'), pg.inner_text('#rmStatus'))
    # offset 10 min before; isha 00:05 wraps to 23:55
    pg.click('#rmSeg button[data-off="10"]'); pg.wait_for_timeout(400)
    sch=[c for c in pg.evaluate("window.__ln.calls") if c[0]=='schedule'][-1][1]
    ok('offset wraps midnight', (sch[4]['schedule']['on']['hour'],sch[4]['schedule']['on']['minute'])==(23,55) and (sch[1]['schedule']['on']['hour'],sch[1]['schedule']['on']['minute'])==(12,24), str([(n['schedule']['on']['hour'],n['schedule']['on']['minute']) for n in sch]))
    ok('offset title', sch[1]['title']=='Dhuhr in 10 minutes', sch[1]['title'])
    # disable asr
    pg.click('.rm-switch[data-id="asr"]'); pg.wait_for_timeout(400)
    sch=[c for c in pg.evaluate("window.__ln.calls") if c[0]=='schedule'][-1][1]
    ok('per-prayer toggle', [n['id'] for n in sch]==[1001,1002,1004,1005])
    ok('old alarms cancelled first', pg.evaluate("window.__ln.pending.map(n=>n.id)")==[1001,1002,1004,1005], str(pg.evaluate("window.__ln.pending.map(n=>n.id)")))
    # changing prayer times reschedules
    pg.click('#pdEditToggle'); pg.select_option('#pd-fajr [data-p="h"]','4'); pg.select_option('#pd-fajr [data-p="m"]','50'); pg.select_option('#pd-fajr [data-p="ap"]','AM'); pg.click('#pdSave'); pg.wait_for_timeout(500)
    sch=[c for c in pg.evaluate("window.__ln.calls") if c[0]=='schedule'][-1][1]
    ok('time edit reschedules', (sch[0]['schedule']['on']['hour'],sch[0]['schedule']['on']['minute'])==(4,40), str((sch[0]['schedule']['on']['hour'],sch[0]['schedule']['on']['minute'])))
    ok('widget gets new times', pg.evaluate("window.__w.prayer.fajr")=='04:50')
    ok('notification body is 12-hour', 'AM' in sch[0]['body'] or 'PM' in sch[0]['body'], sch[0]['body'])
    # native backup export goes through file + share sheet
    pg.click('.nav-item[data-screen="settingsScreen"]'); pg.click('#stData > summary'); pg.click('#stExport'); pg.wait_for_timeout(500)
    fs=pg.evaluate("window.__fs||[]"); sh=pg.evaluate("window.__share||[]")
    ok('native export writes file + opens share sheet', len(fs)==1 and fs[0]['path'].endswith('.json') and json.loads(fs[0]['data'])['app']=='noor' and len(sh)==1 and sh[0]['url'].endswith(fs[0]['path']), str(sh))
    pg.click('.nav-item[data-screen="homeScreen"]')
    # test alarm
    pg.locator('#rmTest').scroll_into_view_if_needed(); pg.click('#rmTest'); pg.wait_for_timeout(300)
    t=[c for c in pg.evaluate("window.__ln.calls") if c[0]=='schedule'][-1][1][0]
    ok('test alarm one-shot', t['id']==1999 and 'at' in t['schedule'] and t['schedule']['allowWhileIdle'])
    pg.locator('#rmCard').scroll_into_view_if_needed(); pg.screenshot(path=S+'/shots/reminders_native.png')
    # persistence across reload: re-applies
    pg.evaluate("window.__ln.calls.length=0"); pg.reload(); pg.wait_for_timeout(2500)
    ok('self-heal on relaunch', any(c[0]=='schedule' for c in pg.evaluate("window.__ln.calls")))
    # turn off cancels
    pg.evaluate("window.__ln.calls.length=0")
    pg.click('#rmMaster'); pg.wait_for_timeout(400)
    ok('master off cancels all', pg.evaluate("window.__ln.pending.filter(n=>n.id<1999).length")==0)
    # denied permission path
    pg.evaluate("window.__ln.perm='denied';window.__ln.nextPerm='denied'")
    pg.click('#rmMaster'); pg.wait_for_timeout(500)
    ok('denied reverts + explains', pg.get_attribute('#rmMaster','aria-checked')=='false' and 'blocked' in pg.inner_text('#rmNote'))
    ok('no page errors', not errs, str(errs))
    b.close()
srv.terminate()
print('FAILED' if not all(res.values()) else 'ALL PASS')
