"""Quran Studio: layout switch, reading-settings sheet, translations (English + Urdu), Tajweed, reciters, back button. Quran.com is a stand-in."""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock
R = Results()
H = {'Access-Control-Allow-Origin': '*'}
def qc(route):
    from urllib.parse import unquote; u = unquote(route.request.url)
    def j(o): route.fulfill(status=200, content_type='application/json', headers=H, body=json.dumps(o))
    if '/resources/translations' in u: return j({'translations': [
        {'id': 22, 'name': 'Marmaduke Pickthall', 'author_name': 'Pickthall', 'language_name': 'english'},
        {'id': 20, 'name': 'Saheeh International', 'author_name': 'x', 'language_name': 'english'},
        {'id': 54, 'name': 'Maulana Muhammad Junagarhi', 'author_name': 'Junagarhi', 'language_name': 'urdu'}]})
    if '/resources/tafsirs' in u: return j({'tafsirs': [
        {'id': 169, 'name': 'Tafsir Ibn Kathir (Abridged)', 'author_name': 'Ibn Kathir', 'language_name': 'english'},
        {'id': 160, 'name': 'Tafsir Ibn Kathir', 'author_name': 'Ibn Kathir', 'language_name': 'urdu'}]})
    m = re.search(r'/verses/by_chapter/(\d+)\?(.*)', u)
    if m:
        n = int(m.group(1)); q = m.group(2); ids = re.search(r'translations=([\d,]+)', q)
        vs = []
        for a in range(1, quran_mock.count(n) + 1):
            v = {'verse_key': f'{n}:{a}'}
            if 'text_uthmani_tajweed' in q: v['text_uthmani_tajweed'] = 'ALIF <tajweed class=ghunnah>NUN</tajweed> <tajweed class="madda_normal">MAD</tajweed><span class=end>' + str(a) + '</span><script>window.__xss=1</script>'
            if ids:
                v['translations'] = [{'resource_id': int(i), 'resource_name': 'R' + i, 'text': ('اردو ترجمہ %s:%s' if i == '54' else 'English %s:%s') % (n, a) + '<sup foot_note=1>1</sup>'} for i in ids.group(1).split(',')]
            vs.append(v)
        return j({'verses': vs})
    route.fulfill(status=404, body='{}')
def cloud_extra(route):
    u = route.request.url
    def ok(d): route.fulfill(status=200, content_type='application/json', headers=H, body=json.dumps({'code': 200, 'status': 'OK', 'data': d}))
    if '/edition/format/audio' in u: return ok([{'identifier': 'ar.testreciter', 'englishName': 'Test Reciter', 'language': 'ar', 'type': 'versebyverse'}, {'identifier': 'en.walk', 'englishName': 'English Walk', 'language': 'en', 'type': 'versebyverse'}])
    m = re.search(r'/ayah/(\d+:\d+)/quran-uthmani', u)
    if m: return ok({'numberInSurah': 1, 'page': 5})
    route.fallback()
srv = Server(8843)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 380, 'height': 800}, is_mobile=True, has_touch=True)
    seed_returning_user(ctx); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    quran_mock.install(pg, seconds=1.0); pg.route('https://api.alquran.cloud/**', cloud_extra); pg.route('https://api.quran.com/**', qc)
    pg.goto(srv.url()); pg.wait_for_timeout(2200)
    pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(1000)
    R.ok('home has the layout switch and settings button', pg.evaluate("!!document.querySelector('#quranHome .qs-bar [data-qs-layout=\"mushaf\"]') && !!document.querySelector('#quranHome [data-qs-open]') && !document.querySelector('#quranReader [data-qs-open]')"))
    pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1400)
    R.ok('reader has the layout switch', pg.evaluate("!!document.querySelector('#quranReader .qs-bar')"))
    pg.tap('#quranSettingsBtn'); pg.wait_for_timeout(700)
    R.ok('sliders button opens the new sheet', pg.evaluate("!!document.querySelector('.qs-sheet.open')"))
    # translations
    pg.tap('[data-qs-tab="tr"]'); pg.wait_for_timeout(900)
    pg.tap('[data-qs-quick="english"]'); pg.wait_for_timeout(200); pg.tap('[data-qs-quick="urdu"]'); pg.wait_for_timeout(1500)
    n = pg.evaluate("document.querySelectorAll('#quranVerses .qs-tr').length")
    R.ok('English and Urdu translations appear under verses', n >= 4, str(n))
    R.ok('Urdu is right-to-left and footnote marks are stripped', pg.evaluate("(()=>{const u=document.querySelector('#quranVerses .qs-tr.rtl');return !!u && u.getAttribute('dir')==='rtl' && /^R54اردو ترجمہ 2:1$/.test(u.textContent.trim())})()"))
    R.ok('legacy single translation hidden', pg.evaluate("getComputedStyle(document.querySelector('#quranVerses .quran-translation')||document.body).display==='none' || !document.querySelector('#quranVerses .quran-translation')"))
    # tajweed
    pg.tap('[data-qs-tab="read"]'); pg.wait_for_timeout(300)
    pg.tap('[data-qs-script="tajweed"]'); pg.wait_for_timeout(1800)
    R.ok('Tajweed colours applied, script tags stripped', pg.evaluate("!!document.querySelector('#quranVerses .tj-ghunnah') && !window.__xss && !document.querySelector('#quranVerses script') && !document.querySelector('#quranVerses .qs-taj').textContent.includes('xss')"))
    R.ok('verse number marker kept once', pg.evaluate("[...document.querySelectorAll('#quranVerses .quran-arabic')].every(p=>p.querySelectorAll('.qr-end').length===1)"))
    pg.tap('[data-qs-script="madani"]'); pg.wait_for_timeout(1200)
    R.ok('Madani restores plain text', pg.evaluate("!document.querySelector('#quranVerses .tj-ghunnah') && document.querySelectorAll('#quranVerses .qr-word').length>0"))
    # tafsir default
    pg.tap('[data-qs-tab="tf"]'); pg.wait_for_timeout(500)
    pg.tap('[data-qs-tfquick="urdu"]'); pg.wait_for_timeout(300)
    R.ok('Urdu tafsir becomes the default', pg.evaluate("localStorage.getItem('naseem-qx-tafsir-v1')==='160'"))
    # reciters
    pg.tap('[data-qs-tab="rc"]'); pg.wait_for_timeout(500)
    R.ok('more reciters loaded from the live list (Arabic only)', pg.evaluate("[...document.querySelectorAll('[data-qs-qari]')].some(b=>b.dataset.qsQari==='ar.testreciter') && ![...document.querySelectorAll('[data-qs-qari]')].some(b=>b.dataset.qsQari==='en.walk')"))
    pg.tap('[data-qs-qari="ar.testreciter"]'); pg.wait_for_timeout(500)
    R.ok('choosing a reciter saves it', pg.evaluate("localStorage.getItem('naseem-quran-reciter-v1')==='ar.testreciter'"))
    # back closes the sheet only
    pg.evaluate("document.dispatchEvent(new CustomEvent('naseem:back',{cancelable:true,bubbles:true}))"); pg.wait_for_timeout(600)
    R.ok('back closes the sheet and stays in the reader', pg.evaluate("document.querySelector('.qs-sheet').hidden && !document.getElementById('quranReader').hidden"))
    # layout switch
    pg.tap('#quranReader [data-qs-layout="mushaf"]'); pg.wait_for_timeout(1800)
    R.ok('Mushaf page layout opens the page of the verse', pg.evaluate("!!document.querySelector('#quranVerses .qr-mushaf-page') && document.getElementById('quranReaderTitle').textContent.includes('Page 5')"))
    R.ok('layout switch shows Mushaf selected', pg.evaluate("document.querySelector('#quranReader [data-qs-layout=\"mushaf\"]').classList.contains('on')"))
    pg.tap('#quranReader [data-qs-layout="verse"]'); pg.wait_for_timeout(1800)
    R.ok('Verse layout returns to the verse list', pg.evaluate("!!document.querySelector('#quranVerses .quran-ayah .qr-word') && !document.querySelector('#quranVerses .qr-mushaf-page')"))
    # preference carries to home
    pg.tap('#quranReader [data-qs-layout="mushaf"]'); pg.wait_for_timeout(1500)
    pg.tap('#quranBack'); pg.wait_for_timeout(700)
    pg.tap('[data-open-surah="3"]'); pg.wait_for_timeout(1800)
    R.ok('with Mushaf chosen, opening a surah opens the page', pg.evaluate("!!document.querySelector('#quranVerses .qr-mushaf-page')"))
    R.ok('no page errors', not errs, str(errs))
    ctx.close(); b.close()
srv.stop(); sys.exit(R.done('quran studio'))
