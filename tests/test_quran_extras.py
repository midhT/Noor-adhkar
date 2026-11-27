"""Tafsir / translation / share / search sheet and Mushaf ink contrast, against a Quran.com stand-in."""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from common import *
import quran_mock
R = Results()
def qc(route):
    from urllib.parse import unquote; u = unquote(route.request.url); h = {'Access-Control-Allow-Origin': '*'}
    def j(o): route.fulfill(status=200, content_type='application/json', headers=h, body=json.dumps(o))
    if '/resources/tafsirs' in u: return j({'tafsirs': [{'id': 169, 'name': 'Tafsir Ibn Kathir (Abridged)', 'author_name': 'Hafiz Ibn Kathir', 'language_name': 'english'}, {'id': 91, 'name': 'Al-Saddi', 'author_name': 'Al-Saddi', 'language_name': 'arabic'}]})
    if '/resources/translations' in u: return j({'translations': [{'id': 131, 'name': 'Dr. Mustafa Khattab, The Clear Quran', 'author_name': 'Khattab', 'language_name': 'english'}, {'id': 20, 'name': 'Saheeh International', 'author_name': 'x', 'language_name': 'english'}]})
    m = re.search(r'/tafsirs/(\d+)/by_ayah/(\d+:\d+)', u)
    if m: return j({'tafsir': {'resource_name': 'T' + m.group(1), 'text': '<p>Commentary for ' + m.group(2) + '</p><script>window.__xss=1</script><img src=x onerror="window.__xss=1">'}})
    m = re.search(r'/verses/by_key/(\d+:\d+)', u)
    if m: return j({'verse': {'text_uthmani': 'ARABIC ' + m.group(1), 'translations': [{'resource_name': 'Clear Quran', 'text': 'Meaning of ' + m.group(1) + '<sup foot_note=1>1</sup>'}]}})
    if '/search' in u: return j({'search': {'results': [{'verse_key': '2:255', 'text': 'x', 'highlighted': 'the <em>throne</em>', 'translations': [{'text': 'His Throne extends'}]}]}})
    route.fulfill(status=404, body='{}')
srv = Server(8841)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for theme in ('dark', 'light'):
        ctx = b.new_context(viewport={'width': 380, 'height': 800}, is_mobile=True, has_touch=True)
        seed_returning_user(ctx); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        quran_mock.install(pg, seconds=1.0); pg.route('https://api.quran.com/**', qc)
        pg.goto(srv.url()); pg.wait_for_timeout(2200)
        pg.evaluate("document.body.classList.%s('light')" % ('add' if theme == 'light' else 'remove'))
        pg.tap('.nav-item[data-screen="quranReaderScreen"]'); pg.wait_for_timeout(900)
        if theme == 'dark':
            R.ok('search button added', pg.evaluate("!!document.querySelector('.qx-search-btn')"))
            pg.tap('[data-open-surah="2"]'); pg.wait_for_timeout(1300)
            R.ok('verses get tafsir+share buttons', pg.evaluate("document.querySelectorAll('#quranVerses [data-qx-verse]').length>=2"))
            pg.tap('#quranVerses .quran-ayah[data-ayah="2"] [data-qx-verse="tafsir"]'); pg.wait_for_timeout(900)
            R.ok('tafsir text loads', 'Commentary for 2:2' in pg.inner_text('.qx-sheet'))
            R.ok('tafsir HTML is sanitised', pg.evaluate("!window.__xss && !document.querySelector('.qx-tafsir img,.qx-tafsir script')"))
            pg.select_option('#qxTafsirPick', '91'); pg.wait_for_timeout(600)
            R.ok('tafsir picker switches source', 'T91' in pg.inner_text('.qx-sheet'))
            pg.tap('[data-qx-tab="translation"]'); pg.wait_for_timeout(700)
            R.ok('translation tab shows Arabic + meaning (footnote stripped)', 'ARABIC 2:2' in pg.inner_text('.qx-sheet') and 'Meaning of 2:2' in pg.inner_text('.qx-sheet') and 'Meaning of 2:21' not in pg.inner_text('.qx-sheet'))
            pg.tap('[data-qx-tab="share"]'); pg.wait_for_timeout(700)
            t = pg.inner_text('.qx-share-preview')
            R.ok('share text has Arabic, meaning, reference and credit', 'ARABIC 2:2' in t and 'Meaning of 2:2' in t and 'Qur’an 2:2' in t and 'Quran.com' in t, t)
            pg.evaluate("document.dispatchEvent(new CustomEvent('naseem:back',{cancelable:true,bubbles:true}))"); pg.wait_for_timeout(600)
            R.ok('back closes the sheet and stays in the reader', pg.evaluate("document.querySelector('.qx-sheet').hidden && !document.getElementById('quranVerses').closest('[hidden]')"))
            pg.evaluate("window.NaseemQuran.state && 0"); pg.click('#quranReaderBack') if pg.query_selector('#quranReaderBack') else None
            pg.evaluate("window.NaseemQuranExtras.openSearch()"); pg.wait_for_timeout(500)
            pg.fill('#qxQ', 'throne'); pg.wait_for_timeout(1000)
            R.ok('search shows hit with highlight', pg.evaluate("!!document.querySelector('.qx-hit em') && document.querySelector('.qx-hit').dataset.qxGo==='2:255'"))
        # Mushaf ink contrast in both themes
        pg.evaluate("window.NaseemExtrasClose=1")
        pg.evaluate("""()=>{const s=document.createElement('section');s.className='qr-mushaf-page qr-mushaf-indopak';s.innerHTML='<div class="qr-mushaf-line"><span class="qr-mushaf-word">TEXT</span></div>';s.style.cssText='position:fixed;top:0;left:0;z-index:99';document.body.appendChild(s);}""")
        col = pg.evaluate("""()=>{const pr=document.querySelector('.qr-mushaf-page'),w=pr.querySelector('.qr-mushaf-word');const f=c=>c.match(/[\\d.]+/g).slice(0,3).map(Number);const L=c=>{const [r,g,b]=f(c).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};const a=L(getComputedStyle(w).color),bg=L(getComputedStyle(pr).backgroundColor);return (Math.max(a,bg)+.05)/(Math.min(a,bg)+.05)}""")
        R.ok(f'{theme}: Mushaf ink contrast >= 7', col >= 7, str(col))
        R.ok(f'{theme}: no page errors', not errs, str(errs))
        ctx.close()
    b.close()
srv.stop(); sys.exit(R.done('quran extras'))
