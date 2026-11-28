/* Naseem Quran Studio: the reading-settings sheet and quick layout switch, in the style of Quran.com's reader.
   It drives the existing reader (layout, Mushaf edition, text size, reciter, follow-along) and adds three things of its own:
   translations under each verse (several at once, Urdu and English among them), Tajweed colouring, and a default tafsir.
   Translations, Tajweed text and the source lists come from Quran.com's public v4 API (Quran Foundation); nothing is invented here.
   In Tajweed colouring the word-by-word highlight is off (the verse is highlighted as a whole), because the Tajweed text is one marked-up string per verse. */
(function () {
  'use strict';
  const API = 'https://api.quran.com/api/v4';
  const KEY = 'naseem-qs-v1', LISTS = 'naseem-qs-lists-v1', K_TAFSIR = 'naseem-qx-tafsir-v1', K_TR = 'naseem-qx-translation-v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rd = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const Q = () => window.NaseemQuran || {};
  const toast = m => { if (typeof window.toast === 'function') try { window.toast(m); } catch (_) {} };

  /* ---------- saved settings ---------- */
  let S = { layout: 'verse', script: 'madani', trOn: false, tr: [], trSize: 1 };
  try { const v = JSON.parse(rd(KEY, 'null')); if (v && typeof v === 'object') S = Object.assign(S, v); } catch (_) {}
  if (!['verse', 'mushaf'].includes(S.layout)) S.layout = 'verse';
  if (!['madani', 'tajweed'].includes(S.script)) S.script = 'madani';
  if (!Array.isArray(S.tr)) S.tr = [];
  S.tr = S.tr.map(String).slice(0, 3);
  const save = () => wr(KEY, JSON.stringify(S));
  const MAXTR = 3;

  /* ---------- Quran.com requests ---------- */
  const memo = new Map();
  async function api(path) {
    if (memo.has(path)) return memo.get(path);
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch(API + path, { headers: { Accept: 'application/json' }, signal: ctl.signal });
      if (!res.ok) throw new Error('Quran.com returned ' + res.status);
      const j = await res.json(); memo.set(path, j); if (memo.size > 60) memo.delete(memo.keys().next().value); return j;
    } finally { clearTimeout(timer); }
  }
  let lists = null;
  async function loadLists() {
    if (lists) return lists;
    try { const c = JSON.parse(rd(LISTS, 'null')); if (c && Date.now() - c.at < 14 * 864e5 && c.tr && c.tr.length && c.tf && c.tf.length) return (lists = c); } catch (_) {}
    const [t, f] = await Promise.all([api('/resources/translations'), api('/resources/tafsirs')]);
    const map = x => ({ id: String(x.id), name: x.name || '', author: x.author_name || '', lang: (x.language_name || '').toLowerCase() });
    lists = { at: Date.now(), tr: (t.translations || []).map(map), tf: (f.tafsirs || []).map(map) };
    wr(LISTS, JSON.stringify(lists)); return lists;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const ORDER = ['english', 'urdu', 'arabic', 'hindi', 'bengali', 'indonesian', 'turkish'];
  function groups(list) {
    const m = new Map();
    list.slice().sort((a, b) => { const x = ORDER.indexOf(a.lang), y = ORDER.indexOf(b.lang); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name); })
      .forEach(t => { const g = t.lang || 'other'; if (!m.has(g)) m.set(g, []); m.get(g).push(t); });
    return m;
  }
  const find = (list, lang, rx) => list.find(t => t.lang === lang && rx.test(t.name + ' ' + t.author)) || list.find(t => t.lang === lang);

  /* ---------- text helpers ---------- */
  const SAFE_BLOCK = new Set(['B', 'I', 'EM', 'STRONG']);
  function plain(html) {
    const d = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
    d.querySelectorAll('sup,script,style').forEach(n => n.remove());
    return (d.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  const TJ_OK = /^[a-z_]{2,32}$/;
  function tajweedHTML(raw) {
    const d = new DOMParser().parseFromString('<body>' + String(raw || '') + '</body>', 'text/html');
    let out = '';
    (function walk(n) {
      n.childNodes.forEach(c => {
        if (c.nodeType === 3) { out += esc(c.nodeValue); return; }
        if (c.nodeType !== 1) return;
        const tag = c.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        if (tag === 'TAJWEED') { const cls = (c.getAttribute('class') || '').trim(); out += '<span class="tj' + (TJ_OK.test(cls) ? ' tj-' + cls : '') + '">'; walk(c); out += '</span>'; return; }
        if (tag === 'SPAN' && /\bend\b/.test(c.getAttribute('class') || '')) return;
        walk(c);
      });
    })(d.body);
    return out.trim();
  }
  const rtlText = t => { const a = (String(t).match(/[؀-ۿ]/g) || []).length; return a > String(t).length * 0.4; };

  /* ---------- overlay on the verses the reader draws ---------- */
  const host = () => $('quranVerses');
  const orig = new WeakMap();
  let token = 0, noteTimer = 0;
  const edNow = () => (Q().layout ? Q().layout().edition : 'translation');
  const setEdition = ed => { const b = document.querySelector('[data-quran-edition="' + ed + '"]'); if (b && edNow() !== ed) b.click(); };
  const sig = () => JSON.stringify([wantTaj(), wantTr() ? S.tr : 0]);
  const wantTaj = () => S.script === 'tajweed' && Q().layout && Q().layout().mushaf === 'quran-uthmani' && Q().layout().readingMode !== 'line';
  const wantTr = () => edNow() === 'translation' && S.tr.length > 0;
  const chapter = (s, ids, taj) => api('/verses/by_chapter/' + s + '?language=en&words=false&per_page=300' + (taj ? '&fields=text_uthmani_tajweed' : '') + (ids.length ? '&translations=' + ids.join(',') : ''));
  function note(msg) {
    const el = $('quranReaderStatus'); if (!el) return; el.textContent = msg; clearTimeout(noteTimer); noteTimer = setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 6000);
  }
  function restore(art) {
    const p = art.querySelector('.quran-arabic');
    if (p && orig.has(p)) { p.innerHTML = orig.get(p); orig.delete(p); p.classList.remove('qs-taj'); }
    art.querySelectorAll('.qs-trs').forEach(n => n.remove());
    art.classList.remove('qs-taj-on'); delete art.dataset.qs;
  }
  async function enhance() {
    const h = host(); if (!h) return;
    const arts = [...h.querySelectorAll('article.quran-ayah[data-surah][data-ayah]')]; if (!arts.length) return;
    const s = sig(), taj = wantTaj(), tr = wantTr();
    document.body.classList.toggle('qs-own-tr', tr);
    const todo = arts.filter(a => a.dataset.qs !== s);
    if (!todo.length) return;
    if (!taj && !tr) { todo.forEach(restore); return; }
    const my = ++token, ids = tr ? S.tr.slice() : [];
    const chapters = [...new Set(todo.map(a => a.dataset.surah))];
    const got = new Map(); let failed = 0;
    await Promise.all(chapters.map(async c => {
      try {
        const j = await chapter(c, ids, taj);
        (j.verses || []).forEach(v => got.set(v.verse_key, v));
      } catch (_) { failed++; }
    }));
    if (my !== token) return;
    if (failed === chapters.length) { note('Translations and Tajweed need an internet connection. Showing the Arabic text.'); todo.forEach(a => { a.dataset.qs = s; }); return; }
    for (const a of todo) {
      const key = a.dataset.surah + ':' + a.dataset.ayah, v = got.get(key); a.dataset.qs = s;
      restore(a); a.dataset.qs = s;
      if (!v) continue;
      const p = a.querySelector('.quran-arabic');
      if (taj && p && v.text_uthmani_tajweed) {
        const marker = p.querySelector('.qr-end,.qr-verse-end'), mk = marker ? marker.outerHTML : '';
        orig.set(p, p.innerHTML);
        p.innerHTML = tajweedHTML(v.text_uthmani_tajweed) + (mk ? ' ' + mk : '');
        p.classList.add('qs-taj'); a.classList.add('qs-taj-on');
      }
      if (tr && v.translations && v.translations.length) {
        const byId = new Map(v.translations.map(t => [String(t.resource_id), t]));
        const rows = ids.map(id => byId.get(id)).filter(Boolean).map(t => {
          const text = plain(t.text); if (!text) return '';
          const rtl = rtlText(text);
          return '<p class="qs-tr' + (rtl ? ' rtl' : '') + '"' + (rtl ? ' dir="rtl" lang="ur"' : '') + '><small>' + esc(t.resource_name || '') + '</small>' + esc(text) + '</p>';
        }).join('');
        if (rows) {
          const box = document.createElement('div'); box.className = 'qs-trs'; box.innerHTML = rows;
          const anchor = a.querySelector('.quran-translation') || a.querySelector('.qa-progress');
          if (anchor) a.insertBefore(box, anchor); else a.appendChild(box);
        }
      }
    }
  }
  function refresh() {
    const h = host(); if (!h) return;
    h.querySelectorAll('article.quran-ayah[data-qs]').forEach(a => { delete a.dataset.qs; });
    enhance();
  }
  let obsT = 0;
  function watch() {
    const h = host(); if (!h) return false;
    new MutationObserver(() => { clearTimeout(obsT); obsT = setTimeout(() => { enhance(); syncBars(); }, 120); }).observe(h, { childList: true });
    return true;
  }

  /* ---------- layout / script / mushaf actions ---------- */
  const layoutNow = () => { const L = Q().layout ? Q().layout() : {}; return L.pageReading ? 'mushaf' : 'verse'; };
  async function setLayout(next) {
    S.layout = next; save(); syncBars();
    const L = Q().layout ? Q().layout() : null; if (!L || !L.reading) return;
    try {
      if (next === 'mushaf' && !L.pageReading) {
        const page = await Q().pageOfVerse(L.current, L.ayah);
        await Q().openPageAt(page, L.mushaf === 'indopak15' ? 'line' : 'page');
      } else if (next === 'verse' && L.pageReading) {
        await Q().openReader(L.current, L.ayah, { verses: true });
      }
    } catch (e) { toast('Could not switch the layout. Check your connection.'); }
    syncBars();
  }
  async function setScript(next) {
    const L = Q().layout ? Q().layout() : {};
    if (next === 'indopak') { S.script = 'madani'; save(); if (Q().setMushaf) await Q().setMushaf('indopak', 'page'); }
    else { S.script = next; save(); if (L.mushaf !== 'quran-uthmani' && Q().setMushaf) await Q().setMushaf('quran-uthmani', 'page'); else refresh(); }
    syncBars(); refresh();
  }
  const scriptNow = () => { const L = Q().layout ? Q().layout() : {}; return L.mushaf && L.mushaf !== 'quran-uthmani' ? 'indopak' : S.script; };

  /* ---------- quick bars (home + reader) ---------- */
  const GEAR = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 7h9M18 7h1M5 17h1M10 17h9"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>';
  const barHTML = () => '<div class="qs-seg" role="group" aria-label="Reading layout"><button type="button" data-qs-layout="verse">Verse by verse</button><button type="button" data-qs-layout="mushaf">Mushaf page</button></div><button type="button" class="qs-gear" data-qs-open aria-label="Reading settings">' + GEAR + '</button>';
  function mountBars() {
    const home = $('quranHome'), reader = $('quranReader'); if (!home || !reader) return false;
    if (!home.querySelector('.qs-bar')) { const b = document.createElement('div'); b.className = 'qs-bar'; b.innerHTML = barHTML(); const anchor = home.querySelector('.quran-hero'); if (anchor) anchor.after(b); else home.prepend(b); }
    if (!reader.querySelector('.qs-bar')) { const b = document.createElement('div'); b.className = 'qs-bar qs-bar-reader'; b.innerHTML = barHTML().replace(/<button type="button" class="qs-gear"[\s\S]*$/, ''); const sp = reader.querySelector('.qr-bar-spacer'); if (sp) sp.after(b); else reader.prepend(b); }
    [home, reader].forEach(r => { if (r.dataset.qsBound) return; r.dataset.qsBound = '1'; r.addEventListener('click', e => { const g = e.target.closest('[data-qs-layout]'); if (g) { setLayout(g.dataset.qsLayout); return; } if (e.target.closest('[data-qs-open]')) open(); }); });
    syncBars(); return true;
  }
  function syncBars() {
    const cur = $('quranReader') && !$('quranReader').hidden ? layoutNow() : S.layout;
    document.querySelectorAll('[data-qs-layout]').forEach(b => { const on = b.dataset.qsLayout === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    if (sheet && !sheet.hidden) paint();
  }

  /* ---------- the sheet ---------- */
  let sheet, back, bodyEl, tab = 'read', closeT = 0;
  const TABS = [['read', 'Reading'], ['tr', 'Translation'], ['tf', 'Tafsir'], ['rc', 'Reciter']];
  function build() {
    if (sheet) return;
    back = document.createElement('div'); back.className = 'qs-back'; back.hidden = true;
    sheet = document.createElement('section'); sheet.className = 'qs-sheet'; sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Reading settings');
    sheet.innerHTML = '<span class="qs-handle" aria-hidden="true"></span><header class="qs-head"><strong>Reading settings</strong><button type="button" class="qs-x" aria-label="Close">✕</button></header><div class="qs-tabs" role="tablist">' + TABS.map(t => '<button type="button" role="tab" data-qs-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div class="qs-body"></div><p class="qs-credit">Text, translations and tafsir: <a href="https://quran.com" target="_blank" rel="noopener noreferrer">Quran.com</a> · Quran Foundation</p>';
    document.body.append(back, sheet); bodyEl = sheet.querySelector('.qs-body');
    back.addEventListener('click', close); sheet.querySelector('.qs-x').addEventListener('click', close);
    sheet.querySelector('.qs-tabs').addEventListener('click', e => { const b = e.target.closest('[data-qs-tab]'); if (b) { tab = b.dataset.qsTab; paint(); bodyEl.scrollTop = 0; } });
    bodyEl.addEventListener('click', onBody); bodyEl.addEventListener('change', onChange); bodyEl.addEventListener('input', onInput);
    let sy = 0, dy = 0, drag = false;
    sheet.querySelector('.qs-head').addEventListener('touchstart', e => { sy = e.touches[0].clientY; dy = 0; drag = true; sheet.style.transition = 'none'; }, { passive: true });
    sheet.addEventListener('touchmove', e => { if (!drag) return; dy = Math.max(0, e.touches[0].clientY - sy); sheet.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    const end = () => { if (!drag) return; drag = false; sheet.style.transition = ''; sheet.style.transform = ''; if (dy > 90) close(); };
    sheet.addEventListener('touchend', end, { passive: true }); sheet.addEventListener('touchcancel', end, { passive: true });
    // Android back: close this sheet first. Registered on window (capture) so it runs before the reader's own handler.
    window.addEventListener('naseem:back', e => { if (sheet && !sheet.hidden && sheet.classList.contains('open')) { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
  }
  function open(which) {
    build(); clearTimeout(closeT); if (which) tab = which;
    back.hidden = false; sheet.hidden = false; paint();
    requestAnimationFrame(() => requestAnimationFrame(() => { sheet.classList.add('open'); back.classList.add('open'); }));
    document.body.classList.add('qs-open');
    loadLists().then(() => { if (!sheet.hidden) paint(); }).catch(() => { if (!sheet.hidden) paint(); });
  }
  function close() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('open'); back.classList.remove('open'); document.body.classList.remove('qs-open');
    closeT = setTimeout(() => { sheet.hidden = true; back.hidden = true; }, 260);
  }
  const seg = (name, items, cur) => '<div class="qs-seg qs-seg-wide" role="group">' + items.map(i => '<button type="button" data-qs-' + name + '="' + i[0] + '" class="' + (i[0] === cur ? 'on' : '') + '" aria-pressed="' + (i[0] === cur) + '">' + i[1] + '</button>').join('') + '</div>';
  const row = (label, html, sub) => '<div class="qs-row"><div class="qs-lab"><strong>' + label + '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>' + html + '</div>';
  const TJ = [['ham_wasl', 'Hamzat al-wasl'], ['slnt', 'Silent letter'], ['laam_shamsiyah', 'Lam shamsiyah'], ['madda_normal', 'Madd, 2 counts'], ['madda_permissible', 'Madd, 2 / 4 / 6'], ['madda_necessary', 'Madd, 6 counts'], ['madda_obligatory', 'Madd, 4 to 5'], ['qalaqah', 'Qalqalah'], ['ikhfa', 'Ikhfa'], ['ikhfa_shafawi', 'Ikhfa shafawi'], ['idgham_ghunnah', 'Idgham with ghunnah'], ['idgham_wo_ghunnah', 'Idgham without ghunnah'], ['idgham_shafawi', 'Idgham shafawi'], ['iqlab', 'Iqlab'], ['ghunnah', 'Ghunnah']];
  function pickerHTML(list, id, ph) {
    let h = '<select class="qs-select" id="' + id + '" aria-label="' + esc(ph) + '"><option value="">' + esc(ph) + '</option>';
    groups(list).forEach((items, g) => { h += '<optgroup label="' + esc(cap(g)) + '">' + items.map(t => '<option value="' + esc(t.id) + '">' + esc(t.name + (t.author && t.author !== t.name ? ' · ' + t.author : '')) + '</option>').join('') + '</optgroup>'; });
    return h + '</select>';
  }
  const loadingNote = () => '<p class="qs-note">' + (lists === null ? 'Loading the list from Quran.com…' : '') + '</p>';
  function paint() {
    if (!sheet) return;
    sheet.querySelectorAll('[data-qs-tab]').forEach(b => { const on = b.dataset.qsTab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    const keep = bodyEl.scrollTop; let h = '';
    const L = Q().layout ? Q().layout() : {}, lay = L.reading ? layoutNow() : S.layout, scr = scriptNow();
    if (tab === 'read') {
      h += row('Layout', seg('layout', [['verse', 'Verse by verse'], ['mushaf', 'Mushaf page']], lay), lay === 'mushaf' ? 'Pages as printed' : 'One verse at a time, with meanings');
      h += row('Arabic script', seg('script', [['madani', 'Madani'], ['indopak', 'Indo-Pak'], ['tajweed', 'Tajweed']], scr));
      if (scr === 'tajweed') h += '<div class="qs-legend" aria-label="Tajweed colour key">' + TJ.map(t => '<span><i class="tj tj-' + t[0] + '">●</i>' + t[1] + '</span>').join('') + '</div><p class="qs-note">Verse highlight follows the recitation. Word-by-word highlight is off while Tajweed colours are on.</p>';
      if (lay === 'mushaf') h += row('Page style', '<select class="qs-select" id="qsStyle" aria-label="Mushaf page style">' + [['quran-uthmani', 'Madani · 604 pages'], ['indopak', 'Indo-Pak · 604 pages'], ['indopak15', 'Indo-Pak · 15 lines'], ['indopak16', 'Indo-Pak · 16 lines']].map(o => '<option value="' + o[0] + '"' + (o[0] === L.mushaf ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>');
      const fs = $('quranFontSize');
      h += row('Arabic size', '<input type="range" class="qs-range" id="qsArSize" min="22" max="42" step="1" value="' + (fs ? fs.value : 30) + '" aria-label="Arabic text size">');
      h += row('Translation size', '<input type="range" class="qs-range" id="qsTrSize" min="0.85" max="1.5" step="0.05" value="' + S.trSize + '" aria-label="Translation text size">');
      const mm = $('quranMemMode'), hid = !!(mm && mm.getAttribute('aria-pressed') === 'true');
      h += row('Memorise', '<div class="qs-seg qs-seg-wide"><button type="button" data-qs-mem="hide" class="' + (hid ? 'on' : '') + '" aria-pressed="' + hid + '">Hide text</button><button type="button" data-qs-mem="add">Add surah</button></div>', 'Hide the Arabic to test yourself, or add this surah to review');
      const fol = $('quranFollow'), on = fol && fol.getAttribute('aria-checked') === 'true';
      h += row('Keep recitation centred', '<button type="button" class="qs-switch' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" data-qs-follow aria-label="Keep the recited verse centred"><i></i></button>');
    } else if (tab === 'tr') {
      const trOn = edNow() === 'translation';
      h += row('Show translation', '<button type="button" class="qs-switch' + (trOn ? ' on' : '') + '" role="switch" aria-checked="' + trOn + '" data-qs-tron aria-label="Show translation under each verse"><i></i></button>', 'Under every verse, in the reader and on Mushaf pages');
      if (!lists) h += loadingNote();
      else {
        const byId = new Map(lists.tr.map(t => [t.id, t]));
        h += '<div class="qs-chips">' + (S.tr.length ? S.tr.map(id => { const t = byId.get(id); return '<span class="qs-chip">' + esc(t ? t.name : 'Translation ' + id) + '<button type="button" data-qs-trdel="' + esc(id) + '" aria-label="Remove">✕</button></span>'; }).join('') : '<p class="qs-note">No translation chosen yet.</p>') + '</div>';
        h += '<div class="qs-quick"><button type="button" class="qs-btn" data-qs-quick="english">+ English</button><button type="button" class="qs-btn" data-qs-quick="urdu">+ Urdu</button></div>';
        h += S.tr.length >= MAXTR ? '<p class="qs-note">Up to ' + MAXTR + ' translations at a time. Remove one to add another.</p>' : pickerHTML(lists.tr, 'qsTrAdd', 'Add another translation…');
      }
    } else if (tab === 'tf') {
      if (!lists) h += loadingNote();
      else {
        const cur = rd(K_TAFSIR, ''), byId = new Map(lists.tf.map(t => [t.id, t])), c = byId.get(String(cur));
        h += row('Default tafsir', '<span class="qs-val">' + esc(c ? c.name : 'Not chosen yet') + '</span>', 'Opens first when you tap Tafsir on a verse');
        h += '<div class="qs-quick"><button type="button" class="qs-btn" data-qs-tfquick="english">English tafsir</button><button type="button" class="qs-btn" data-qs-tfquick="urdu">Urdu tafsir</button></div>';
        h += pickerHTML(lists.tf, 'qsTf', 'Choose another tafsir…');
        h += '<p class="qs-note">Tap the book icon on any verse to read its tafsir.</p>';
      }
    } else {
      const have = Q().reciters ? Q().reciters() : [], sel = rd('naseem-quran-reciter-v1', 'muhammad-al-luhaidan');
      h += '<div class="qs-list" role="listbox" aria-label="Reciters">' + have.map(q => '<button type="button" role="option" class="qs-opt' + (q.id === sel ? ' on' : '') + '" aria-selected="' + (q.id === sel) + '" data-qs-qari="' + esc(q.id) + '"><span>' + esc(q.name) + '</span>' + (q.id === sel ? '<b aria-hidden="true">✓</b>' : '') + '</button>').join('') + '</div><p class="qs-note">' + have.length + ' reciters. Audio: Islamic Network CDN via AlQuran Cloud.</p>';
    }
    bodyEl.innerHTML = h; bodyEl.scrollTop = keep;
  }
  function onBody(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.qsLayout) { setLayout(t.dataset.qsLayout).then(paint); return; }
    if (t.dataset.qsScript) { setScript(t.dataset.qsScript).then(paint); return; }
    if (t.dataset.qsMem) { const b = $(t.dataset.qsMem === 'hide' ? 'quranMemMode' : 'quranMemSurah'); if (b) b.click(); setTimeout(paint, 60); return; }
    if (t.hasAttribute('data-qs-follow')) { const f = $('quranFollow'); if (f) f.click(); setTimeout(paint, 30); return; }
    if (t.hasAttribute('data-qs-tron')) { const on = edNow() !== 'translation'; S.trOn = on; setEdition(on ? 'translation' : 'arabic'); if (on && !S.tr.length) quickAdd('english'); save(); setTimeout(() => { refresh(); paint(); }, 60); return; }
    if (t.dataset.qsTrdel) { S.tr = S.tr.filter(x => x !== t.dataset.qsTrdel); save(); syncTr(); refresh(); paint(); return; }
    if (t.dataset.qsQuick) { quickAdd(t.dataset.qsQuick); S.trOn = true; setEdition('translation'); save(); syncTr(); setTimeout(() => { refresh(); paint(); }, 60); return; }
    if (t.dataset.qsTfquick && lists) { const f = find(lists.tf, t.dataset.qsTfquick, t.dataset.qsTfquick === 'english' ? /kathir/i : /kathir|bayan|tafheem|maududi|israr/i); if (f) { wr(K_TAFSIR, f.id); toast(f.name); } else toast('No ' + t.dataset.qsTfquick + ' tafsir found in the list.'); paint(); return; }
    if (t.dataset.qsQari) { const b = document.querySelector('#quranQariMenu [data-qari-id="' + t.dataset.qsQari.replace(/"/g, '') + '"]'); if (b) b.click(); setTimeout(paint, 40); return; }
  }
  function quickAdd(lang) {
    if (!lists) return; if (S.tr.length >= MAXTR) { toast('Remove one translation first.'); return; }
    const rx = lang === 'english' ? /pickthall|saheeh|clear quran|khattab/i : /junagarhi|jalandhari|maududi|tafheem|bayan|israr/i;
    const taken = new Set(S.tr), pool = lists.tr.filter(t => !taken.has(t.id));
    const f = find(pool, lang, rx); if (!f) { toast('No ' + lang + ' translation available to add.'); return; }
    S.tr.push(f.id); wr(K_TR, S.tr[0]);
  }
  function syncTr() { if (S.tr.length) wr(K_TR, S.tr[0]); }
  function onChange(e) {
    const t = e.target;
    if (t.id === 'qsTrAdd' && t.value) { if (S.tr.length < MAXTR && !S.tr.includes(t.value)) S.tr.push(t.value); S.trOn = true; setEdition('translation'); save(); syncTr(); setTimeout(() => { refresh(); paint(); }, 60); }
    else if (t.id === 'qsTf' && t.value) { wr(K_TAFSIR, t.value); paint(); }
    else if (t.id === 'qsStyle') { const v = t.value; if (Q().setMushaf) Q().setMushaf(v, v === 'indopak15' ? 'line' : 'page').then(() => { paint(); refresh(); }); }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'qsArSize') { const fs = $('quranFontSize'); if (fs) { fs.value = t.value; fs.dispatchEvent(new Event('input', { bubbles: true })); } }
    else if (t.id === 'qsTrSize') { S.trSize = Math.max(0.85, Math.min(1.5, Number(t.value) || 1)); save(); applySize(); }
  }
  function applySize() { document.documentElement.style.setProperty('--qs-tr-size', String(S.trSize)); }

  /* ---------- start ---------- */
  applySize();
  const boot = () => { const a = mountBars(), b = watch(); return a && b; };
  if (!boot()) { const mo = new MutationObserver(() => { if (boot()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); }
  document.addEventListener('noor:screen', () => setTimeout(() => { mountBars(); enhance(); }, 50));
  window.NaseemQuranStudio = { open, close, wantsMushaf: () => S.layout === 'mushaf', state: () => JSON.parse(JSON.stringify(S)) };
})();
