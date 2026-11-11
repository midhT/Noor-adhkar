/* Naseem Hadith Library — HadeethEnc public API (Arabic, English, Urdu).
   Online-only by design until source terms and offline redistribution permissions are confirmed. */
(() => {
  'use strict';
  const API = 'https://hadeethenc.com/api/v1';
  const LANGS = Object.freeze({ ar: 'العربية', en: 'English', ur: 'اردو' });
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const screen = document.createElement('section');
  screen.className = 'screen v404-screen';
  screen.id = 'hadithLibraryScreen';
  screen.innerHTML = `
    <button class="back-link" type="button" id="hadithBack">‹ More</button>
    <div class="screen-heading"><span class="eyebrow">CURATED HADITH RESOURCE</span><h1>Hadith Library</h1><p class="muted">Browse HadeethEnc in Arabic, English and Urdu.</p></div>
    <div class="v404-card">
      <label class="v404-label" for="hadithLanguage">Display language</label>
      <select class="v404-input" id="hadithLanguage"><option value="ar">العربية</option><option value="en" selected>English</option><option value="ur">اردو</option></select>
      <label class="v404-label" for="hadithCategory">Topic</label>
      <select class="v404-input" id="hadithCategory"><option value="">Loading topics…</option></select>
      <p class="v404-note" id="hadithStatus" aria-live="polite">Connect to the internet to load the latest entries.</p>
    </div>
    <div class="v404-list" id="hadithResults"></div>
    <div class="v404-card" id="hadithDetail" hidden></div>
    <div class="v404-card"><p class="v404-note">Source: HadeethEnc.com. This is a curated multilingual hadith encyclopedia, not a complete digital edition of Sahih al-Bukhari or Sahih Muslim. References and grading are shown only when supplied by the source. Translations may differ between editions. Content is fetched online; it is not bundled or represented as scholar-reviewed by Naseem.</p><a href="https://hadeethenc.com" target="_blank" rel="noopener">Visit HadeethEnc ↗</a></div>`;
  document.querySelector('main')?.appendChild(screen);
  const status = message => { const el=$('hadithStatus'); if(el)el.textContent=message; };
  const request = async (path) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  };
  let categories = [], page = 1, activeCategory = '', busy = false;
  const categorySelect = $('hadithCategory');
  async function loadCategories() {
    status('Loading topics from HadeethEnc…');
    try {
      const rows = await request(`/categories/roots/?language=${encodeURIComponent($('hadithLanguage').value)}`);
      if (!Array.isArray(rows) || !rows.length) throw new Error('No categories returned');
      categories = rows.filter(x => x && x.id != null && x.title);
      categorySelect.innerHTML = categories.map(x => `<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('');
      activeCategory = String(categories[0].id); page = 1;
      await loadList();
    } catch (_) { categorySelect.innerHTML='<option value="">Topics unavailable</option>'; status('Could not connect to HadeethEnc. Check your connection and try again.'); }
  }
  async function loadList() {
    if (!activeCategory || busy) return;
    busy = true; $('hadithDetail').hidden = true; $('hadithResults').innerHTML='';
    status('Loading hadith entries…');
    try {
      const data = await request(`/hadeeths/list/?language=${encodeURIComponent($('hadithLanguage').value)}&category_id=${encodeURIComponent(activeCategory)}&page=${page}&per_page=20`);
      const rows = Array.isArray(data?.data) ? data.data : [];
      if (!rows.length) { status('No entries are available in this topic yet.'); return; }
      $('hadithResults').innerHTML = rows.map(x => `<button type="button" class="v404-card hadith-result" data-hadith-id="${esc(x.id)}"><span class="eyebrow">HADITH · ${esc(x.id)}</span><strong>${esc(x.title || 'Untitled entry')}</strong><small>Open entry ↗</small></button>`).join('');
      const meta=data.meta||{};
      const pages=Number(meta.last_page||meta.total_pages||1);
      const controls=document.createElement('div');controls.className='v404-card v404-row';
      controls.innerHTML=`<button class="v404-secondary" type="button" id="hadithPrev" ${page<=1?'disabled':''}>Previous</button><span class="v404-note">Page ${page}${pages>1?` of ${pages}`:''}</span><button class="v404-secondary" type="button" id="hadithNext" ${rows.length<20?'disabled':''}>Next</button>`;
      $('hadithResults').appendChild(controls);
      $('hadithPrev')?.addEventListener('click',()=>{if(page>1){page--;loadList();}});
      $('hadithNext')?.addEventListener('click',()=>{page++;loadList();});
      status('Entries supplied by HadeethEnc. Select one to read its available translations.');
    } catch (_) { status('Hadith entries could not be loaded. Please try again.'); }
    finally { busy=false; }
  }
  async function loadDetail(id) {
    const detail=$('hadithDetail'); detail.hidden=false; detail.innerHTML='<p class="v404-note">Loading translations…</p>'; detail.scrollIntoView({behavior:'smooth',block:'start'});
    const languages=['ar','en','ur'];
    const results=await Promise.all(languages.map(async lang=>{try{return [lang,await request(`/hadeeths/one/?id=${encodeURIComponent(id)}&language=${lang}`)];}catch(_){return [lang,null];}}));
    const found=Object.fromEntries(results);
    const primary=found[$('hadithLanguage').value]||found.en||found.ar||found.ur;
    if(!primary){detail.innerHTML='<p class="v404-note">This entry could not be retrieved. Try again when connected.</p>';return;}
    const ar=found.ar||{};
    const title=primary.title||ar.title||'Hadith';
    const content=languages.filter(lang=>found[lang]).map(lang=>{
      const item=found[lang],text=item.hadeeth||item.hadith||item.text||'';
      const explanation=item.explanation||'';
      return `<article class="hadith-language-block" lang="${lang}" ${lang==='ar'||lang==='ur'?'dir="rtl"':''}><span class="eyebrow">${LANGS[lang]}</span>${text?`<p class="${lang==='ar'?'v404-arabic':''}">${esc(text)}</p>`:''}${explanation?`<p>${esc(explanation)}</p>`:''}</article>`;
    }).join('');
    const reference=ar.reference||primary.reference||'';
    const grade=ar.grade||primary.grade||'';
    detail.innerHTML=`<div class="v404-row"><span class="eyebrow">HADITH · ${esc(id)}</span><button class="v404-icon-btn" type="button" id="hadithClose" aria-label="Close entry">×</button></div><h2>${esc(title)}</h2>${content||'<p>Text unavailable in the selected languages.</p>'}<p class="v404-note">${reference?`Reference: ${esc(reference)} · `:''}${grade?`Grading: ${esc(grade)}`:''}</p>`;
    $('hadithClose')?.addEventListener('click',()=>{detail.hidden=true;});
  }
  $('hadithBack').addEventListener('click',()=>window.switchScreen('featuresScreen'));
  $('hadithLanguage').addEventListener('change',()=>{page=1;loadCategories();});
  categorySelect.addEventListener('change',()=>{activeCategory=categorySelect.value;page=1;loadList();});
  $('hadithResults').addEventListener('click',event=>{const button=event.target.closest('[data-hadith-id]');if(button)loadDetail(button.dataset.hadithId);});
  const grid=$('plannedFeatureGrid');
  if(grid){const card=document.createElement('button');card.type='button';card.className='feature-card feature-live';card.innerHTML='<span class="feature-icon">۞</span><span class="feature-name">Hadith Library</span><span class="feature-desc">Browse curated hadith entries in Arabic, English and Urdu.</span><span class="feature-state live">Open ↗</span>';card.addEventListener('click',()=>{window.switchScreen('hadithLibraryScreen');if(!categories.length)loadCategories();});grid.appendChild(card);}
  window.NaseemHadith={source:'HadeethEnc',languages:Object.keys(LANGS),load:loadCategories};
})();
