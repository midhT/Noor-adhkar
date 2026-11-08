import os, json, subprocess, time, re, struct, wave, os
from playwright.sync_api import sync_playwright
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'.build')
srv=subprocess.Popen(['python3','-m','http.server','8780','-d',S+'/wwwtest'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SCHED={"fajr":"05:02","dhuhr":"12:34","asr":"15:45","maghrib":"18:32","isha":"20:00","sunrise":"06:20"}
res={}
def ok(name,cond,extra=''):
    print(('PASS' if cond else 'FAIL'),name,extra); res[name]=bool(cond)
# tiny wav for the own-audio test
wp=S+'/tone.wav'
with wave.open(wp,'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000); w.writeframes(struct.pack('<h',0)*16000)
def drag(cdp,y0,y1,x=200):
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y0}]})
    for i in range(1,13):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y0+(y1-y0)*i/12}]}); time.sleep(0.016)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]}); time.sleep(0.6)
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':393,'height':852},device_scale_factor=2,is_mobile=True,has_touch=True,accept_downloads=True)
    ctx.add_init_script("if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('noorPrayerScheduleV1', %s);}"%json.dumps(json.dumps(SCHED)))
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    dialogs=[]
    def on_dialog(d): dialogs.append(d.message); d.accept() if ACCEPT[0] else d.dismiss()
    ACCEPT=[True]; pg.on('dialog',on_dialog)
    pg.goto('http://localhost:8780/index.html'); pg.wait_for_timeout(2600)
    cdp=ctx.new_cdp_session(pg)
    # --- navigation
    labels=pg.evaluate("[...document.querySelectorAll('.nav-item small')].map(e=>e.textContent)")
    ok('exactly five tabs in order', labels==['Home','Adhkar','Tasbeeh','Salah','Settings'], str(labels))
    ok('focus screen removed', pg.evaluate("!document.getElementById('focusScreen') && !/Focus/i.test(document.body.innerText)"))
    for sid in ['homeScreen','libraryScreen','counterScreen','salahScreen','settingsScreen']:
        pg.click(f'.nav-item[data-screen="{sid}"]'); pg.wait_for_timeout(450)
        act=pg.evaluate("document.querySelector('.screen.active').id")
        ok(f'nav -> {sid}', act==sid)
        pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(100)
        h=pg.evaluate("document.documentElement.scrollHeight")
        drag(cdp,700,300); y=pg.evaluate("scrollY")
        if h>852+50: ok(f'touch scroll on {sid}', y>100, f'y={y} height={h}')
    # progress reachable from home, home tab highlighted, back works
    pg.click('.nav-item[data-screen="homeScreen"]'); pg.wait_for_timeout(300)
    pg.click('.v3-tile[data-go="progressScreen"]'); pg.wait_for_timeout(400)
    ok('progress reachable from Home', pg.evaluate("document.querySelector('.screen.active').id")=='progressScreen' and pg.evaluate("document.querySelector('.nav-item.active').dataset.screen")=='homeScreen')
    pg.click('[data-back]'); pg.wait_for_timeout(300)
    ok('progress back link', pg.evaluate("document.querySelector('.screen.active').id")=='homeScreen')
    # --- 12-hour time
    pg.evaluate("window.scrollTo(0,0)")
    txt=pg.inner_text('#prayerDashboard')
    bad=re.findall(r'\b\d{1,2}:\d{2}\b(?!\s?[AP]M)',txt)
    ok('home shows only 12-hour times', not bad and '5:02 AM' in txt and '12:34 PM' in txt and '6:32 PM' in txt, str(bad))
    pg.evaluate("document.getElementById('pdEditor').open=true")
    pg.select_option('#pd-fajr [data-p="h"]','4'); pg.select_option('#pd-fajr [data-p="m"]','50'); pg.select_option('#pd-fajr [data-p="ap"]','AM')
    pg.select_option('#pd-isha [data-p="h"]','9'); pg.select_option('#pd-isha [data-p="m"]','5'); pg.select_option('#pd-isha [data-p="ap"]','PM')
    pg.click('#pdSave'); pg.wait_for_timeout(300)
    stored=pg.evaluate("JSON.parse(localStorage.getItem('noorPrayerScheduleV1'))")
    ok('12-hour entry stored as 24h internally', stored['fajr']=='04:50' and stored['isha']=='21:05', str(stored))
    ok('edited times displayed in 12-hour', '4:50 AM' in pg.inner_text('#pdTimetable') and '9:05 PM' in pg.inner_text('#pdTimetable'))
    ok('editor reloads saved value into pickers', pg.evaluate("document.getElementById('pd-isha').value")=='21:05')
    pg.select_option('#pd-dhuhr [data-p="h"]','12'); pg.select_option('#pd-dhuhr [data-p="ap"]','AM'); pg.select_option('#pd-dhuhr [data-p="m"]','0')
    ok('12 AM = 00:00', pg.evaluate("document.getElementById('pd-dhuhr').value")=='00:00')
    pg.select_option('#pd-dhuhr [data-p="ap"]','PM'); ok('12 PM = 12:00', pg.evaluate("document.getElementById('pd-dhuhr').value")=='12:00')
    pg.select_option('#pd-dhuhr [data-p="h"]','12'); pg.select_option('#pd-dhuhr [data-p="m"]','34')
    pg.click('#pdSave'); pg.wait_for_timeout(200)
    # --- create some progress
    pg.click('.nav-item[data-screen="counterScreen"]'); pg.wait_for_timeout(300)
    for _ in range(7): pg.click('#countButton')
    pg.click('#finishCounter'); pg.wait_for_timeout(200)
    for _ in range(3): pg.click('#countButton')
    before=pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1'))")
    ok('progress recorded', before['sessions'] and sum(before['counts'].values())==10, str(sum(before['counts'].values())))
    # --- settings
    pg.click('.nav-item[data-screen="settingsScreen"]'); pg.wait_for_timeout(400)
    groups=pg.evaluate("[...document.querySelectorAll('.st-group .st-title strong')].map(e=>e.textContent)")
    ok('settings categories', groups==['Salah','Adhkar','Notifications','Appearance','Audio & Haptics','Data & Backup','About Noor'], str(groups))
    pg.click('#stAbout > summary'); pg.wait_for_timeout(200)
    ab=pg.inner_text('#stAbout')
    ok('about: creator, version, instagram placeholder', 'Mir Midhat ul Ahad' in ab and '3.3.0' in ab and 'Instagram' in ab and 'Not set' in ab)
    ok('accordion keeps one group open', pg.evaluate("document.querySelectorAll('.st-group[open]').length")==1)
    pg.click('#stAppearance > summary'); pg.click('#stThemeSeg [data-theme="light"]')
    ok('theme from settings', pg.evaluate("document.body.classList.contains('light')") and pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1')).theme")=='light')
    pg.click('#stThemeSeg [data-theme="dark"]')
    pg.click('#stAudio > summary'); pg.click('#bgAudioToggle'); pg.wait_for_timeout(500)
    ok('missing night_pad.wav handled honestly', 'not included' in pg.inner_text('#bgAudioLabel') and pg.get_attribute('#bgAudioToggle','aria-pressed')=='false', pg.inner_text('#bgAudioLabel'))
    pg.set_input_files('#bgAudioFile',wp); pg.click('#bgAudioToggle'); pg.wait_for_timeout(700)
    ok('own audio file plays', pg.evaluate("!document.getElementById('bgAudio').paused") and pg.get_attribute('#bgAudioToggle','aria-pressed')=='true')
    pg.click('#bgAudioToggle'); pg.wait_for_timeout(200)
    ok('audio stops', pg.evaluate("document.getElementById('bgAudio').paused"))
    # --- backup export (web path = download)
    pg.click('#stData > summary'); pg.wait_for_timeout(200)
    with pg.expect_download() as dl: pg.click('#stExport')
    path=S+'/backup.json'; dl.value.save_as(path)
    bk=json.load(open(path))
    ok('export file shape', bk['app']=='noor' and bk['format']==1 and set(bk['data'])>= {'noor-adhkar-v1','noorPrayerScheduleV1'} and re.match(r'noor-backup-\d{4}-\d{2}-\d{2}\.json',dl.value.suggested_filename), dl.value.suggested_filename)
    # --- validation rejects bad files without touching data
    snap=pg.evaluate("localStorage.getItem('noor-adhkar-v1')")
    def attempt(name,content):
        fp=S+'/bad.json'; open(fp,'w').write(content if isinstance(content,str) else json.dumps(content))
        n=len(dialogs); pg.set_input_files('#stRestoreFile',fp); pg.wait_for_timeout(400)
        unchanged=pg.evaluate("localStorage.getItem('noor-adhkar-v1')")==snap
        ok('reject: '+name, 'cancelled' in pg.inner_text('#stDataNote') and len(dialogs)==n and unchanged, pg.inner_text('#stDataNote')[:70])
    attempt('not json','this is not json {')
    attempt('wrong app',{'app':'other','format':1,'data':{'x':'{}'}})
    attempt('future format',{**bk,'format':2})
    attempt('empty data',{**bk,'data':{}})
    attempt('unknown key',{**bk,'data':{**bk['data'],'evil':'{}'}})
    bad=json.loads(bk['data']['noor-adhkar-v1']); bad['counts']={'x':-5}
    attempt('negative counts',{**bk,'data':{**bk['data'],'noor-adhkar-v1':json.dumps(bad)}})
    bad=json.loads(bk['data']['noor-adhkar-v1']); bad['days']={'tomorrow':{}}
    attempt('bad day key',{**bk,'data':{**bk['data'],'noor-adhkar-v1':json.dumps(bad)}})
    attempt('bad prayer time',{**bk,'data':{**bk['data'],'noorPrayerScheduleV1':json.dumps({'fajr':'25:99'})}})
    attempt('damaged entry',{**bk,'data':{'noor-adhkar-v1':'{oops'}})
    # --- declined confirm keeps data
    ACCEPT[0]=False; pg.set_input_files('#stRestoreFile',path); pg.wait_for_timeout(400)
    ok('declining restore changes nothing', pg.evaluate("localStorage.getItem('noor-adhkar-v1')")==snap and 'Nothing was changed' in pg.inner_text('#stDataNote'))
    ok('restore dialog summarises backup', any('1 session' in m and '10 counts' in m for m in dialogs), dialogs[-1][:90] if dialogs else '')
    ACCEPT[0]=True
    # --- reset progress then restore from backup
    pg.click('#stResetProgress'); pg.wait_for_timeout(300)
    z=pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1'))")
    ok('reset clears progress, keeps prayer times', z['sessions']==[] and z['counts']=={} and pg.evaluate("!!localStorage.getItem('noorPrayerScheduleV1')"))
    ok('undo offered after reset', pg.is_visible('#stUndoRow'))
    pg.set_input_files('#stRestoreFile',path); pg.wait_for_timeout(1500)
    after=pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1'))")
    ok('restore brings history back', after['sessions']==before['sessions'] and after['counts']==before['counts'] and after['days']==before['days'])
    ok('restore brings prayer times back', pg.evaluate("JSON.parse(localStorage.getItem('noorPrayerScheduleV1')).fajr")=='04:50')
    pg.click('.nav-item[data-screen="settingsScreen"]'); pg.click('#stData > summary'); pg.wait_for_timeout(300)
    ok('undo available after restore', pg.is_visible('#stUndoRow'))
    pg.click('#stUndo'); pg.wait_for_timeout(1500)
    ok('undo returns to pre-restore (reset) data', pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1')).sessions.length")==0)
    # --- erase everything + undo
    pg.set_input_files('#stRestoreFile',path); pg.wait_for_timeout(1500)
    pg.click('.nav-item[data-screen="settingsScreen"]'); pg.click('#stData > summary'); pg.click('#stEraseAll'); pg.wait_for_timeout(1500)
    ok('erase removes app data', pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1')).sessions.length")==0 and pg.evaluate("localStorage.getItem('noorPrayerScheduleV1')")is None and pg.evaluate("localStorage.getItem('noorRemindersV1')") is None and pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1')).theme")=='dark')
    ok('erase asks twice', sum('Erase everything' in m or 'Are you sure' in m for m in dialogs)>=2)
    pg.click('.nav-item[data-screen="settingsScreen"]'); pg.click('#stData > summary'); pg.click('#stUndo'); pg.wait_for_timeout(1500)
    ok('undo after erase restores history', pg.evaluate("JSON.parse(localStorage.getItem('noor-adhkar-v1')).sessions.length")==1)
    ok('no page errors', not errs, str(errs))
    b.close()
srv.terminate()
print('FAILED:',[k for k,v in res.items() if not v] if not all(res.values()) else 'ALL PASS', f'({sum(res.values())}/{len(res)})')
