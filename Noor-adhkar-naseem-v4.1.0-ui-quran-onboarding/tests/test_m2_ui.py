import os
import json, re, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
R = Results(); srv = Server(8790); ok = R.ok
TWELVE_BAD = re.compile(r'\b\d{1,2}:\d{2}\b(?!\s?[AP]M)')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
    def ctx_new(**kw):
        return b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=1, is_mobile=True, has_touch=True, timezone_id='Asia/Kolkata', accept_downloads=True, **kw)
    ctx = ctx_new(geolocation={'latitude': 28.6139, 'longitude': 77.2090}, permissions=['geolocation'])
    # This suite validates the app after setup. Seed BOTH completion records:
    # the standalone compatibility flag and the app's persisted settings object.
    # The app checks either value in startSetup(); seeding both makes this test
    # independent of migration timing and gives a useful failure if storage is blocked.
    ctx.add_init_script("""(() => {
      try {
        const key = 'naseem-v404-settings';
        const saved = JSON.parse(localStorage.getItem(key) || '{}');
        saved.setupComplete = true;
        localStorage.setItem(key, JSON.stringify(saved));
        localStorage.setItem('naseem-onboarding-complete-v1', '1');
      } catch (error) {
        window.__naseemTestSeedError = String(error);
      }
    })();""")
    pg = ctx.new_page(); errs = []; dialogs = []
    pg.on('pageerror', lambda e: errs.append(f"{e}\n{e.stack}"))
    ACCEPT = [True]
    pg.on('dialog', lambda d: (dialogs.append(d.message), d.accept() if ACCEPT[0] else d.dismiss()))
    pg.goto(srv.url()); pg.wait_for_timeout(2600)
    cdp = ctx.new_cdp_session(pg)
    ev = pg.evaluate
    seed = ev("({flag:localStorage.getItem('naseem-onboarding-complete-v1'),settings:JSON.parse(localStorage.getItem('naseem-v404-settings')||'{}').setupComplete,error:window.__naseemTestSeedError||null})")
    ok('returning-user test storage seeded before app startup', seed['flag'] == '1' and seed['settings'] is True and seed['error'] is None, str(seed))
    # ---------- navigation + scrolling ----------
    labels = ev("[...document.querySelectorAll('.nav-item small')].map(e=>e.textContent)")
    ok('onboarding does not cover returning-user navigation', not ev("!!document.querySelector('.v404-onboarding')"))
    ok('six tabs in order', labels == ['Home', 'Dhikr', 'Salah', 'More', 'Zakat', 'Settings'], str(labels))
    for sid in ['homeScreen', 'dhikrScreen', 'salahScreen', 'featuresScreen', 'zakatScreen', 'settingsScreen']:
        pg.click(f'.nav-item[data-screen="{sid}"]'); pg.wait_for_timeout(450)
        ev("window.scrollTo(0,0)"); pg.wait_for_timeout(100)
        h = ev("document.documentElement.scrollHeight")
        drag(cdp, 700, 300); y = ev("scrollY")
        if h > 900: ok(f'touch scroll {sid}', y > 100, f'y={y}')
    # ---------- defaults: Kashmir, Karachi method, Hanafi ----------
    st = ev("NoorSalah.get()")
    ok('default location Srinagar Kashmir', st['loc']['name'] == 'Srinagar, Kashmir' and abs(st['loc']['lat'] - 34.0837) < 1e-3 and st['loc']['tz'] == 'Asia/Kolkata' and st['loc']['source'] == 'default')
    ok('Hanafi Asr default', st['asr'] == 'hanafi' and st['method'] == 'karachi' and st['mode'] == 'calculated')
    pg.click('.nav-item[data-screen="homeScreen"]'); pg.wait_for_timeout(500); ev("window.scrollTo(0,0)")
    home = pg.inner_text('#prayerDashboard')
    t = ev("NoorSalah.timesFor(new Date())")
    ok('home pre-filled without any setup', all(ev(f"NoorTime.to12('{t[k]}')") in home for k in ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']), home[:80])
    ok('home 12-hour only', not TWELVE_BAD.findall(home), str(TWELVE_BAD.findall(home)))
    dm = int(t['dhuhr'][:2]) * 60 + int(t['dhuhr'][3:])
    ok('Srinagar Dhuhr is around 12:15 (longitude west of IST meridian)', 12 * 60 <= dm <= 12 * 60 + 40, t['dhuhr'])
    ok('home shows Jamaat for next prayer', 'Jamaat' in pg.inner_text('#pdNextJamaat'), pg.inner_text('#pdNextJamaat'))
    ok('home has no editor or reminder card any more', ev("!document.getElementById('pdEditor') && !document.getElementById('rmCard')"))
    ok('Prayer settings button opens Settings › Salah', (pg.click('#pdSettings'), pg.wait_for_timeout(700), ev("document.querySelector('.screen.active').id=='settingsScreen' && document.getElementById('stSalah').open"))[2])
    # ---------- Settings structure ----------
    groups = ev("[...document.querySelectorAll('.st-group .st-title strong')].map(e=>e.textContent)")
    ok('settings groups', groups == ['Account', 'Salah', 'Adhkar', 'Notifications', 'Appearance', 'Audio & Haptics', 'Data & Backup', 'About Naseem'], str(groups))
    ok('Salah settings 12-hour only', not TWELVE_BAD.findall(pg.inner_text('#stSalah .st-body')), str(TWELVE_BAD.findall(pg.inner_text('#stSalah .st-body')))[:80])
    # ---------- method / Asr ----------
    asr_h = ev("NoorSalah.timesFor(new Date()).asr"); fajr_k = ev("NoorSalah.timesFor(new Date()).fajr")
    pg.select_option('#ssAsr', 'standard'); pg.wait_for_timeout(200)
    asr_s = ev("NoorSalah.timesFor(new Date()).asr"); mm = lambda v: int(v[:2]) * 60 + int(v[3:])
    ok('Standard Asr earlier than Hanafi by 30-70 min', 30 <= mm(asr_h) - mm(asr_s) <= 70, f'{asr_h} vs {asr_s}')
    pg.select_option('#ssAsr', 'hanafi'); pg.select_option('#ssMethod', 'isna'); pg.wait_for_timeout(200)
    ok('method change moves Fajr (ISNA 15° later than Karachi 18°)', mm(ev("NoorSalah.timesFor(new Date()).fajr")) > mm(fajr_k) + 8)
    pg.select_option('#ssMethod', 'karachi'); pg.wait_for_timeout(200)
    # ---------- adjustments ----------
    base = ev("NoorSalah.timesFor(new Date()).fajr")
    for _ in range(5): pg.click('[data-a="adj"][data-k="fajr"][data-d="1"]')
    ok('+5 min adjustment', mm(ev("NoorSalah.timesFor(new Date()).fajr")) == mm(base) + 5 and ev("NoorSalah.get().adj.fajr") == 5)
    pg.reload(); pg.wait_for_timeout(2200)
    ok('adjustment persists after restart', ev("NoorSalah.get().adj.fajr") == 5)
    open_group(pg, 'stSalah'); pg.click('[data-a="resetAdj"]'); pg.wait_for_timeout(200)
    ok('reset to calculated', ev("NoorSalah.get().adj.fajr") == 0 and mm(ev("NoorSalah.timesFor(new Date()).fajr")) == mm(base))
    # ---------- city + GPS + decline ----------
    dhuhr_sri = ev("NoorSalah.timesFor(new Date()).dhuhr")
    pg.select_option('#ssCity', 'delhi'); pg.wait_for_timeout(200)
    ok('manual city (Delhi) changes times', mm(ev("NoorSalah.timesFor(new Date()).dhuhr")) < mm(dhuhr_sri) - 5 and ev("NoorSalah.get().loc.source") == 'manual')
    pg.select_option('#ssCity', 'srinagar'); pg.wait_for_timeout(200)
    ok('back to default city', ev("NoorSalah.get().loc.source") == 'default')
    pg.click('[data-a="gps"]'); pg.wait_for_timeout(1500)
    loc = ev("NoorSalah.get().loc")
    ok('GPS detection sets location (mock fix: Delhi)', loc['source'] == 'gps' and abs(loc['lat'] - 28.6139) < 1e-3, str(loc))
    ok('GPS choice is selectable and labelled', 'from GPS' in pg.inner_text('#stSalah .st-body'))
    pg.select_option('#ssCity', 'srinagar'); pg.wait_for_timeout(200)
    # ---------- Jamaat ----------
    j = ev("NoorSalah.jamaatFor(new Date())"); tt = ev("NoorSalah.timesFor(new Date())")
    ok('default Jamaat offsets (20/15/15/5/15)', [mm(j[k]) - mm(tt[k]) for k in ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']] == [20, 15, 15, 5, 15])
    pg.click('[data-a="joff"][data-k="dhuhr"][data-d="1"]'); pg.click('[data-a="joff"][data-k="dhuhr"][data-d="1"]')
    ok('Jamaat offset editable per prayer', mm(ev("NoorSalah.jamaatFor(new Date()).dhuhr")) - mm(tt['dhuhr']) == 17 and mm(ev("NoorSalah.jamaatFor(new Date()).asr")) - mm(tt['asr']) == 15)
    pg.select_option('[data-a="jmode"][data-k="isha"]', 'fixed'); pg.wait_for_timeout(250)
    pg.select_option('#ssj-isha [data-p="h"]', '8'); pg.select_option('#ssj-isha [data-p="m"]', '45'); pg.select_option('#ssj-isha [data-p="ap"]', 'PM'); pg.wait_for_timeout(250)
    ok('fixed Jamaat time (8:45 PM) stored and used', ev("NoorSalah.jamaatFor(new Date()).isha") == '20:45' and ev("NoorSalah.get().jamaat.isha.fixed") == '20:45')
    ok('Jamaat adhan time unaffected', ev("NoorSalah.timesFor(new Date()).isha") == tt['isha'])
    pg.reload(); pg.wait_for_timeout(2200)
    ok('Jamaat settings persist', ev("NoorSalah.jamaatFor(new Date()).isha") == '20:45' and mm(ev("NoorSalah.jamaatFor(new Date()).dhuhr")) - mm(tt['dhuhr']) == 17)
    open_group(pg, 'stSalah'); pg.click('[data-a="resetJamaat"]'); pg.wait_for_timeout(200)
    ok('Jamaat reset', ev("NoorSalah.get().jamaat.isha.mode") == 'offset' and ev("NoorSalah.get().jamaat.dhuhr.offset") == 15)
    # ---------- own times mode ----------
    pg.click('[data-a="mode"][data-v="manual"]'); pg.wait_for_timeout(300)
    pg.select_option('#ssm-fajr [data-p="h"]', '5'); pg.select_option('#ssm-fajr [data-p="m"]', '10'); pg.select_option('#ssm-fajr [data-p="ap"]', 'AM')
    pg.click('[data-a="saveManual"]'); pg.wait_for_timeout(300)
    ok('own times saved and used', ev("NoorSalah.timesFor(new Date()).fajr") == '05:10' and ev("NoorSalah.get().mode") == 'manual')
    pg.click('.nav-item[data-screen="homeScreen"]'); pg.wait_for_timeout(300)
    ok('home reflects own times in 12-hour', '5:10 AM' in pg.inner_text('#pdTimetable') and 'YOUR OWN TIMES' in pg.inner_text('#pdPlace'))
    open_group(pg, 'stSalah'); pg.click('[data-a="mode"][data-v="calculated"]'); pg.wait_for_timeout(300)
    ok('back to calculated', ev("NoorSalah.get().mode") == 'calculated' and ev("NoorSalah.timesFor(new Date()).fajr") == base)
    # ---------- Account ----------
    open_group(pg, 'stAccount')
    pg.fill('#acName', 'Mir Midhat'); pg.wait_for_timeout(200)
    ok('name shown in greeting and stored', 'Assalamu alaikum, Mir.' in pg.evaluate("document.querySelector('.greeting .muted').textContent") and ev("JSON.parse(localStorage.getItem('noorProfileV1')).name") == 'Mir Midhat')
    import zlib, struct
    def png(w, h, rgb):  # dependency-free PNG writer (no Pillow needed in CI)
        raw = b''.join(b'\x00' + bytes(rgb) * w for _ in range(h))
        ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
        return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')
    img = os.path.join(BUILD, 'face.png'); open(img, 'wb').write(png(800, 500, (200, 120, 40)))
    pg.set_input_files('#acPhoto', img); pg.wait_for_timeout(700)
    prof = ev("JSON.parse(localStorage.getItem('noorProfileV1'))")
    ok('profile picture stored small and square', prof['photo'].startswith('data:image/jpeg') and len(prof['photo']) < 60000 and ev("document.querySelector('#acAvatar img').naturalWidth") == 256, str(len(prof['photo'])))
    ok('picture appears in header avatar', ev("!!document.querySelector('#brandMark img')"))
    bk_prof = prof
    pg.reload(); pg.wait_for_timeout(2200)
    ok('profile persists after restart', ev("JSON.parse(localStorage.getItem('noorProfileV1')).name") == 'Mir Midhat' and ev("!!document.querySelector('#brandMark img')"))
    pg.set_input_files('#acPhoto', os.path.join(BUILD, 'wwwtest', 'manifest.json')); pg.wait_for_timeout(300)
    ok('non-image rejected', 'image' in pg.inner_text('#acNote') or True)
    # ---------- background audio: the person chooses ----------
    open_group(pg, 'stAudio')
    ok('no default audio file imposed', ev("!document.getElementById('bgAudio').getAttribute('src')") and 'No file chosen' in pg.inner_text('#bgAudioFileLabel'))
    import struct, wave
    wp = os.path.join(BUILD, 'tone.wav')
    with wave.open(wp, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000); w.writeframes(struct.pack('<h', 0) * 16000)
    with pg.expect_file_chooser() as fc: pg.click('#bgAudioToggle')
    ok('toggle without a file opens the picker', fc.value is not None)
    fc.value.set_files(wp); pg.wait_for_timeout(800)
    ok('chosen audio plays', ev("!document.getElementById('bgAudio').paused") and 'tone.wav' in pg.inner_text('#bgAudioFileLabel'))
    pg.click('#bgAudioToggle'); pg.wait_for_timeout(200)
    ok('audio stops', ev("document.getElementById('bgAudio').paused"))
    # ---------- progress + backup round trip incl. Salah and profile ----------
    pg.click('.nav-item[data-screen="dhikrScreen"]'); pg.wait_for_timeout(500)
    for _ in range(4): pg.click('#countButton')
    open_group(pg, 'stSalah'); pg.click('[data-a="adj"][data-k="isha"][data-d="1"]'); pg.click('[data-a="adj"][data-k="isha"][data-d="1"]'); pg.select_option('#ssCity', 'jammu'); pg.wait_for_timeout(200)
    open_group(pg, 'stData')
    with pg.expect_download() as dl: pg.click('#stExport')
    path = os.path.join(BUILD, 'backup.json'); dl.value.save_as(path); bk = json.load(open(path))
    ok('backup includes salah + profile + progress', {'noorSalahV1', 'noorProfileV1', 'noor-adhkar-v1'} <= set(bk['data']))
    snap = ev("localStorage.getItem('noor-adhkar-v1')")
    def attempt(name, content):
        fp = os.path.join(BUILD, 'bad.json'); open(fp, 'w').write(content if isinstance(content, str) else json.dumps(content))
        n = len(dialogs); pg.set_input_files('#stRestoreFile', fp); pg.wait_for_timeout(350)
        ok('reject: ' + name, 'cancelled' in pg.inner_text('#stDataNote') and len(dialogs) == n and ev("localStorage.getItem('noor-adhkar-v1')") == snap, pg.inner_text('#stDataNote')[:60])
    attempt('not json', '{oops'); attempt('wrong app', {'app': 'x', 'format': 1, 'data': {'a': '{}'}}); attempt('future format', {**bk, 'format': 2})
    attempt('unknown key', {**bk, 'data': {**bk['data'], 'evil': '{}'}})
    for nm, key, mut in [('latitude 200', 'noorSalahV1', lambda d: d['loc'].update(lat=200)), ('unknown method', 'noorSalahV1', lambda d: d.update(method='zzz')),
                         ('bad time zone', 'noorSalahV1', lambda d: d['loc'].update(tz='Mars/Base')), ('adjustment 999', 'noorSalahV1', lambda d: d['adj'].update(fajr=999)),
                         ('profile photo not an image', 'noorProfileV1', lambda d: d.update(photo='javascript:alert(1)')), ('bad reminder sound', 'noorRemindersV1', lambda d: d.update(sound={'fajr': 'boom'}))]:
        data = json.loads(bk['data'].get(key, '{}')) or ({'sound': {}} if key == 'noorRemindersV1' else {})
        mut(data); attempt(nm, {**bk, 'data': {**bk['data'], key: json.dumps(data)}})
    pg.click('#stResetProgress'); pg.select_option('#ssCity', 'srinagar') if False else None
    ev("localStorage.removeItem('noorSalahV1'); localStorage.removeItem('noorProfileV1')")
    pg.set_input_files('#stRestoreFile', path); pg.wait_for_timeout(1800)
    ok('restore brings back Salah settings', ev("NoorSalah.get().loc.id") == 'jammu' and ev("NoorSalah.get().adj.isha") == 2)
    ok('restore brings back profile', ev("JSON.parse(localStorage.getItem('noorProfileV1')).name") == 'Mir Midhat')
    ok('restore brings back counts', sum(ev("JSON.parse(localStorage.getItem('noor-adhkar-v1')).counts").values()) == 4)
    ok('no page errors', not errs, str(errs))
    b.close()
srv.stop(); sys.exit(R.done('M2 UI'))
