import os, sys, re
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
R = Results(); srv = Server(8791); ok = R.ok
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True, timezone_id='Asia/Kolkata')
    ctx.add_init_script("""window.Capacitor={isNativePlatform:()=>true};window.__w={prayer:null,tas:[],pending:0};
window.__plugins={NoorWidgets:{setPrayerTimes:async o=>{window.__w.prayer=JSON.parse(o.json)},setTasbeeh:async o=>{window.__w.tas.push(o)},takePending:async()=>({count:0})}};""")
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(srv.url()); pg.wait_for_timeout(2300); ev = pg.evaluate
    ok('native layer present', ev("!!(NoorNative.isNative && NoorNative.notifications && NoorNative.widgets)"))
    open_group(pg, 'stNotifications')
    ok('off by default, nothing scheduled', ev("__ln.pending.length") == 0)
    pg.click('#rmMaster'); pg.wait_for_timeout(900)
    ok('permission requested', ev("__ln.calls.some(c=>c[0]=='request')") and ev("NoorNative.notifications.CH.adhan") == 'noor-adhan-v1')
    chans = ev("__ln.calls.filter(c=>c[0]=='channel').map(c=>c[1])")
    byid = {c['id']: c for c in chans}
    ok('three channels (adhan w/ sound, tone, silent)', set(byid) == {'noor-adhan-v1', 'noor-salah-alarm', 'noor-silent-v1'} and byid['noor-adhan-v1']['sound'] == 'adhan.mp3' and byid['noor-silent-v1']['importance'] == 2)
    pend = ev("__ln.pending")
    ids = [n['id'] for n in pend]
    ok('21-day horizon, 5 Adhan/day, unique ids', len(ids) == len(set(ids)) and 100 <= len(ids) <= 105 and max(ids) < 22000, f'{len(ids)}')
    ok('adhan notifications use adhan channel+sound', all(n['channelId'] == 'noor-adhan-v1' and n['sound'] == 'adhan.mp3' for n in pend if n['id'] % 10 == 0))
    # times: first Adhan scheduled equals the calculated time for that day
    first = sorted([n for n in pend if n['id'] % 10 == 0], key=lambda n: n['id'])[0]
    ok('titles/bodies 12-hour', all(not re.search(r'\b\d{1,2}:\d{2}\b(?!\s?[AP]M)', n['body']) for n in pend), first['body'])
    # change settings -> rebuilt without duplicates
    pg.click('[data-sound="fajr:silent"]'); pg.wait_for_timeout(500)
    pend = ev("__ln.pending"); ids = [n['id'] for n in pend]
    fj = [n for n in pend if n['id'] % 1000 == 0 or (n['id'] % 1000) // 10 == 0 and n['id'] % 10 == 0]
    ok('Fajr silent channel after change, no duplicates', len(ids) == len(set(ids)) and all(n['channelId'] == 'noor-silent-v1' for n in pend if (n['id'] % 1000) == 0))
    pg.click('[data-pre="10"]'); pg.click('[data-jam="dhuhr"]'); pg.wait_for_timeout(600)
    pend = ev("__ln.pending"); ids = [n['id'] for n in pend]
    ok('heads-up (kind 1) and Jamaat (kind 2) scheduled separately', any(i % 10 == 1 for i in ids) and any(i % 10 == 2 for i in ids) and len(ids) == len(set(ids)))
    jm = [n for n in pend if n['id'] % 10 == 2][0]
    ok('Jamaat title distinct from Adhan', 'Jamaat' in jm['title'] and jm['channelId'] == 'noor-salah-alarm')
    # editing prayer settings reschedules via noor:schedule
    n0 = ev("__ln.pending.filter(n=>n.id%1000==0).map(n=>n.schedule.at).join()")
    open_group(pg, 'stSalah')
    for _ in range(3): pg.click('[data-a="adj"][data-k="fajr"][data-d="1"]')
    pg.wait_for_timeout(700)
    n1 = ev("__ln.pending.filter(n=>n.id%1000==0).map(n=>n.schedule.at).join()")
    ok('prayer-time edit reschedules alarms', n0 != n1 and ev("__ln.pending.length") == len(set(ev("__ln.pending.map(n=>n.id)"))))
    # master off clears
    open_group(pg, 'stNotifications'); pg.click('#rmMaster'); pg.wait_for_timeout(500)
    ok('turning off cancels everything', ev("__ln.pending.length") == 0)
    # test buttons
    pg.click('#rmMaster'); pg.wait_for_timeout(600); pg.click('#rmTestAdhan'); pg.wait_for_timeout(300)
    ok('test Adhan scheduled ~10 s ahead on adhan channel', ev("__ln.pending.some(n=>n.id==99991&&n.channelId=='noor-adhan-v1'&&n.schedule.at-Date.now()<12000)"))
    wm = ev("__w.prayer"); keys = sorted(wm or {})
    ok('widget gets 21 dated entries incl. today', len(keys) == 21 and ev("(()=>{const d=new Date();const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())})()") in keys)
    ok('widget entry has all prayers', all(k in wm[keys[0]] for k in ['fajr','sunrise','dhuhr','asr','maghrib','isha']))
    ok('no page errors', not errs, str(errs)); b.close()
srv.stop(); sys.exit(R.done('Scheduling'))
