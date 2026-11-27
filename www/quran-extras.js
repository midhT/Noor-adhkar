/* Naseem Quran extras: tafsir, translations, verse search and sharing, from Quran.com's public v4 API (Quran Foundation).
   No account or key is needed. Nothing here touches the reader's own data or the player: it adds a small sheet that opens
   from a verse's Tafsir/Share buttons (or by tapping a word on a Mushaf page) and a "Search verses" button on the surah list.
   Text is shown exactly as the API returns it (tafsir HTML is reduced to a safe set of tags). */
(function () {
  'use strict';
  const API = 'https://api.quran.com/api/v4';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  const KEY_TAFSIR = 'naseem-qx-tafsir-v1', KEY_TR = 'naseem-qx-translation-v1', KEY_TAB = 'naseem-qx-tab-v1';
  const memo = new Map();
  async function api(path) {
    if (memo.has(path)) return memo.get(path);
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 15000);
    let res;
    try { res = await fetch(API + path, { headers: { Accept: 'application/json' }, signal: ctl.signal }); }
    catch (_) { throw new Error('Could not reach Quran.com. Check your connection and try again.'); }
    finally { clearTimeout(timer); }
    if (!res.ok) throw new Error('Quran.com returned ' + res.status + '.');
    const data = await res.json();
    memo.set(path, data); if (memo.size > 80) memo.delete(memo.keys().next().value);
    return data;
  }
  /* Keep only simple formatting from API HTML: everything else is unwrapped, every attribute is dropped. */
  const SAFE = new Set(['P', 'B', 'I', 'EM', 'STRONG', 'BR', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'SPAN', 'DIV', 'BLOCKQUOTE', 'SUP', 'SUB']);
  function clean(html, extra) {
    const doc = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
    const out = document.createElement('div');
    (function walk(src, dst) {
      src.childNodes.forEach(n => {
        if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META)$/.test(n.tagName)) return;
        if (SAFE.has(n.tagName) || (extra && extra.has(n.tagName))) { const el = document.createElement(n.tagName.toLowerCase()); walk(n, el); dst.appendChild(el); }
        else walk(n, dst);
      });
    })(doc.body, out);
    return out.innerHTML;
  }
  const plain = html => { const d = document.createElement('div'); d.innerHTML = clean(html); d.querySelectorAll('sup').forEach(s => s.remove()); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  const toast = m => { if (typeof window.toast === 'function') try { window.toast(m); } catch (_) {} };

  /* ---------- the sheet ---------- */
  let sheet, back, bodyEl, titleEl, tabsEl, mode = null, vkey = '', token = 0, closeTimer = 0;
  function build() {
    if (sheet) return;
    back = document.createElement('div'); back.className = 'qx-back'; back.hidden = true;
    sheet = document.createElement('section'); sheet.className = 'qx-sheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = '<span class="qx-handle" aria-hidden="true"></span><header class="qx-head"><strong class="qx-title"></strong><button type="button" class="qx-x" aria-label="Close">✕</button></header><div class="qx-tabs" role="tablist"></div><div class="qx-body"></div><p class="qx-credit">Content from <a href="https://quran.com" target="_blank" rel="noopener noreferrer">Quran.com</a> · Quran Foundation</p>';
    document.body.append(back, sheet);
    bodyEl = sheet.querySelector('.qx-body'); titleEl = sheet.querySelector('.qx-title'); tabsEl = sheet.querySelector('.qx-tabs');
    back.addEventListener('click', close); sheet.querySelector('.qx-x').addEventListener('click', close);
    tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-qx-tab]'); if (b && mode === 'verse') showTab(b.dataset.qxTab); });
    let sy = 0, dy = 0, drag = false;
    sheet.querySelector('.qx-head').addEventListener('touchstart', e => { sy = e.touches[0].clientY; dy = 0; drag = true; sheet.style.transition = 'none'; }, { passive: true });
    sheet.addEventListener('touchmove', e => { if (!drag) return; dy = Math.max(0, e.touches[0].clientY - sy); sheet.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    const end = () => { if (!drag) return; drag = false; sheet.style.transition = ''; sheet.style.transform = ''; if (dy > 90) close(); };
    sheet.addEventListener('touchend', end, { passive: true }); sheet.addEventListener('touchcancel', end, { passive: true });
    // on window (capture): runs before the reader's own document-level handler, which would otherwise leave the reader instead of closing this sheet
    window.addEventListener('naseem:back', e => { if (sheet && !sheet.hidden && sheet.classList.contains('open')) { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
  }
  function open() {
    build(); clearTimeout(closeTimer);
    back.hidden = false; sheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { sheet.classList.add('open'); back.classList.add('open'); }));
    document.body.classList.add('qx-open');
  }
  function close() {
    if (!sheet || sheet.hidden) return;
    token++; sheet.classList.remove('open'); back.classList.remove('open'); document.body.classList.remove('qx-open');
    closeTimer = setTimeout(() => { sheet.hidden = true; back.hidden = true; bodyEl.innerHTML = ''; }, 260);
  }
  const loading = msg => '<p class="qx-note" role="status">' + esc(msg || 'Loading…') + '</p>';
  const failure = (e, retry) => '<div class="qx-note qx-err" role="alert"><p>' + esc(e && e.message || 'Something went wrong.') + '</p>' + (retry ? '<button type="button" class="qx-btn" data-qx-retry>Try again</button>' : '') + '</div>';

  /* ---------- resource lists (tafsirs, translations), fetched once ---------- */
  async function tafsirList() {
    const d = await api('/resources/tafsirs');
    return (d.tafsirs || []).map(t => ({ id: t.id, name: t.name, author: t.author_name, lang: t.language_name || '' }));
  }
  async function translationList() {
    const d = await api('/resources/translations');
    return (d.translations || []).map(t => ({ id: t.id, name: t.name, author: t.author_name, lang: t.language_name || '' }));
  }
  const byLang = list => {
    const order = ['english', 'urdu', 'arabic', 'hindi', 'bengali', 'indonesian', 'turkish', 'french', 'spanish', 'russian', 'malayalam', 'tamil'];
    return list.slice().sort((a, b) => { const x = order.indexOf(a.lang.toLowerCase()), y = order.indexOf(b.lang.toLowerCase()); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name); });
  };
  function pickerHTML(list, id, selected) {
    const groups = new Map();
    byLang(list).forEach(t => { const g = t.lang || 'Other'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(t); });
    let h = '<select class="qx-select" id="' + id + '" aria-label="Choose source">';
    groups.forEach((items, g) => { h += '<optgroup label="' + esc(g.charAt(0).toUpperCase() + g.slice(1)) + '">' + items.map(t => '<option value="' + t.id + '"' + (String(t.id) === String(selected) ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</optgroup>'; });
    return h + '</select>';
  }
  const pickDefault = (list, saved, rx) => {
    if (saved && list.some(t => String(t.id) === String(saved))) return saved;
    const m = list.find(t => /english/i.test(t.lang) && rx.test(t.name + ' ' + (t.author || ''))) || list.find(t => /english/i.test(t.lang)) || list[0];
    return m ? m.id : '';
  };

  /* ---------- verse tabs ---------- */
  const TABS = [['tafsir', 'Tafsir'], ['translation', 'Translation'], ['share', 'Share']];
  function openVerse(key, tab) {
    if (!/^\d+:\d+$/.test(key)) return;
    mode = 'verse'; vkey = key; build();
    titleEl.textContent = 'Surah ' + key.replace(':', ' · Ayah ');
    tabsEl.hidden = false;
    tabsEl.innerHTML = TABS.map(t => '<button type="button" role="tab" data-qx-tab="' + t[0] + '">' + t[1] + '</button>').join('');
    open(); showTab(tab || store.get(KEY_TAB, 'tafsir'));
  }
  function setTab(t) { tabsEl.querySelectorAll('[data-qx-tab]').forEach(b => { const on = b.dataset.qxTab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); }
  function showTab(t) {
    if (!TABS.some(x => x[0] === t)) t = 'tafsir';
    store.set(KEY_TAB, t); setTab(t); const my = ++token;
    bodyEl.innerHTML = loading(); bodyEl.scrollTop = 0;
    (t === 'tafsir' ? tafsirTab : t === 'translation' ? translationTab : shareTab)(my).catch(err => {
      if (my !== token) return;
      bodyEl.innerHTML = failure(err, true);
      const r = bodyEl.querySelector('[data-qx-retry]'); if (r) r.addEventListener('click', () => showTab(t));
    });
  }
  async function tafsirTab(my) {
    const list = await tafsirList(); if (my !== token) return;
    if (!list.length) throw new Error('No tafsir list was returned.');
    let id = pickDefault(list, store.get(KEY_TAFSIR, ''), /kathir/i);
    async function render() {
      const m = ++token;
      bodyEl.innerHTML = pickerHTML(list, 'qxTafsirPick', id) + '<div class="qx-text" id="qxTafsirText">' + loading('Loading tafsir…') + '</div>';
      $('qxTafsirPick').addEventListener('change', e => { id = e.target.value; store.set(KEY_TAFSIR, id); render(); });
      try {
        const d = await api('/tafsirs/' + encodeURIComponent(id) + '/by_ayah/' + encodeURIComponent(vkey));
        if (m !== token) return;
        const t = d.tafsir || {}, info = list.find(x => String(x.id) === String(id));
        const html = clean(t.text);
        $('qxTafsirText').innerHTML = html ? '<div class="qx-tafsir' + (/arabic|urdu|persian/i.test(info && info.lang) ? ' rtl' : '') + '">' + html + '</div><p class="qx-src">' + esc(t.resource_name || (info && info.name) || '') + (info && info.author ? ' · ' + esc(info.author) : '') + '</p>' : '<p class="qx-note">This source has no commentary for this verse. Pick another above.</p>';
      } catch (e) {
        if (m !== token) return;
        $('qxTafsirText').innerHTML = failure(e, true);
        const r = $('qxTafsirText').querySelector('[data-qx-retry]'); if (r) r.addEventListener('click', render);
      }
    }
    token = my; await render();
  }
  async function verseData(trId) {
    const d = await api('/verses/by_key/' + encodeURIComponent(vkey) + '?words=false&fields=text_uthmani&translations=' + encodeURIComponent(trId));
    const v = d.verse || {};
    return { arabic: v.text_uthmani || '', tr: plain(v.translations && v.translations[0] && v.translations[0].text), trName: (v.translations && v.translations[0] && v.translations[0].resource_name) || '' };
  }
  async function currentTranslationId() {
    const list = await translationList();
    return { list, id: pickDefault(list, store.get(KEY_TR, ''), /(clear quran|saheeh|sahih)/i) };
  }
  async function translationTab(my) {
    const { list, id: first } = await currentTranslationId(); if (my !== token) return;
    let id = first;
    async function render() {
      const m = ++token;
      bodyEl.innerHTML = pickerHTML(list, 'qxTrPick', id) + '<div id="qxTrText">' + loading() + '</div>';
      $('qxTrPick').addEventListener('change', e => { id = e.target.value; store.set(KEY_TR, id); render(); });
      try {
        const v = await verseData(id); if (m !== token) return;
        const rtl = /arabic|urdu|persian/i.test((list.find(x => String(x.id) === String(id)) || {}).lang);
        $('qxTrText').innerHTML = '<p class="qx-arabic" lang="ar" dir="rtl">' + esc(v.arabic) + '</p><p class="qx-tr' + (rtl ? ' rtl' : '') + '">' + esc(v.tr) + '</p><p class="qx-src">' + esc(v.trName) + '</p>';
      } catch (e) { if (m !== token) return; $('qxTrText').innerHTML = failure(e, true); const r = $('qxTrText').querySelector('[data-qx-retry]'); if (r) r.addEventListener('click', render); }
    }
    token = my; await render();
  }
  function shareText(v) {
    return [v.arabic, '', v.tr, '', '— Qur’an ' + vkey + (v.trName ? ' (' + v.trName + ')' : ''), 'Shared from Naseem · Text: Quran.com'].join('\n').replace(/\n{3,}/g, '\n\n');
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (_) { return false; }
  }
  async function shareTab(my) {
    const { id } = await currentTranslationId(); if (my !== token) return;
    const v = await verseData(id); if (my !== token) return;
    const text = shareText(v);
    bodyEl.innerHTML = '<pre class="qx-share-preview" dir="auto">' + esc(text) + '</pre><div class="qx-actions"><button type="button" class="qx-btn qx-primary" id="qxShare">Share</button><button type="button" class="qx-btn" id="qxCopy">Copy</button></div><p class="qx-src">Uses your chosen translation. Change it in the Translation tab.</p>';
    $('qxShare').addEventListener('click', async () => {
      if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      toast((await copyText(text)) ? 'Copied. Paste it where you want to share it.' : 'Sharing is not available on this device.');
    });
    $('qxCopy').addEventListener('click', async () => toast((await copyText(text)) ? 'Copied' : 'Could not copy'));
  }

  /* ---------- verse search ---------- */
  function openSearch() {
    mode = 'search'; build(); token++;
    titleEl.textContent = 'Search the Quran'; tabsEl.hidden = true; tabsEl.innerHTML = '';
    bodyEl.innerHTML = '<label class="qx-search"><input id="qxQ" type="search" placeholder="A word or phrase, in English or Arabic" autocomplete="off" enterkeyhint="search"></label><div id="qxResults"><p class="qx-note">Searches the translation text and the Arabic on Quran.com.</p></div>';
    open();
    const input = $('qxQ'); let timer = 0, last = '';
    const run = async () => {
      const q = input.value.trim(), out = $('qxResults'); if (!out || q === last) return; last = q;
      if (q.length < 2) { out.innerHTML = '<p class="qx-note">Type at least two letters.</p>'; return; }
      const my = ++token; out.innerHTML = loading('Searching…');
      try {
        const d = await api('/search?q=' + encodeURIComponent(q) + '&size=20&language=en'); if (my !== token) return;
        const rows = (d.search && d.search.results) || [];
        if (!rows.length) { out.innerHTML = '<p class="qx-note">No verses matched “' + esc(q) + '”.</p>'; return; }
        out.innerHTML = rows.map(r => {
          const tr = r.translations && r.translations[0];
          return '<button type="button" class="qx-hit" data-qx-go="' + esc(r.verse_key) + '"><b>' + esc(r.verse_key) + '</b><span class="qx-hit-ar" lang="ar" dir="rtl">' + clean(r.highlighted || r.text, new Set(['EM'])) + '</span>' + (tr ? '<span class="qx-hit-tr">' + clean(tr.text) + '</span>' : '') + '</button>';
        }).join('');
      } catch (e) { if (my !== token) return; out.innerHTML = failure(e, true); const b = out.querySelector('[data-qx-retry]'); if (b) b.addEventListener('click', () => { last = ''; run(); }); }
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 380); });
    $('qxResults').addEventListener('click', e => {
      const b = e.target.closest('[data-qx-go]'); if (!b) return;
      const [s, a] = b.dataset.qxGo.split(':').map(Number); close();
      if (window.NaseemQuran && window.NaseemQuran.openReader) window.NaseemQuran.openReader(s, a);
    });
    setTimeout(() => { try { input.focus({ preventScroll: true }); } catch (_) {} }, 320);
  }

  /* ---------- hooks into the reader ---------- */
  const ICON_T = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M9 9h6M9 13h6"/></svg>';
  const ICON_S = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="m8 11 7.5-4M8 13l7.5 4"/></svg>';
  function decorate(root) {
    root.querySelectorAll('.quran-ayah-actions:not([data-qx])').forEach(box => {
      box.dataset.qx = '1';
      box.insertAdjacentHTML('beforeend', '<button type="button" class="qa-btn" data-qx-verse="tafsir" aria-label="Tafsir">' + ICON_T + '</button><button type="button" class="qa-btn" data-qx-verse="share" aria-label="Share verse">' + ICON_S + '</button>');
    });
  }
  function hook() {
    const host = $('quranVerses'), surahPanel = document.querySelector('[data-quran-panel="surah"]');
    if (!host) return false;
    decorate(host);
    new MutationObserver(() => decorate(host)).observe(host, { childList: true, subtree: true });
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-qx-verse]');
      if (b) { const art = b.closest('.quran-ayah'); if (art) openVerse(art.dataset.surah + ':' + art.dataset.ayah, b.dataset.qxVerse); return; }
      const w = e.target.closest('.qr-mushaf-word[data-verse-key],.qr-verse-end[data-verse-key]');
      if (w) openVerse(w.dataset.verseKey);
    });
    if (surahPanel && !surahPanel.querySelector('.qx-search-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'qx-search-btn';
      btn.innerHTML = '<span aria-hidden="true">⌕</span> Search verses by word';
      btn.addEventListener('click', openSearch);
      const field = surahPanel.querySelector('.qr-search');
      if (field && field.parentNode) field.parentNode.insertBefore(btn, field.nextSibling); else surahPanel.prepend(btn);
    }
    return true;
  }
  if (!hook()) { const mo = new MutationObserver(() => { if (hook()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); }
  window.NaseemQuranExtras = { openVerse, openSearch, close };
})();
