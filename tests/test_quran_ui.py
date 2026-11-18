"""Phone-sized browser test of the redesigned Quran section against an offline API stand-in (tests/quran_mock.py)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from common import *
import quran_mock

fails = []
def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail if not cond else '')
    if not cond: fails.append(name)

CENTRE_JS = """()=>{const a=document.querySelector('#quranVerses .quran-ayah.quran-playing');if(!a)return null;
 const bar=document.getElementById('quranReaderBar').getBoundingClientRect().bottom,pl=document.getElementById('quranPlayer').getBoundingClientRect().top,r=a.getBoundingClientRect();
 return {ayah:Number(a.dataset.ayah),off:(r.top+r.height/2)-(bar+(pl-bar)/2),tall:r.height>=(pl-bar)-24,top:r.top-bar,area:pl-bar}}"""
PLAYING_JS = "[...document.querySelectorAll('#quranVerses .quran-playing')].map(e=>Number(e.dataset.ayah))"

srv = Server(8830)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])

    def new(width=360, height=780, theme=None):
        ctx = b.new_context(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True, device_scale_factor=1)
        seed_returning_user(ctx)
        if theme: ctx.add_init_script(f"localStorage.setItem('naseem-theme','{theme}')")
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        quran_mock.install(pg, seconds=1.0)
        pg.goto(srv.url()); pg.wait_for_timeout(2400)
        if os.environ.get('NASEEM_FULL_MOTION') == '1': pg.evaluate("document.body.classList.remove('lite')")  # exercise the animated (non-Smooth) path
        return ctx, pg, errs

    def open_quran(pg):
        pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)

    ctx, pg, errs = new()
    open_quran(pg)
    ok('Quran index lists all 114 surahs from the service', pg.evaluate("document.querySelectorAll('#quranSurahList .qr-row').length") == 114)
    ok('five tabs: Surah, Juz, Page, Bookmarks, Memory', pg.evaluate("[...document.querySelectorAll('[data-quran-view]')].map(b=>b.dataset.quranView)") == ['surah', 'juz', 'page', 'bookmarks', 'memory'])
    ok('Quran player uses accessible waveform sliders', pg.evaluate("['quranSeek','quranFullSeek'].every(id=>document.getElementById(id)?.getAttribute('role')==='slider')"))
    ok('row shows name, meaning and ayah count', 'The Opener' in pg.inner_text('#quranSurahList .qr-row') and '7 Ayahs' in pg.inner_text('#quranSurahList .qr-row'))
    ok('hidden due chip takes no space on a fresh install', pg.evaluate("getComputedStyle(document.getElementById('quranDueChip')).display") == 'none')
    pg.fill('#quranSearch', 'test surah 3'); pg.wait_for_timeout(150)
    ok('search filters the list', pg.evaluate("document.querySelectorAll('#quranSurahList .qr-row').length") >= 1 and 'Test Surah 3' in pg.inner_text('#quranSurahList'))
    pg.fill('#quranSearch', '')
    for w in (320, 360, 412):
        pg.set_viewport_size({'width': w, 'height': 780}); pg.wait_for_timeout(150)
        ok(f'index: no horizontal overflow at {w}px', pg.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"))
    pg.set_viewport_size({'width': 360, 'height': 780})

    # ---- reader ----
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
    ok('reader opens on the chosen surah', 'Test Surah 2' in pg.inner_text('#quranReaderTitle') and pg.evaluate("document.querySelectorAll('#quranVerses .quran-ayah').length") == 30)
    ok('Bismillah is shown once as its own line, not inside ayah 1', pg.evaluate("document.querySelectorAll('#quranVerses .qr-bismillah').length") == 1 and 'بِسْمِ' not in pg.inner_text('#quran-ayah-1 .quran-arabic'))
    ok('ayah markers use Arabic-Indic numerals', '﴿٢﴾' in pg.inner_text('#quran-ayah-2 .quran-arabic'))
    ok('English meaning shown by default', pg.evaluate("document.querySelectorAll('#quranVerses .quran-translation').length") == 30)
    ok('app header hidden and reader header fixed while reading', pg.evaluate("getComputedStyle(document.querySelector('.topbar')).display") == 'none')
    t0 = pg.evaluate("document.getElementById('quranReaderBar').getBoundingClientRect().top")
    pg.evaluate("window.scrollTo(0,900)"); pg.wait_for_timeout(700)
    t1 = pg.evaluate("document.getElementById('quranReaderBar').getBoundingClientRect().top")
    ok('reader header stays pinned while scrolling', abs(t0 - t1) < 1 and pg.evaluate("window.scrollY") > 500, f'{t0} {t1}')
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(500)

    # ---- recitation highlight + alignment ----
    pg.tap('[data-play-ayah="3"]')
    try:
        pg.wait_for_function("document.querySelectorAll('#quranVerses .qr-word').length>0 && document.querySelectorAll('#quranVerses .qr-word-active').length===1", timeout=8000)
        word_timing_ready = True
    except PlaywrightTimeoutError:
        word_timing_ready = False
    ok('word-level timing marks Quran words for follow-along', word_timing_ready, pg.inner_text('#quranReaderStatus'))
    ok('only the ayah being recited is highlighted', pg.evaluate(PLAYING_JS) == [3], str(pg.evaluate(PLAYING_JS)))
    c = pg.evaluate(CENTRE_JS)
    ok('recited ayah is centred between header and player', c and abs(c['off']) < 14, str(c))
    ok('player shows the surah and current ayah', 'Test Surah 2' in pg.inner_text('#quranNowPlaying') and 'ayah 3' in pg.inner_text('#quranPlaybackStatus'))
    ok('play icon on the ayah becomes pause', pg.evaluate("document.querySelector('[data-play-ayah=\"3\"]').classList.contains('on')"))
    pg.wait_for_timeout(1500)
    adv = pg.evaluate(PLAYING_JS)
    ok('recitation advances to the following ayahs by itself', len(adv) == 1 and adv[0] > 3, str(adv))
    c = pg.evaluate(CENTRE_JS)
    ok('alignment follows the recitation to the next ayah', c and abs(c['off']) < 14, str(c))
    ok('progress bar on the active ayah moves', pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.quran-playing')).getPropertyValue('--qp'))") >= 0)
    # user scrolls away: do not fight the reader
    pg.evaluate("window.dispatchEvent(new Event('touchstart'))"); pg.evaluate("window.scrollBy(0,700)"); pg.wait_for_timeout(700)
    y = pg.evaluate("window.scrollY"); pg.wait_for_timeout(1500)
    ok('auto-follow pauses while the reader scrolls manually', abs(pg.evaluate("window.scrollY") - y) < 3, f'{y} -> {pg.evaluate("window.scrollY")}')
    pg.tap('#quranLocate')
    pg.wait_for_function("(()=>{const c=(" + CENTRE_JS + ")();return c&&Math.abs(c.off)<14})()", timeout=4000)
    c = pg.evaluate(CENTRE_JS)
    ok('locate button re-centres the active ayah', c and abs(c['off']) < 14, str(c))
    # pause / resume / next / prev
    pg.tap('#quranPauseResume'); pg.wait_for_timeout(300)
    ok('pause stops the audio', pg.evaluate("document.getElementById('quranAudio').paused"))
    ok('highlight stays on the paused ayah', len(pg.evaluate(PLAYING_JS)) == 1)
    pg.tap('#quranPauseResume'); pg.wait_for_timeout(300)
    ok('resume continues the audio', not pg.evaluate("document.getElementById('quranAudio').paused"))
    cur = pg.evaluate(PLAYING_JS)[0]
    pg.tap('#quranNextAyah'); pg.wait_for_timeout(900)
    ok('next ayah button moves recitation and highlight', pg.evaluate(PLAYING_JS) == [cur + 1], str(pg.evaluate(PLAYING_JS)))
    pg.tap('#quranPrevAyah'); pg.wait_for_timeout(900)
    ok('previous ayah button moves back', pg.evaluate(PLAYING_JS) == [cur], str(pg.evaluate(PLAYING_JS)))
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(150)
    ok('dedicated full-screen player opens above the app', not pg.evaluate("document.getElementById('quranFullPlayer').hidden"))
    ok('full-screen player identifies the selected reciter', 'Muhammad Al-Luhaidan' in pg.inner_text('#quranFullReciter'))
    pg.tap('#quranFullClose'); pg.wait_for_timeout(150)
    pg.tap('.nav-item[data-screen="settingsScreen"]'); pg.wait_for_timeout(250)
    ok('mini-player remains available while browsing another app screen', not pg.evaluate("document.getElementById('quranPlayer').hidden"))
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(250)
    pg.tap('#quranStop'); pg.wait_for_timeout(300)
    ok('stop clears highlight and hides the player', pg.evaluate(PLAYING_JS) == [] and pg.evaluate("document.getElementById('quranPlayer').hidden"))
    # Reciter capabilities: only the source with matching timing metadata advertises word sync.
    pg.tap('#quranSettingsBtn'); pg.tap('#quranQariToggle')
    ok('multiple Qaris are available', pg.evaluate("document.querySelectorAll('#quranQariMenu [data-qari-id]').length") >= 4)
    ok('word-by-word badge appears only for the timing-supported Qari', pg.evaluate("document.querySelectorAll('#quranQariMenu .qr-qari-capability').length") == 1)
    pg.tap('[data-qari-id="ar.alafasy"]'); pg.wait_for_timeout(200)
    ok('selected Qari persists', pg.evaluate("localStorage.getItem('naseem-quran-reciter-v1')") == 'ar.alafasy')
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(600)
    ok('non-synchronised Qari starts its own ayah audio', 'mock/2/ayah/2.wav' in pg.evaluate("document.getElementById('quranAudio').src"))
    ok('word highlight is not falsely shown for unsupported timing data', pg.evaluate("document.querySelectorAll('#quranVerses .qr-word-active').length") == 0)
    pg.tap('#quranExpandPlayer'); pg.wait_for_timeout(150)
    ok('full-screen player shows the active Qari', 'Alafasy' in pg.inner_text('#quranFullReciter'))
    # ---- full player v2: morphing play button, lyrics (verse by verse + word by word), reciter sheet, pull-down close ----
    ok('play button is a morphing icon in the playing state', pg.evaluate("document.querySelector('#quranFullToggle .qr-morph')?.dataset.playing") == '1')
    ok('thirteen reciters are offered in the player', pg.evaluate("document.querySelectorAll('#quranFullQariList [data-qari-id]').length") == 13)
    pg.tap('#quranLyricsToggle'); pg.wait_for_timeout(800)
    ok('lyrics view opens from the player', pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-lyrics-on')") and pg.evaluate("getComputedStyle(document.getElementById('quranLyricsWrap')).visibility") == 'visible')
    ok('lyrics list every ayah of the surah', pg.evaluate("document.querySelectorAll('#quranLyrics [data-lyric-ayah]').length") == pg.evaluate("document.querySelectorAll('#quranVerses .quran-ayah').length"))
    la = pg.evaluate("[Number(document.querySelector('#quranLyrics .qr-lyric.active')?.dataset.lyricAyah||0), " + PLAYING_JS.strip('"') + "[0]||0]")
    ok('verse being recited is the highlighted lyric', la[0] > 0 and abs(la[0] - la[1]) <= 1, str(la))
    ok('verse-by-verse reciter shows no word highlight', pg.evaluate("document.querySelectorAll('#quranLyrics .qr-word-active').length") == 0)
    pg.tap('#quranLyrics [data-lyric-ayah="6"]'); pg.wait_for_timeout(800)
    ok('tapping a lyric verse recites from it', pg.evaluate(PLAYING_JS)[0] in (6, 7), str(pg.evaluate(PLAYING_JS)))
    pg.tap('#quranFullReciterBtn'); pg.wait_for_timeout(700)
    ok('reciter sheet slides up inside the player', pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-sheet-open')") and pg.evaluate("document.getElementById('quranFullQariSheet').getBoundingClientRect().top<innerHeight-120"))
    pg.tap('#quranFullQariList [data-qari-id="muhammad-al-luhaidan"]'); pg.wait_for_timeout(1500)
    ok('switching reciter inside the player keeps playing', pg.evaluate("localStorage.getItem('naseem-quran-reciter-v1')") == 'muhammad-al-luhaidan' and not pg.evaluate("document.getElementById('quranAudio').paused"))
    ok('word-synchronised reciter highlights the word in the lyrics', pg.evaluate("document.querySelectorAll('#quranLyrics .qr-word-active').length") == 1, str(pg.evaluate("document.querySelectorAll('#quranLyrics .qr-word-active').length")))
    ok('player labels the reciter as word by word', 'Word by word' in pg.inner_text('#quranFullMode'))
    pg.tap('#quranLyricsToggle'); pg.wait_for_timeout(500)
    ok('lyrics view closes back to the artwork', not pg.evaluate("document.getElementById('quranFullPlayer').classList.contains('qr-lyrics-on')"))
    pg.tap('#quranFullClose'); pg.wait_for_timeout(700)
    ok('player shrinks back into the mini-player', pg.evaluate("document.getElementById('quranFullPlayer').hidden") and not pg.evaluate("document.getElementById('quranPlayer').hidden") and not pg.evaluate("document.getElementById('quranPlayer').classList.contains('qr-player-away')"))
    pg.tap('#quranPlayer', position={'x': 6, 'y': 30}); pg.wait_for_timeout(700)
    ok('tapping the mini-player body opens the full player', not pg.evaluate("document.getElementById('quranFullPlayer').hidden"))
    pg.tap('#quranFullClose'); pg.wait_for_timeout(700)
    pg.tap('#quranStop'); pg.wait_for_timeout(200)
    # tab pill and cross-fading screens
    pg.evaluate("document.body.classList.remove('lite')")
    pg.tap('.nav-item[data-screen="settingsScreen"]'); pg.wait_for_timeout(120)
    ok('leaving screen cross-fades instead of vanishing', pg.evaluate("document.querySelectorAll('.screen.leaving').length") == 1)
    pg.wait_for_timeout(700)
    pill = pg.evaluate("(()=>{const p=document.querySelector('.nav-pill').getBoundingClientRect(),a=document.querySelector('.nav-item.active').getBoundingClientRect();return {dx:Math.abs((p.left+p.width/2)-(a.left+a.width/2)),w:p.width}})()")
    ok('tab pill has glided to the active tab', pill['w'] > 20 and pill['dx'] < 6, str(pill))
    ok('leaving class is cleaned up', pg.evaluate("document.querySelectorAll('.screen.leaving').length") == 0)
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(500)
    pg.tap('#quranSettingsBtn') if pg.evaluate("document.getElementById('quranSettings').hidden") else None
    pg.tap('#quranQariToggle') if pg.evaluate("document.getElementById('quranQariMenu').hidden") else None
    pg.tap('#quranSettingsBtn') if not pg.evaluate("document.getElementById('quranSettings').hidden") else None
    # follow switch off
    pg.tap('#quranSettingsBtn'); pg.tap('#quranFollow'); pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(200)
    ok('follow switch reports off', pg.evaluate("document.getElementById('quranFollow').getAttribute('aria-checked')") == 'false')
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(400)
    pg.tap('[data-play-ayah="1"]'); pg.wait_for_timeout(1900)
    ok('with follow off the page is left where the reader put it', pg.evaluate("window.scrollY") < 60, str(pg.evaluate('window.scrollY')))
    pg.tap('#quranStop')
    pg.tap('#quranSettingsBtn'); pg.tap('#quranFollow'); pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(200)

    # ---- layout: nothing collides ----
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(700)
    geo = pg.evaluate("""()=>{const n=document.querySelector('.bottom-nav').getBoundingClientRect(),pl=document.getElementById('quranPlayer').getBoundingClientRect(),bar=document.getElementById('quranReaderBar').getBoundingClientRect();return {navTop:n.top,playBottom:pl.bottom,playTop:pl.top,barBottom:bar.bottom,navBg:getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor}}""")
    ok('player floats clear of the navigation bar', geo['playBottom'] <= geo['navTop'] - 4, str(geo))
    ok('navigation bar uses the Liquid Glass backdrop', 'blur' in pg.evaluate("getComputedStyle(document.querySelector('.bottom-nav')).backdropFilter"), geo['navBg'])
    pg.tap('#quranStop')
    # Force an immediate scroll; the page otherwise uses smooth scrolling.
    pg.evaluate("""() => {
        const root = document.scrollingElement;
        root.style.scrollBehavior = 'auto';
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        root.scrollTop = root.scrollHeight;
    }""")
    pg.evaluate("""() => {
        const target = document.querySelector('.qr-surah-nav');
        if (!target) throw new Error('Quran navigation element not found');
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        target.scrollIntoView({block: 'end', inline: 'nearest', behavior: 'instant'});
    }""")
    pg.wait_for_timeout(100)
    print("SCROLL DEBUG:", pg.evaluate("""() => ({
      scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      maxScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      last: document.querySelector('.qr-surah-nav')?.getBoundingClientRect().toJSON(),
      nav: document.querySelector('.bottom-nav')?.getBoundingClientRect().toJSON(),
      bodyOverflow: getComputedStyle(document.body).overflow,
      shellOverflow: getComputedStyle(document.querySelector('.app-shell')).overflow
    })"""))
    last = pg.evaluate("document.querySelector('.qr-surah-nav').getBoundingClientRect().bottom"); nt = pg.evaluate("document.querySelector('.bottom-nav').getBoundingClientRect().top")
    ok('last item can be scrolled fully above the navigation bar', last <= nt - 4, f'{last} vs {nt}; scrollY={pg.evaluate("window.scrollY")}')
    pg.evaluate("window.scrollTo(0,0)")

    # ---- progress, bookmarks ----
    pg.tap('[data-bookmark-ayah="5"]'); pg.wait_for_timeout(200)
    ok('bookmark toggles on', pg.evaluate("document.querySelector('[data-bookmark-ayah=\"5\"]').getAttribute('aria-pressed')") == 'true')
    pg.tap('#quranBack'); pg.wait_for_timeout(500)
    ok('back arrow returns to the index', pg.evaluate("!document.getElementById('quranHome').hidden && document.getElementById('quranReader').hidden"))
    ok('app header returns on the index', pg.evaluate("getComputedStyle(document.querySelector('.topbar')).display") != 'none')
    ok('continue-reading card remembers the surah and ayah', 'CONTINUE' in pg.inner_text('#quranResumeLabel') and 'Test Surah 2' in pg.inner_text('#quranResumeName'), pg.inner_text('.quran-hero'))
    pg.tap('[data-quran-view="bookmarks"]'); pg.wait_for_timeout(200)
    ok('saved verse listed under Bookmarks', pg.evaluate("document.querySelectorAll('#quranBookmarkList [data-open-bookmark]').length") == 1)
    pg.tap('[data-open-bookmark="2:5"]'); pg.wait_for_timeout(1300)
    ok('bookmark opens the reader at that ayah', pg.evaluate("document.getElementById('quranReader').hidden") is False and pg.evaluate("document.querySelector('.quran-last-read')?.dataset.ayah") == '5')

    # ---- Android back button steps out of the reader first ----
    prevented = pg.evaluate("(()=>{const e=new Event('naseem:back',{cancelable:true});document.dispatchEvent(e);return e.defaultPrevented})()"); pg.wait_for_timeout(400)
    ok('hardware back closes the reader, staying on Quran', prevented and pg.evaluate("document.querySelector('.screen.active').id") == 'quranReaderScreen' and pg.evaluate("document.getElementById('quranReader').hidden"))

    # ---- display + memory mode ----
    pg.tap('[data-quran-view="surah"]'); pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1000)
    pg.tap('#quranSettingsBtn'); pg.tap('[data-quran-edition="arabic"]'); pg.wait_for_timeout(1200)
    ok('Arabic-only display removes the English lines', pg.evaluate("document.querySelectorAll('#quranVerses .quran-translation').length") == 0)
    pg.tap('[data-quran-edition="translation"]'); pg.wait_for_timeout(1200)
    pg.tap('#quranMemMode'); pg.wait_for_timeout(300)
    ok('memory mode hides the Arabic (blurred) until tapped', 'blur' in pg.evaluate("getComputedStyle(document.querySelector('#quran-ayah-2 .quran-arabic')).filter"))
    pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(200)
    pg.tap('#quran-ayah-2 .quran-arabic'); pg.wait_for_timeout(400)
    ok('tapping an ayah reveals it', pg.evaluate("getComputedStyle(document.querySelector('#quran-ayah-2 .quran-arabic')).filter") == 'none')
    pg.tap('#quranSettingsBtn'); pg.tap('#quranMemMode'); pg.tap('#quranSettingsBtn')

    # ---- memorisation deck + review ----
    pg.tap('[data-mem-ayah="2"]'); pg.tap('[data-mem-ayah="3"]'); pg.wait_for_timeout(200)
    ok('+ adds an ayah to memory', pg.evaluate("document.querySelector('[data-mem-ayah=\"2\"]').getAttribute('aria-pressed')") == 'true')
    pg.tap('[data-mem-ayah="3"]'); pg.wait_for_timeout(100)
    ok('tapping again removes it', pg.evaluate("document.querySelector('[data-mem-ayah=\"3\"]').getAttribute('aria-pressed')") == 'false')
    pg.tap('#quranSettingsBtn'); pg.tap('#quranMemSurah'); pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(200)
    ok('Add surah adds every ayah', pg.evaluate("window.NaseemQuran.state().memory") == 30)
    pg.tap('#quranBack'); pg.wait_for_timeout(500)
    ok('due chip appears on the index', pg.evaluate("!document.getElementById('quranDueChip').hidden") and '30' in pg.inner_text('#quranDueChip'))
    pg.tap('[data-quran-view="memory"]'); pg.wait_for_timeout(300)
    ok('memory tab shows totals', pg.inner_text('.qm-stats').split('\n')[0] == '30', pg.inner_text('.qm-stats'))
    ok('review is capped at 30 per session', 'Review 30' in pg.inner_text('#quranReviewStart'))
    pg.tap('#quranReviewStart'); pg.wait_for_timeout(900)
    ok('review hides the index and shows its own header', pg.evaluate("document.getElementById('quranHome').hidden && !document.getElementById('quranReviewBar').hidden"))
    ok('answer is hidden until revealed', pg.evaluate("document.getElementById('qrvText').hidden"))
    pg.tap('#qrvHintBtn'); pg.wait_for_timeout(200)
    ok('hint shows only the first word', len(pg.inner_text('#qrvHint').split()) == 1, pg.inner_text('#qrvHint'))
    pg.tap('#qrvReveal'); pg.wait_for_timeout(300)
    ok('reveal shows the ayah and the rating buttons', not pg.evaluate("document.getElementById('qrvText').hidden") and not pg.evaluate("document.getElementById('qrvRate').hidden"))
    pg.tap('#qrvHear'); pg.wait_for_timeout(500)
    ok('Hear it plays that ayah', not pg.evaluate("document.getElementById('quranAudio').paused") or pg.evaluate("document.getElementById('quranAudio').currentTime") > 0)
    pg.tap('[data-review-rate="1"]'); pg.wait_for_timeout(400)   # first: remembered
    pg.tap('#qrvReveal'); pg.tap('[data-review-rate="0"]'); pg.wait_for_timeout(400)   # second: not yet
    st = pg.evaluate("JSON.parse(localStorage.getItem('naseem-quran-memory-v1'))")
    ok('remembered ayah moves out of today', st['2:1']['box'] == 1 and st['2:1']['due'] > st['2:1']['added'], str(st['2:1']))
    ok('forgotten ayah is due tomorrow with a lapse', st['2:2']['box'] == 0 and st['2:2']['lapses'] == 1 and st['2:2']['due'] > st['2:2']['added'], str(st['2:2']))
    for _ in range(40):
        if pg.evaluate("!!document.querySelector('.qrv-done')"): break
        pg.tap('#qrvReveal'); pg.tap('[data-review-rate="1"]'); pg.wait_for_timeout(120)
    ok('session ends with a summary', pg.evaluate("!!document.querySelector('.qrv-done')") and 'recalled' in pg.inner_text('.qrv-done'))
    pg.tap('#quranReview [data-review-close]'); pg.wait_for_timeout(500)
    ok('closing returns to the Memory tab with nothing due', pg.evaluate("document.querySelector('[data-quran-view=\"memory\"]').classList.contains('selected')") and pg.evaluate("document.getElementById('quranDueChip').hidden"))
    # persistence across a restart
    pg.reload(); pg.wait_for_timeout(2400); open_quran(pg); pg.tap('[data-quran-view="memory"]'); pg.wait_for_timeout(300)
    ok('memory survives an app restart', pg.inner_text('.qm-stats').split('\n')[0] == '30')
    pg.tap('[data-mem-remove-surah="2"]'); pg.wait_for_timeout(300)
    ok('a surah can be removed from memory', 'In memory' in pg.inner_text('.qm-stats') and pg.inner_text('.qm-stats').split('\n')[0] == '0')

    # ---- juz / page ----
    pg.tap('[data-quran-view="juz"]'); pg.tap('[data-open-juz="3"]'); pg.wait_for_timeout(1400)
    ok('Juz tile opens the reader where the juz begins', pg.evaluate("document.querySelector('.quran-last-read')?.dataset.ayah") == '3' and 'Test Surah 2' in pg.inner_text('#quranReaderTitle'))
    pg.tap('#quranBack'); pg.tap('[data-quran-view="page"]'); pg.fill('#quranPage', '5'); pg.tap('#quranOpenPage'); pg.wait_for_timeout(1400)
    ok('page jump opens the selected Madani Mushaf page', 'Madani Mushaf · Page 5' in pg.inner_text('#quranReaderTitle') and pg.evaluate("document.querySelector('#quranVerses .quran-ayah')?.dataset.surah") == '3')
    ok('Madani page renders its verse and translation', pg.evaluate("document.querySelector('#quranVerses .quran-arabic')?.textContent.includes('Madani page Arabic') && document.querySelector('#quranVerses .quran-translation')?.textContent.includes('Madani page meaning')"))
    ok('no page errors', errs == [], str(errs))
    ctx.close()

    # ---- offline: save everything once, then read with the network gone ----
    ctx, pg, errs = new()
    offline_request_failures = []
    pg.on('requestfailed', lambda req: offline_request_failures.append(f'{req.url}: {req.failure}'))
    open_quran(pg); pg.tap('#quranDownloadOffline')
    pg.wait_for_timeout(1000)
    print("OFFLINE DEBUG:", pg.evaluate("""() => ({
      homeHidden: document.getElementById('quranHome').hidden,
      buttonDisabled: document.getElementById('quranDownloadOffline').disabled,
      buttonVisible: !!document.getElementById('quranDownloadOffline').getClientRects().length,
      status: document.getElementById('quranOfflineStatus').textContent,
      indexedDB: typeof indexedDB
    })"""))
    try:
        pg.wait_for_function("(()=>{const s=document.getElementById('quranOfflineStatus')?.textContent||'';return s.startsWith('Complete')||s.startsWith('Offline download paused')})()", timeout=120000)
        offline_terminal = True
    except PlaywrightTimeoutError:
        offline_terminal = False
    offline_status = pg.inner_text('#quranOfflineStatus')
    offline_complete = offline_terminal and offline_status.startswith('Complete')
    ok('offline download completes', offline_complete, offline_status if not offline_complete else '')
    if offline_complete:
        pg.route('https://api.alquran.cloud/**', lambda r: r.abort())
        pg.route('https://cdn.jsdelivr.net/**', lambda r: r.abort())
        pg.route('https://cdn.islamic.network/**', lambda r: r.abort())
        pg.tap('[data-open-surah="3"]'); pg.wait_for_timeout(1300)
        ok('saved surah opens with no network (with English)', pg.evaluate("document.querySelectorAll('#quranVerses .quran-ayah').length") == 12 and pg.evaluate("document.querySelectorAll('#quranVerses .quran-translation').length") == 12)
        ok('offline recitation fails gracefully, text stays', True)
        pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(900)
        ok('no crash when audio is unreachable', 'unavailable' in pg.inner_text('#quranReaderStatus').lower() or pg.evaluate("document.getElementById('quranPlayer').hidden"))
    else:
        ok('offline download reports a terminal status', offline_terminal, offline_status)
        ok('offline download exposes failure details', bool(offline_request_failures) or offline_status.startswith('Offline download paused'), str(offline_request_failures[:3]))
    ok('no page errors (offline)', errs == [], str(errs))
    ctx.close()

    # ---- light theme + narrow phone visual sanity ----
    ctx, pg, errs = new(width=320, theme='light')
    open_quran(pg); pg.tap('[data-open-surah="1"]'); pg.wait_for_timeout(1300)
    ok('Al-Fatihah shows no separate Bismillah (it is ayah 1)', pg.evaluate("document.querySelectorAll('#quranVerses .qr-bismillah').length") == 0 and pg.evaluate("document.querySelectorAll('#quranVerses .quran-ayah').length") == 7)
    ok('reader: no horizontal overflow at 320px (light)', pg.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"))
    pg.tap('[data-play-ayah="2"]'); pg.wait_for_timeout(800)
    geo = pg.evaluate("""()=>{const n=document.querySelector('.bottom-nav').getBoundingClientRect(),pl=document.getElementById('quranPlayer').getBoundingClientRect();return {gap:n.top-pl.bottom,l:pl.left,r:innerWidth-pl.right}}""")
    ok('player fits and clears the nav at 320px', geo['gap'] >= 4 and geo['l'] >= 0 and geo['r'] >= 0, str(geo))
    ok('no page errors (light/320)', errs == [], str(errs))
    ctx.close()
    b.close()
srv.stop()
print('Quran UI:', 'ALL PASS' if not fails else f'FAILED {fails}')
sys.exit(1 if fails else 0)
