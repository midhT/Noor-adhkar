"""Browser test of the player <-> native media session bridge, using a stand-in for window.NoorNative.media
(the real plugin only exists inside the Android app; see tests/test_android_patch.mjs for the manifest/registration checks)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

STUB = """
window.__mu = []; window.__stops = 0; window.__cb = null;
window.NoorNative = window.NoorNative || {};
window.NoorNative.media = {
  update: i => { window.__mu.push(Object.assign({t: Date.now()}, i)); return Promise.resolve(true); },
  stop: () => { window.__stops++; return Promise.resolve(true); },
  onAction: cb => { window.__cb = cb; return null; }
};
"""
LAST = "window.__mu[window.__mu.length-1]"
AUDIO_PAUSED = "document.getElementById('quranAudio').paused"
AYAH = "[...document.querySelectorAll('#quranVerses .quran-playing')].map(e=>Number(e.dataset.ayah))"

srv = Server(8863)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True, device_scale_factor=1)
    seed_returning_user(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=1.0)
    pg.goto(srv.url()); pg.wait_for_timeout(2400)
    pg.evaluate(STUB)
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)

    ok('browser build: nothing is sent before playback', pg.evaluate("window.__mu.length") == 0)
    pg.tap('[data-play-ayah="3"]'); pg.wait_for_timeout(900)
    ok('playback pushes metadata to the media session', pg.evaluate("window.__mu.length") >= 1)
    last = pg.evaluate(LAST)
    ok('notification title is the surah', last['title'].startswith('2. ') and 'Test Surah 2' in last['title'], str(last))
    ok('notification subtitle has ayah and reciter', 'Ayah 3' in last['artist'] and 'Luhaidan' in last['artist'], str(last))
    ok('state is playing with a duration', last['playing'] is True and last['durationMs'] > 0, str(last))
    ok('player registered for notification / lock-screen buttons', pg.evaluate("typeof window.__cb") == 'function')

    # ---- buttons from the notification / lock screen ----
    pg.evaluate("window.__cb({action:'pause'})"); pg.wait_for_timeout(300)
    ok('pause button pauses recitation', pg.evaluate(AUDIO_PAUSED))
    ok('paused state is reported back', pg.evaluate(LAST)['playing'] is False)
    pg.evaluate("window.__cb({action:'play'})"); pg.wait_for_timeout(500)
    ok('play button resumes recitation', not pg.evaluate(AUDIO_PAUSED))
    before = pg.evaluate(AYAH)
    pg.evaluate("window.__cb({action:'next'})"); pg.wait_for_timeout(700)
    ok('next button moves to the next ayah', pg.evaluate(AYAH) == [before[0] + 1], f'{before} -> {pg.evaluate(AYAH)}')
    ok('new ayah is reported', f"Ayah {before[0] + 1}" in pg.evaluate(LAST)['artist'], pg.evaluate(LAST)['artist'])
    pg.evaluate("window.__cb({action:'prev'})"); pg.wait_for_timeout(700)
    ok('previous button moves back', pg.evaluate(AYAH) == before, str(pg.evaluate(AYAH)))
    pg.evaluate("window.__cb({action:'seek',positionMs:9000})"); pg.wait_for_timeout(500)
    ok('seek from the lock screen moves the audio', pg.evaluate("document.getElementById('quranAudio').currentTime") >= 8.5)

    # ---- natural ayah progression keeps the notification current ----
    pg.evaluate("window.__mu.length=0")
    pg.tap('[data-play-ayah="5"]'); pg.wait_for_timeout(2600)
    ok('notification follows the recited ayah', any('Ayah 6' in m['artist'] or 'Ayah 7' in m['artist'] for m in pg.evaluate("window.__mu")), str([m['artist'] for m in pg.evaluate('window.__mu')]))

    # ---- sleep timer shares the media session ----
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(500)
    pg.evaluate("document.getElementById('quranAudio').pause()")
    pg.tap('#quranSleepBtn'); pg.wait_for_timeout(600); pg.tap('#quranSleepList [data-sleep="ayah"]'); pg.wait_for_timeout(600)
    pg.evaluate("document.getElementById('quranAudio').play()"); pg.wait_for_timeout(2600)
    ok('sleep timer pause reaches the notification', pg.evaluate(AUDIO_PAUSED) is True and pg.evaluate("window.__stops") >= 1 or pg.evaluate(LAST)['playing'] is False)

    # ---- explicit stop closes the media session immediately ----
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(600)
    stops0 = pg.evaluate("window.__stops")
    pg.evaluate("window.__cb({action:'stop'})"); pg.wait_for_timeout(300)
    ok('stop button stops playback and the service', pg.evaluate("document.getElementById('quranPlayer').hidden") and pg.evaluate("window.__stops") == stops0 + 1)

    # ---- auto-continue: no service teardown between surahs, timed sleep timer survives ----
    pg.tap('[data-play-ayah="29"]'); pg.wait_for_timeout(500)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(500)
    pg.evaluate("document.getElementById('quranAudio').pause()")
    pg.tap('#quranSleepBtn'); pg.wait_for_timeout(600); pg.tap('#quranSleepList [data-sleep="60"]'); pg.wait_for_timeout(600)
    stops1 = pg.evaluate("window.__stops")
    pg.evaluate("document.getElementById('quranAudio').play()"); pg.wait_for_timeout(4200)  # ayah 29, 30 then surah 3 starts
    nowp = pg.inner_text('#quranNowPlaying')
    ok('playback continued into the next surah', 'Test Surah 3' in nowp, nowp)
    ok('media service was not stopped between surahs', pg.evaluate("window.__stops") == stops1)
    ok('notification shows the new surah', pg.evaluate(LAST)['title'].startswith('3. '), pg.evaluate(LAST)['title'])
    ok('a 1 hour sleep timer survives the surah change', pg.evaluate("document.getElementById('quranSleepBtn').classList.contains('on')"))
    ok('no page errors', errs == [], str(errs))
    ctx.close(); b.close()
srv.stop()
print('Media bridge UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
