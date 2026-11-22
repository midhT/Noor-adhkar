"""Background hand-off + resume point, with a stand-in for the native plugin (real MediaPlayer can only run in the app)."""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

STUB = """
window.__ho = []; window.__rc = 0; window.__reply = {active:true,index:0,positionMs:0,playing:true,ended:false,reason:''};
window.NoorNative = window.NoorNative || {};
window.NoorNative.media = {
  update: () => Promise.resolve(true), stop: () => Promise.resolve(true), onAction: () => null,
  handoff: a => { window.__ho.push(a); return Promise.resolve(true); },
  reclaim: () => { window.__rc++; return Promise.resolve(window.__reply); }
};
window.__hide = v => { Object.defineProperty(document,'hidden',{configurable:true,get:()=>v}); document.dispatchEvent(new Event('visibilitychange')); };
"""
AUDIO = "document.getElementById('quranAudio')"
AYAH = "[...document.querySelectorAll('#quranVerses .quran-playing')].map(e=>Number(e.dataset.ayah))"

srv = Server(8864)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True, device_scale_factor=1)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=20.0)
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.evaluate(STUB)
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
    pg.tap('[data-play-ayah="3"]'); pg.wait_for_timeout(1200)
    ok('playing before hide', not pg.evaluate(AUDIO + ".paused"))

    pg.evaluate("window.__hide(true)"); pg.wait_for_timeout(1200)
    ho = pg.evaluate("window.__ho")
    ok('hiding the app hands the recitation to the native player', len(ho) == 1, str(ho))
    a = ho[0] if ho else {}
    ok('hand-off carries the audio, start index and position', bool(a.get('urls')) and a.get('index') == 0 and a.get('positionMs', -1) >= 0, str(a))
    try: pg.wait_for_function(AUDIO + ".paused", timeout=4000)
    except Exception: pass
    ok('web audio is paused after hand-off (no double playback)', pg.evaluate(AUDIO + ".paused"))
    ok('resume point saved', pg.evaluate("JSON.parse(localStorage.getItem('naseemQuranResumeV1')||'null')") is not None)

    # back in front: native had moved on two files
    pos = 3200
    pg.evaluate("window.__reply = {active:true,index:2,positionMs:%d,playing:true,ended:false,reason:''}" % pos)
    pg.evaluate("window.__hide(false)"); pg.wait_for_timeout(1500)
    ok('showing the app reclaims native playback', pg.evaluate("window.__rc") == 1)
    ok('web player continues from the native ayah', pg.evaluate(AYAH) == [5], str(pg.evaluate(AYAH)))
    ok('web audio resumed and at the native position', (not pg.evaluate(AUDIO + ".paused")) and pg.evaluate(AUDIO + ".currentTime") >= 3.0, str(pg.evaluate(AUDIO + ".currentTime")))

    # paused in background stays paused
    pg.evaluate("window.__hide(true)"); pg.wait_for_timeout(400)
    pg.evaluate("window.__reply = {active:true,index:0,positionMs:1000,playing:false,ended:false,reason:''}")
    pg.evaluate("window.__hide(false)"); pg.wait_for_timeout(1200)
    ok('paused from the notification stays paused on return', pg.evaluate(AUDIO + ".paused"))

    # nothing playing: hiding does not hand off
    n = len(pg.evaluate("window.__ho"))
    pg.evaluate("window.__hide(true)"); pg.wait_for_timeout(300); pg.evaluate("window.__hide(false)"); pg.wait_for_timeout(300)
    ok('paused player is not handed off', len(pg.evaluate("window.__ho")) == n)

    # sleep timer ended natively
    pg.evaluate("document.getElementById('quranPauseResume').click()"); pg.wait_for_timeout(600)
    pg.evaluate("window.__hide(true)"); pg.wait_for_timeout(400)
    pg.evaluate("window.__reply = {active:true,index:0,positionMs:2000,playing:false,ended:true,reason:'sleep'}")
    pg.evaluate("window.__hide(false)"); pg.wait_for_timeout(1000)
    ok('sleep finished in background leaves the player paused', pg.evaluate(AUDIO + ".paused"))

    # resume point survives a restart
    pg.tap('[data-play-ayah="4"]'); pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('quranAudio').pause()"); pg.wait_for_timeout(300)
    rp = pg.evaluate("JSON.parse(localStorage.getItem('naseemQuranResumeV1'))")
    ok('resume point has surah, ayah and time', rp and rp['surah'] == 2 and rp['ayah'] >= 4 and rp['timeMs'] > 0, str(rp))
    pg.reload(); pg.wait_for_timeout(5200)
    ok('after restart the player is restored paused', pg.evaluate("!document.getElementById('quranPlayer').hidden") and pg.evaluate(AUDIO + ".paused"))
    pg.evaluate("document.getElementById('quranPauseResume').click()"); pg.wait_for_timeout(900)
    ok('play resumes the saved ayah', not pg.evaluate(AUDIO + ".paused"))

    # explicit stop forgets it
    pg.evaluate("document.getElementById('quranStop').click()"); pg.wait_for_timeout(300)
    ok('stop clears the resume point', pg.evaluate("localStorage.getItem('naseemQuranResumeV1')") is None)
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Background handoff UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
