"""Browser test: the player's sleep timer is wired to real playback (end of ayah, end of surah, minutes, cancel)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

srv = Server(8861)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])

    def new():
        ctx = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True, device_scale_factor=1)
        seed_returning_user(ctx)
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        quran_mock.install(pg, seconds=1.0)
        pg.goto(srv.url()); pg.wait_for_timeout(2400)
        pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
        pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
        # default reciter (Al-Luhaidan): one audio file per surah with word timings, the app's word-sync path
        return ctx, pg, errs

    def open_sheet(pg):
        pg.tap('#quranSleepBtn'); pg.wait_for_timeout(700)

    def choose(pg, sid):
        pg.tap(f'#quranSleepList [data-sleep="{sid}"]'); pg.wait_for_timeout(700)

    HOLD = "document.getElementById('quranAudio').pause()"
    RESUME = "document.getElementById('quranAudio').play()"
    AUDIO_PAUSED = "document.getElementById('quranAudio').paused"
    AYAH = "[...document.querySelectorAll('#quranVerses .quran-playing')].map(e=>Number(e.dataset.ayah))"

    # ---- end of this ayah ----
    ctx, pg, errs = new()
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(400)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(500)
    ok('sleep button is in the full player', pg.evaluate("!!document.getElementById('quranSleepBtn')"))
    ok('sleep button starts as plain "Sleep"', pg.inner_text('#quranSleepLabel').strip() == 'Sleep')
    pg.evaluate(HOLD)
    open_sheet(pg)
    ok('sheet lists every option from the player core', pg.evaluate("document.querySelectorAll('#quranSleepList [data-sleep]').length") == pg.evaluate("window.NaseemPlayerCore.SLEEP_OPTIONS.length"))
    choose(pg, 'ayah')
    ok('sheet closes after choosing', not pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-sleep-open')"))
    ok('button shows the active timer', pg.evaluate("document.getElementById('quranSleepBtn').classList.contains('on')") and 'ayah' in pg.inner_text('#quranSleepLabel').lower(), pg.inner_text('#quranSleepLabel'))
    pg.evaluate(RESUME)
    pg.wait_for_timeout(2600)  # ayah 2 ends 1s after it starts; ayah 3 must NOT start
    ok('recitation stopped at the end of the ayah', pg.evaluate(AUDIO_PAUSED) and pg.evaluate(AYAH) == [], str(pg.evaluate(AYAH)))
    ok('timer cleared after firing', pg.inner_text('#quranSleepLabel').strip() == 'Sleep' and not pg.evaluate("document.getElementById('quranSleepBtn').classList.contains('on')"))
    ok('no page errors (ayah timer)', errs == [], str(errs))
    ctx.close()

    # ---- control: without a timer playback continues to the next ayah ----
    ctx, pg, errs = new()
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(2300)
    ok('without a timer playback moves on to the next ayah', (not pg.evaluate(AUDIO_PAUSED)) and pg.evaluate(AYAH) not in ([], [2]), str(pg.evaluate(AYAH)))
    ctx.close()

    # ---- minutes: counts down, fires, fades out; cancel works ----
    ctx, pg, errs = new()
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(300)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(500)
    open_sheet(pg); choose(pg, '5')
    lbl = pg.inner_text('#quranSleepLabel')
    ok('5 minute timer shows a countdown', ':' in lbl or 'min' in lbl.lower(), lbl)
    open_sheet(pg); choose(pg, 'off')
    ok('Off cancels the timer', pg.inner_text('#quranSleepLabel').strip() == 'Sleep')
    open_sheet(pg); choose(pg, '5')
    pg.evaluate("(()=>{const real=Date.now.bind(Date);Date.now=()=>real()+6*60000})()")  # jump the clock past the 5 minutes
    pg.wait_for_timeout(1500)
    pg.wait_for_timeout(3600)  # fade-out is ~3s
    ok('minute timer pauses playback after fading out', pg.evaluate(AUDIO_PAUSED))
    ok('volume is restored after the fade', pg.evaluate("document.getElementById('quranAudio').volume") == 1)
    ok('status explains why it stopped', 'sleep timer' in pg.inner_text('#quranFullStatus').lower() or 'sleep timer' in pg.inner_text('#quranPlaybackStatus').lower())
    ok('no page errors (minute timer)', errs == [], str(errs))
    ctx.close()

    # ---- end of surah: does not stop at ayah boundaries ----
    ctx, pg, errs = new()
    pg.tap('[data-play-ayah="29"]'); pg.wait_for_timeout(300)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(500)
    pg.evaluate(HOLD)
    open_sheet(pg); choose(pg, 'surah')
    pg.evaluate(RESUME)
    pg.wait_for_timeout(1300)
    ok('end-of-surah timer lets the next ayah play', (not pg.evaluate(AUDIO_PAUSED)) and pg.evaluate(AYAH) == [30], str(pg.evaluate(AYAH)))
    pg.wait_for_timeout(1700)
    ok('end-of-surah timer stops after the last ayah instead of starting the next surah', pg.evaluate(AUDIO_PAUSED) and 'Test Surah 3' not in pg.inner_text('#quranNowPlaying'), pg.inner_text('#quranNowPlaying'))
    ctx.close()


    # ---- other reciters: one file per ayah (the 'ended' path) ----
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True, device_scale_factor=1)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=1.0)
    short = quran_mock.tone_wav(1.0)
    pg.route('https://cdn.islamic.network/mock/*/ayah/*.wav', lambda r: r.fulfill(status=200, content_type='audio/wav', headers={'Access-Control-Allow-Origin': '*', 'Content-Length': str(len(short))}, body=short))
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
    pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(150); pg.tap('#quranQariToggle'); pg.wait_for_timeout(200)
    pg.tap('#quranQariMenu [data-qari-id="ar.alafasy"]'); pg.wait_for_timeout(200); pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(150)
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(300)
    pg.evaluate("window.__a=document.getElementById('quranAudio')")
    ok('per-ayah reciter plays a separate file for each ayah', 'ayah/2.wav' in pg.evaluate("window.__a.src"))
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(500)
    pg.evaluate(HOLD); open_sheet(pg); choose(pg, 'ayah'); pg.evaluate(RESUME)
    pg.wait_for_timeout(2300)
    ok('per-ayah reciter: timer stops after the ayah and does not load the next file', pg.evaluate(AUDIO_PAUSED) and 'ayah/3.wav' not in pg.evaluate("window.__a.src"), pg.evaluate("window.__a.src"))
    ok('no page errors (per-ayah)', errs == [], str(errs))
    ctx.close()
    b.close()
srv.stop()
print('Sleep timer UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
