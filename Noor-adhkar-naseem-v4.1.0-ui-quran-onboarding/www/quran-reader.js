/* Naseem Quran Reader, recitation follow-along, memorisation and Quranic Dua additions.
   AlQuran Cloud API; opened Surah text is cached locally (and can be saved in full), while recitation is fetched on demand.
   Layout: Quran index (Surah / Juz / Page / Bookmarks / Memory) -> reader -> memorisation review. */
(() => {
  'use strict';
  const API='https://api.alquran.cloud/v1';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const request=async path=>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    try{const r=await fetch(`${API}${path}`,{headers:{Accept:'application/json'},signal:controller.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json();if(j.code&&j.code!==200)throw new Error('API response error');return j.data;}
    finally{clearTimeout(timer);}
  };
  const Mem=window.NaseemQuranMemory;
  const svg=(d,extra='')=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const ICON={
    back:svg('<path d="m15 5-7 7 7 7"/>'),
    play:svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
    pause:svg('<path d="M8 5.5v13M16 5.5v13" stroke-width="3.2"/>'),
    prev:svg('<path d="M7 5.5v13M18 5.5 9.5 12l8.5 6.5z" fill="currentColor"/>'),
    next:svg('<path d="M17 5.5v13M6 5.5 14.5 12 6 18.5z" fill="currentColor"/>'),
    sliders:svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    bookmark:svg('<path d="M7 4.5h10v15l-5-3.6-5 3.6z"/>'),
    bookmarkOn:svg('<path d="M7 4.5h10v15l-5-3.6-5 3.6z" fill="currentColor"/>'),
    plus:svg('<path d="M12 5v14M5 12h14"/>'),
    check:svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    close:svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    locate:svg('<circle cx="12" cy="12" r="6.2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3"/>'),
    eyeOff:svg('<path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/><path d="M4 4l16 16"/>'),
    book:svg('<path d="M4 5.5c3.2-1.5 6-.8 8 1.2v13c-2-2-4.8-2.7-8-1.2z"/><path d="M20 5.5c-3.2-1.5-6-.8-8 1.2v13c2-2 4.8-2.7 8-1.2z"/>'),
    search:svg('<circle cx="11" cy="11" r="6.2"/><path d="m16 16 4 4"/>'),
    star:'<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M20 2.5l4.6 5.2 6.9-.9.9 6.9 5.2 4.6-5.2 4.6-.9 6.9-6.9-.9L20 37.5l-4.6-5.2-6.9.9-.9-6.9L2.5 21.7 7.7 17.1l.9-6.9 6.9.9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };
  const section=document.createElement('section');section.className='screen v404-screen';section.id='quranReaderScreen';
  section.innerHTML=`<div class="qr-home" id="quranHome">
      <div class="screen-heading quran-page-heading"><span class="eyebrow">THE HOLY QURAN</span><h1>Al-Quran</h1><p class="muted">Read, listen, memorise and return to where you left off.</p></div>
      <div class="quran-hero"><span class="quran-hero-mark">${ICON.book}</span><div class="quran-hero-copy"><span class="eyebrow" id="quranResumeLabel">BEGIN READING</span><strong id="quranResumeName">Al-Fatihah</strong><small id="quranResumeMeta">Ayah No. 1</small></div><button class="quran-resume" id="quranResume" type="button">Read</button></div>
      <button type="button" class="qr-due" id="quranDueChip" hidden></button>
      <div class="quran-tabs" role="tablist" aria-label="Quran navigation"><button type="button" class="selected" data-quran-view="surah" aria-selected="true">Surah</button><button type="button" data-quran-view="juz" aria-selected="false">Juz</button><button type="button" data-quran-view="page" aria-selected="false">Page</button><button type="button" data-quran-view="bookmarks" aria-selected="false">Bookmarks</button><button type="button" data-quran-view="memory" aria-selected="false">Memory</button></div>
      <div class="qr-panel" data-quran-panel="surah"><label class="qr-search">${ICON.search}<input id="quranSearch" type="search" placeholder="Search a surah by name or number" autocomplete="off" aria-label="Search surahs"></label><div id="quranSurahList" class="qr-list"><p class="v404-note">Loading surahs…</p></div></div>
      <div class="qr-panel" data-quran-panel="juz" hidden><div class="qr-juz-grid" id="quranJuzList">${Array.from({length:30},(_,i)=>`<button type="button" class="qr-juz" data-open-juz="${i+1}"><small>JUZ</small><strong>${i+1}</strong></button>`).join('')}</div></div>
      <div class="qr-panel" data-quran-panel="page" hidden><label class="v404-label" for="quranPage">Go to page (1–604)</label><div class="qr-page-row"><input class="v404-input" id="quranPage" type="number" min="1" max="604" value="1" inputmode="numeric"><button class="v404-primary" id="quranOpenPage" type="button">Open page</button></div><p class="v404-note">Opens the surah and ayah at the top of that page in the Madinah mushaf layout.</p></div>
      <div class="qr-panel" data-quran-panel="bookmarks" hidden><div id="quranBookmarkList" class="quran-bookmark-list"><p class="v404-note">Your saved verses will appear here.</p></div></div>
      <div class="qr-panel" data-quran-panel="memory" hidden><div id="quranMemory"></div></div>
      <div class="qr-offline"><button class="v404-secondary quran-download" id="quranDownloadOffline" type="button">Save Quran text offline</button><p class="v404-note" id="quranOfflineStatus" aria-live="polite">Offline text is optional and stored on this device, with English meanings. Recitation audio requires internet.</p><p class="v404-note" id="quranStatus" aria-live="polite"></p></div>
      <p class="v404-note qr-foot">Translation is an interpretation of meaning, not a replacement for the Arabic Qur’an. Quran text can be saved to this device for offline reading. Audio is fetched on first play and is not included in the offline text download. Provider and contributor acknowledgements are listed in Settings → About Naseem → Credits &amp; Acknowledgements.</p>
    </div>
    <div class="qr-reader" id="quranReader" hidden>
      <div class="qr-bar-spacer"></div>
      <div class="qr-settings" id="quranSettings" hidden>
        <div class="qr-set-row"><span>Arabic size</span><div class="qr-size"><small>A</small><input class="quran-font-range" id="quranFontSize" type="range" min="22" max="42" step="1" value="30" aria-label="Arabic text size"><b>A</b></div></div>
        <div class="qr-set-row"><span>Display</span><div class="qr-seg" id="quranEditionSeg"><button type="button" data-quran-edition="arabic">Arabic</button><button type="button" data-quran-edition="translation">+ English</button></div></div>
        <div class="qr-set-row"><span>Keep recitation centred</span><button type="button" class="qr-switch" id="quranFollow" role="switch" aria-checked="true" aria-label="Keep the recited ayah centred"><i></i></button></div>
        <div class="qr-set-row"><span>Memorise</span><div class="qr-seg qr-seg-actions"><button type="button" id="quranMemMode" aria-pressed="false">${ICON.eyeOff}<em>Hide text</em></button><button type="button" id="quranMemSurah">${ICON.plus}<em>Add surah</em></button></div></div>
        <p class="v404-note">Recitation follows each ayah as it is read. Tap the text size or display options to change how it looks.</p>
      </div>
      <p class="qr-status" id="quranReaderStatus" aria-live="polite"></p>
      <div id="quranSurahHead"></div>
      <div id="quranVerses" class="qr-verses"></div>
      <div class="qr-surah-nav"><button class="v404-secondary" id="quranPrev" type="button" disabled>Previous surah</button><button class="v404-secondary" id="quranNext" type="button" disabled>Next surah</button></div>
    </div>
    <div class="qr-review" id="quranReview" hidden></div>`;
  document.querySelector('main')?.appendChild(section);
  // Mini player lives outside the screen so it can float above the navigation bar.
  const player=document.createElement('div');player.id='quranPlayer';player.className='qr-player';player.hidden=true;
  player.innerHTML=`<input id="quranSeek" class="qr-seek" type="range" min="0" max="1000" value="0" aria-label="Seek within this verse"><div class="qr-player-main"><div class="qr-player-info"><strong id="quranNowPlaying">Quran recitation</strong><small id="quranPlaybackStatus" aria-live="polite">Ready to play.</small></div><button type="button" class="qr-pbtn" id="quranLocate" aria-label="Centre the ayah being recited">${ICON.locate}</button><button type="button" class="qr-pbtn" id="quranPrevAyah" aria-label="Previous ayah">${ICON.prev}</button><button type="button" class="qr-pbtn qr-pmain" id="quranPauseResume" aria-label="Play">${ICON.play}</button><button type="button" class="qr-pbtn" id="quranNextAyah" aria-label="Next ayah">${ICON.next}</button><button type="button" class="qr-pbtn" id="quranStop" aria-label="Stop recitation">${ICON.close}</button></div><audio id="quranAudio" preload="none" aria-label="Quran recitation audio"></audio>`;
  // The headers are fixed to the viewport. They live outside the screen element because the screen keeps a transform
  // after its entrance animation, which would turn "fixed" into "fixed to the screen".
  const readerBar=document.createElement('div');readerBar.id='quranReaderBar';readerBar.className='qr-bar';readerBar.hidden=true;
  readerBar.innerHTML=`<button type="button" class="qr-icon" id="quranBack" aria-label="Back to the Quran index">${ICON.back}</button><div class="qr-bar-title"><strong id="quranReaderTitle">Al-Quran</strong><small id="quranReaderSub"></small></div><button type="button" class="qr-icon" id="quranPlaySurah" aria-label="Play recitation">${ICON.play}</button><button type="button" class="qr-icon" id="quranSettingsBtn" aria-label="Reading settings" aria-expanded="false">${ICON.sliders}</button>`;
  const reviewBar=document.createElement('div');reviewBar.id='quranReviewBar';reviewBar.className='qr-bar';reviewBar.hidden=true;
  const shell=document.querySelector('.app-shell')||document.body;shell.appendChild(readerBar);shell.appendChild(reviewBar);shell.appendChild(player);

  const PROGRESS_KEY='naseem-quran-progress-v1', CACHE_KEY='naseem-quran-cache-v1', BOOKMARK_KEY='naseem-quran-bookmarks-v1', FONT_KEY='naseem-quran-font-size-v1';
  const SURAHS_KEY='naseem-quran-surahs-v1', EDITION_KEY='naseem-quran-edition-v1', FOLLOW_KEY='naseem-quran-follow-v1', MEMORY_KEY='naseem-quran-memory-v1';
  const readJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(_){return fallback;}};
  const writeJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const todayISO=()=>Mem.localISO(new Date());
  let surahs=readJSON(SURAHS_KEY,[]), current=1, busy=false, listLoaded=false;
  let progress=readJSON(PROGRESS_KEY,{surah:1,ayah:1}), cache=readJSON(CACHE_KEY,{}), bookmarks=readJSON(BOOKMARK_KEY,[]);
  let memory=Mem.sanitize(readJSON(MEMORY_KEY,{}),todayISO());
  let edition=(()=>{try{return localStorage.getItem(EDITION_KEY)==='arabic'?'arabic':'translation';}catch(_){return 'translation';}})();
  let autoFollow=(()=>{try{return localStorage.getItem(FOLLOW_KEY)!=='0';}catch(_){return true;}})();
  let recitation=$('quranAudio'), audioQueue=[], audioIndex=0, playMode='surah', playToken=0, activeEl=null, lastUserScroll=0, memoryMode=false, view='surah', surahMeta=null, session=null;
  recitation.preload='none';
  const DB_NAME='naseem-quran-offline-v1', DB_STORE='surahs';
  let dbPromise=null;
  function openOfflineDB(){if(!('indexedDB' in window))return Promise.reject(new Error('Offline storage is unavailable'));if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Database open failed'));});return dbPromise;}
  async function getOfflineSurah(key){const db=await openOfflineDB();return new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(key);req.onsuccess=()=>resolve(req.result?.payload||null);req.onerror=()=>reject(req.error);});}
  async function putOfflineSurah(key,payload){const db=await openOfflineDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put({key,payload,savedAt:Date.now()});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Offline save failed'));});}
  const saveCache=(key,value)=>{try{cache[key]=value;const keys=Object.keys(cache);while(keys.length>10)delete cache[keys.shift()];localStorage.setItem(CACHE_KEY,JSON.stringify(cache));}catch(_){}};
  const surahName=n=>surahs[n-1]?.englishName||`Surah ${n}`;
  const status=m=>{if($('quranStatus'))$('quranStatus').textContent=m;if($('quranReaderStatus'))$('quranReaderStatus').textContent=m;};
  const notify=m=>{status(m);if(typeof window.toast==='function')try{window.toast(m);}catch(_){}};

  /* ---------- progress, hero and bookmarks ---------- */
  const saveProgress=(surah,ayah,juz=progress.juz||1)=>{progress={surah:Number(surah)||1,ayah:Number(ayah)||1,juz:Number(juz)||1,updatedAt:Date.now()};writeJSON(PROGRESS_KEY,progress);renderHero();};
  function renderHero(){
    const has=!!progress.updatedAt;
    $('quranResumeLabel').textContent=has?'CONTINUE READING':'BEGIN READING';
    $('quranResumeName').textContent=has?surahName(progress.surah||1):'Al-Fatihah';
    $('quranResumeMeta').textContent=`Ayah No. ${has?(progress.ayah||1):1}`;
  }
  const saveBookmarks=()=>writeJSON(BOOKMARK_KEY,bookmarks);
  const isBookmarked=(surah,ayah)=>bookmarks.some(b=>b.surah===surah&&b.ayah===ayah);
  function renderBookmarks(){
    const host=$('quranBookmarkList');if(!host)return;
    host.innerHTML=bookmarks.length?bookmarks.map(b=>`<button type="button" class="quran-bookmark-item" data-open-bookmark="${Number(b.surah)}:${Number(b.ayah)}"><span class="qb-ic">${ICON.bookmarkOn}</span><span class="qb-copy"><strong>${esc(b.name||surahName(b.surah))}</strong><small>Ayah ${Number(b.ayah)} · ${Number(b.surah)}:${Number(b.ayah)}</small></span><span class="qb-go">Open</span></button>`).join(''):'<p class="v404-note">No saved verses yet. Tap the bookmark beside an ayah to save it.</p>';
  }

  /* ---------- Quran index ---------- */
  function renderSurahList(){
    const host=$('quranSurahList');if(!host)return;
    if(!surahs.length){host.innerHTML=`<p class="v404-note">The surah list needs a connection the first time. <button type="button" class="qr-link" data-retry-surahs>Try again</button></p>`;return;}
    const raw=($('quranSearch')?.value||'').trim(),q=raw.toLowerCase();
    const rows=surahs.filter(x=>!q||String(x.number)===q||String(x.englishName||'').toLowerCase().includes(q)||String(x.englishNameTranslation||'').toLowerCase().includes(q)||String(x.name||'').includes(raw));
    host.innerHTML=rows.length?rows.map(x=>{const n=Number(x.number);return `<div class="qr-row"><button type="button" class="qr-play" data-play-surah="${n}" aria-label="Play surah ${esc(x.englishName)}"><span class="qr-star">${ICON.star}</span><span class="qr-star-ic">${ICON.play}</span></button><button type="button" class="qr-row-main" data-open-surah="${n}"><strong>${n}. ${esc(x.englishName)}</strong><small>${esc(x.englishNameTranslation||'')} · ${Number(x.numberOfAyahs)} Ayahs</small></button><span class="qr-ar" lang="ar" dir="rtl" translate="no">${esc(x.name)}</span></div>`;}).join(''):'<p class="v404-note">No surah matches your search.</p>';
  }
  async function loadSurahList(){
    if(surahs.length)renderSurahList();
    try{const rows=await request('/surah');if(!Array.isArray(rows)||rows.length!==114)throw new Error('Unexpected surah list');surahs=rows;writeJSON(SURAHS_KEY,rows);listLoaded=true;renderSurahList();renderHero();renderMemory();}
    catch(_){if(!surahs.length){renderSurahList();status('Could not load the Quran index. Check your connection and retry.');}}
  }
  function switchQuranView(next){
    view=next;
    document.querySelectorAll('[data-quran-view]').forEach(b=>{const on=b.dataset.quranView===next;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});
    document.querySelectorAll('[data-quran-panel]').forEach(p=>p.hidden=p.dataset.quranPanel!==next);
    if(next==='bookmarks')renderBookmarks();if(next==='memory')renderMemory();
  }
  function syncImmersive(){const act=screenActive(),readerOn=act&&!$('quranReader').hidden,reviewOn=act&&!$('quranReview').hidden;document.body.classList.toggle('qr-immersive',readerOn||reviewOn);readerBar.hidden=!readerOn;reviewBar.hidden=!reviewOn;}
  function showHome(){$('quranReader').hidden=true;$('quranReview').hidden=true;$('quranHome').hidden=false;syncImmersive();window.scrollTo(0,0);renderMemory();}
  function showReader(){$('quranHome').hidden=true;$('quranReview').hidden=true;$('quranReader').hidden=false;syncImmersive();window.scrollTo(0,0);}
  const readerOpen=()=>!$('quranReader').hidden;
  const screenActive=()=>document.querySelector('.screen.active')?.id==='quranReaderScreen';

  /* ---------- text loading ---------- */
  async function peekPayload(key){try{const p=await getOfflineSurah(key);if(p)return p;}catch(_){}return cache[key]||null;}
  async function getSurahData(n,ed){
    const key=`${n}:${ed}`,editions=ed==='translation'?'quran-uthmani,en.pickthall':'quran-uthmani';
    let payload=null,note='';
    try{payload=await getOfflineSurah(key);if(payload)note='Loaded from your saved Quran text.';}catch(_){}
    if(!payload){
      try{payload=await request(`/surah/${n}/editions/${editions}`);saveCache(key,payload);try{await putOfflineSurah(key,payload);}catch(_){}note='Loaded from AlQuran Cloud and saved on this device.';}
      catch(error){
        payload=cache[key];if(payload)note='Offline · showing recently cached text for this surah.';
        if(!payload&&ed==='translation'){const arabicOnly=await peekPayload(`${n}:arabic`);if(arabicOnly){payload=arabicOnly;note='Offline · English meaning is not saved for this surah, showing Arabic.';}}
        if(!payload)throw error;
      }
    }
    const items=Array.isArray(payload)?payload:[payload];
    const arabicItem=items.find(x=>String(x.edition?.identifier||'').includes('uthmani')||x.englishName||x.name)||items[0]||{};
    const arabic=arabicItem.ayahs||[];
    const english=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs||[];
    if(!arabic.length)throw new Error('No verses returned');
    return {arabic,english,meta:arabicItem,note};
  }

  /* ---------- reader ---------- */
  const markerHTML=n=>`<span class="qr-end" aria-hidden="true">﴿${Mem.toArabicDigits(n)}﴾</span>`;
  function ayahHTML(a,englishByNo,surahNo){
    const n=Number(a.numberInSurah),parts=n===1?Mem.splitBismillah(surahNo,a.text):{bismillah:'',rest:a.text};
    const inDeck=Mem.has(memory,surahNo,n),marked=isBookmarked(surahNo,n);
    const head=parts.bismillah?`<p class="qr-bismillah" lang="ar" dir="rtl" translate="no">${esc(parts.bismillah)}</p>`:'';
    return `${head}<article class="quran-ayah" id="quran-ayah-${n}" data-ayah="${n}"><div class="qa-top"><span class="qa-badge">${surahNo}:${n}</span><div class="quran-ayah-actions"><button type="button" class="qa-btn" data-play-ayah="${n}" aria-label="Play recitation for ${surahNo}:${n}">${ICON.play}</button><button type="button" class="qa-btn${marked?' on':''}" data-bookmark-ayah="${n}" aria-pressed="${marked}" aria-label="Save ${surahNo}:${n}">${marked?ICON.bookmarkOn:ICON.bookmark}</button><button type="button" class="qa-btn${inDeck?' on':''}" data-mem-ayah="${n}" aria-pressed="${inDeck}" aria-label="${inDeck?'Remove from':'Add to'} memorisation ${surahNo}:${n}">${inDeck?ICON.check:ICON.plus}</button></div></div><p class="v404-arabic quran-arabic" lang="ar" dir="rtl" translate="no">${esc(parts.rest)} ${markerHTML(n)}</p>${englishByNo.has(n)?`<p class="quran-translation">${esc(englishByNo.get(n))}</p>`:''}<i class="qa-progress" aria-hidden="true"></i></article>`;
  }
  async function loadSurah(number,focusAyah=1){
    if(busy)return false;stopRecitation();busy=true;
    current=Math.max(1,Math.min(114,Number(number)||1));
    const host=$('quranVerses');host.innerHTML='<p class="v404-note qr-loading">Loading surah…</p>';$('quranSurahHead').innerHTML='';
    $('quranPrev').disabled=current===1;$('quranNext').disabled=current===114;
    $('quranReaderTitle').textContent=`${current}. ${surahName(current)}`;$('quranReaderSub').textContent=surahs[current-1]?.englishNameTranslation||'';
    status('Loading surah…');
    let ok=false;
    try{
      const {arabic,english,meta,note}=await getSurahData(current,edition);
      surahMeta=meta;
      const englishByNo=new Map(english.map(x=>[Number(x.numberInSurah),x.text]));
      const title=meta.englishName||surahs[current-1]?.englishName||`Surah ${current}`,trans=meta.englishNameTranslation||surahs[current-1]?.englishNameTranslation||'';
      $('quranReaderTitle').textContent=`${current}. ${title}`;$('quranReaderSub').textContent=`${trans?trans+' · ':''}${arabic.length} Ayahs · ${meta.revelationType||''}`.replace(/ · $/,'');
      host.innerHTML=arabic.map(a=>ayahHTML(a,englishByNo,current)).join('');
      host.classList.toggle('quran-hide-text',memoryMode);
      status(/^Offline/.test(note)?note:'');saveProgress(current,focusAyah);ok=true;
      const target=$(`quran-ayah-${focusAyah}`);
      if(target){target.classList.add('quran-last-read');if(focusAyah>1)setTimeout(()=>scrollToAyah(target),80);else window.scrollTo(0,0);}
    }catch(_){status('This surah is not cached yet. Connect to the internet and try again.');host.innerHTML='<div class="v404-card">Quran text is temporarily unavailable.</div>';}
    finally{busy=false;}
    return ok;
  }
  async function openReader(number,ayah=1,opts={}){
    showReader();const ok=await loadSurah(number,ayah);
    if(ok&&opts.play)await startPlayback(ayah);
    return ok;
  }

  /* ---------- recitation: highlight + keep the ayah centred ---------- */
  function scrollToAyah(el){
    if(!el||!el.isConnected)return;
    const bar=$('quranReaderBar'),top=bar?bar.getBoundingClientRect().bottom:0;
    const bottom=!player.hidden&&!player.classList.contains('qr-player-away')?player.getBoundingClientRect().top:window.innerHeight;
    const r=el.getBoundingClientRect(),area=bottom-top;
    // A tall ayah is aligned to its start under the header; otherwise it is centred between header and player.
    const delta=r.height>=area-24?r.top-top-12:(r.top+r.height/2)-(top+area/2);
    if(Math.abs(delta)<4)return;
    window.scrollBy({top:delta,behavior:'smooth'});
  }
  const shouldFollow=()=>autoFollow&&readerOpen()&&screenActive()&&Date.now()-lastUserScroll>4500;
  const markUserScroll=()=>{lastUserScroll=Date.now();};
  window.addEventListener('touchstart',markUserScroll,{passive:true});window.addEventListener('touchmove',markUserScroll,{passive:true});window.addEventListener('wheel',markUserScroll,{passive:true});
  function clearPlaying(){
    document.querySelectorAll('#quranVerses .quran-ayah.quran-playing').forEach(el=>{el.classList.remove('quran-playing');el.style.removeProperty('--qp');});
    document.querySelectorAll('#quranVerses [data-play-ayah]').forEach(b=>{b.innerHTML=ICON.play;b.classList.remove('on');});
    activeEl=null;
  }
  function setPlayIcon(playing){
    const b=$('quranPauseResume');b.innerHTML=playing?ICON.pause:ICON.play;b.setAttribute('aria-label',playing?'Pause':'Play');
    $('quranPlaySurah').innerHTML=playing?ICON.pause:ICON.play;
    if(activeEl){const btn=activeEl.querySelector('[data-play-ayah]');if(btn){btn.innerHTML=playing?ICON.pause:ICON.play;btn.classList.toggle('on',playing);}}
  }
  function highlightPlayingAyah(number,force){
    clearPlaying();
    const item=audioQueue[audioIndex],surahNo=item?.surah||current;
    $('quranNowPlaying').textContent=`${surahNo}. ${surahName(surahNo)}`;
    $('quranPlaybackStatus').textContent=`Reciting ayah ${number}`;
    if(surahNo===current){
      const active=$(`quran-ayah-${number}`);
      if(active){active.classList.add('quran-playing');active.style.setProperty('--qp','0%');activeEl=active;if(force||shouldFollow())scrollToAyah(active);}
      saveProgress(current,number);
    }
    setPlayIcon(!recitation.paused);
  }
  function showPlayer(){player.hidden=false;updatePlayerVisibility();}
  function updatePlayerVisibility(){player.classList.toggle('qr-player-away',!screenActive()||!readerOpen());syncImmersive();}
  function playQueueItem(force=true){
    const item=audioQueue[audioIndex];if(!item?.audio){finishQueue();return;}
    const token=++playToken;
    recitation.src=item.audio;$('quranSeek').value='0';highlightPlayingAyah(Number(item.numberInSurah),force);
    recitation.play().then(()=>{if(token!==playToken)return;showPlayer();setPlayIcon(true);status(`Playing recitation · ${item.surah||current}:${item.numberInSurah}`);}).catch(()=>{if(token!==playToken)return;setPlayIcon(false);status('Recitation could not start. Check your connection and audio settings.');$('quranPlaybackStatus').textContent='Playback could not start.';});
  }
  function finishQueue(){audioQueue=[];audioIndex=0;playToken++;recitation.pause();player.hidden=true;setPlayIcon(false);$('quranPlaybackStatus').textContent='Recitation finished.';clearPlaying();}
  function stopRecitation(){if(!recitation)return;playToken++;recitation.pause();recitation.removeAttribute('src');recitation.load();audioQueue=[];audioIndex=0;if(player)player.hidden=true;try{setPlayIcon(false);}catch(_){}clearPlaying();}
  async function loadAudioAyahs(surah){
    const audioKey=`audio:${surah}`;let aud=cache[audioKey];
    if(!aud){aud=await request(`/surah/${surah}/ar.alafasy`);saveCache(audioKey,aud);}
    const items=Array.isArray(aud)?aud:[aud];
    return items.find(x=>Array.isArray(x?.ayahs))?.ayahs||items[0]?.ayahs||[];
  }
  async function startPlayback(from=1){
    const surah=current;status('Loading recitation…');
    let ayahs;try{ayahs=await loadAudioAyahs(surah);}catch(_){status('Recitation audio is unavailable. Text reading remains available.');return false;}
    if(surah!==current)return false;
    audioQueue=ayahs.filter(x=>x.audio).map(x=>({...x,surah}));playMode='surah';
    audioIndex=Math.max(0,audioQueue.findIndex(x=>Number(x.numberInSurah)>=from));
    if(!audioQueue.length){status('Recitation audio is unavailable. Text reading remains available.');return false;}
    showPlayer();playQueueItem(true);return true;
  }
  async function continueToNextSurah(){
    const next=current+1;if(next>114||playMode!=='surah'){finishQueue();return;}
    const ok=await loadSurah(next,1);if(ok)await startPlayback(1);else finishQueue();
  }
  function stepAyah(d){
    if(!audioQueue.length){startPlayback(Math.max(1,progress.surah===current?progress.ayah:1));return;}
    const i=audioIndex+d;
    if(i<0){audioIndex=0;}else if(i>=audioQueue.length){continueToNextSurah();return;}else audioIndex=i;
    lastUserScroll=0;playQueueItem(true);
  }
  recitation.addEventListener('ended',()=>{if(playMode==='single'){finishQueue();return;}audioIndex++;if(audioIndex<audioQueue.length)playQueueItem(false);else continueToNextSurah();});
  recitation.addEventListener('pause',()=>{if(audioQueue.length)setPlayIcon(false);});
  recitation.addEventListener('play',()=>{setPlayIcon(true);});
  recitation.addEventListener('timeupdate',()=>{if(Number.isFinite(recitation.duration)&&recitation.duration>0){const frac=recitation.currentTime/recitation.duration;$('quranSeek').value=String(Math.round(frac*1000));if(activeEl)activeEl.style.setProperty('--qp',`${(frac*100).toFixed(1)}%`);}});
  $('quranPauseResume').addEventListener('click',async()=>{if(recitation.paused){if(recitation.src){try{await recitation.play();}catch(_){status('Tap play again to resume recitation.');}}else if(audioQueue.length)playQueueItem();}else recitation.pause();});
  $('quranSeek').addEventListener('input',e=>{if(Number.isFinite(recitation.duration)&&recitation.duration>0)recitation.currentTime=(Number(e.target.value)/1000)*recitation.duration;});
  $('quranPrevAyah').addEventListener('click',()=>stepAyah(-1));$('quranNextAyah').addEventListener('click',()=>stepAyah(1));
  $('quranStop').addEventListener('click',stopRecitation);
  $('quranLocate').addEventListener('click',()=>{lastUserScroll=0;if(activeEl)scrollToAyah(activeEl);});
  $('quranPlaySurah').addEventListener('click',()=>{if(audioQueue.length&&playMode==='surah'){$('quranPauseResume').click();}else startPlayback(Math.max(1,progress.surah===current?progress.ayah:1));});

  /* ---------- reader interactions ---------- */
  $('quranVerses').addEventListener('click',async e=>{
    const bookmark=e.target.closest('[data-bookmark-ayah]');
    if(bookmark){const ayah=Number(bookmark.dataset.bookmarkAyah),index=bookmarks.findIndex(b=>b.surah===current&&b.ayah===ayah);let on;if(index>=0){bookmarks.splice(index,1);on=false;}else{bookmarks.push({surah:current,ayah,name:surahName(current)});on=true;}bookmark.classList.toggle('on',on);bookmark.setAttribute('aria-pressed',String(on));bookmark.innerHTML=on?ICON.bookmarkOn:ICON.bookmark;saveBookmarks();renderBookmarks();return;}
    const mem=e.target.closest('[data-mem-ayah]');
    if(mem){const ayah=Number(mem.dataset.memAyah);let on;if(Mem.has(memory,current,ayah)){Mem.remove(memory,current,ayah);on=false;}else{Mem.add(memory,current,ayah,todayISO());on=true;}saveMemory();mem.classList.toggle('on',on);mem.setAttribute('aria-pressed',String(on));mem.innerHTML=on?ICON.check:ICON.plus;notify(on?`Added ${current}:${ayah} to your memorisation.`:`Removed ${current}:${ayah} from your memorisation.`);return;}
    const play=e.target.closest('[data-play-ayah]'),verse=e.target.closest('[data-ayah]');
    if(verse&&memoryMode&&e.target.closest('.quran-arabic'))verse.classList.toggle('revealed');
    if(verse)saveProgress(current,Number(verse.dataset.ayah));
    if(!play)return;
    const n=Number(play.dataset.playAyah);
    if(audioQueue.length&&Number(audioQueue[audioIndex]?.numberInSurah)===n&&audioQueue[audioIndex]?.surah===current){if(recitation.paused)recitation.play().catch(()=>{});else recitation.pause();return;}
    lastUserScroll=0;await startPlayback(n);
  });
  $('quranBack').addEventListener('click',showHome);
  $('quranSettingsBtn').addEventListener('click',()=>{const box=$('quranSettings'),open=box.hidden;box.hidden=!open;$('quranSettingsBtn').setAttribute('aria-expanded',String(open));});
  $('quranPrev').addEventListener('click',()=>loadSurah(current-1));$('quranNext').addEventListener('click',()=>loadSurah(current+1));
  const recentreSoon=(()=>{let t=null;return()=>{clearTimeout(t);t=setTimeout(()=>{if(activeEl&&autoFollow){lastUserScroll=0;scrollToAyah(activeEl);}},260);};})();
  const applyFont=size=>{document.documentElement.style.setProperty('--quran-font-size',`${size}px`);};
  const fontStart=Math.max(22,Math.min(42,Number((()=>{try{return localStorage.getItem(FONT_KEY);}catch(_){return null;}})())||30));
  $('quranFontSize').value=String(fontStart);applyFont(fontStart);
  $('quranFontSize').addEventListener('input',e=>{const size=Math.max(22,Math.min(42,Number(e.target.value)||30));applyFont(size);try{localStorage.setItem(FONT_KEY,String(size));}catch(_){}recentreSoon();});
  function syncEditionButtons(){document.querySelectorAll('[data-quran-edition]').forEach(b=>{const on=b.dataset.quranEdition===edition;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
  syncEditionButtons();
  $('quranEditionSeg').addEventListener('click',e=>{const b=e.target.closest('[data-quran-edition]');if(!b||b.dataset.quranEdition===edition)return;edition=b.dataset.quranEdition;try{localStorage.setItem(EDITION_KEY,edition);}catch(_){}syncEditionButtons();loadSurah(current,progress.surah===current?progress.ayah:1);});
  function syncFollow(){const sw=$('quranFollow');sw.setAttribute('aria-checked',String(autoFollow));sw.classList.toggle('on',autoFollow);}
  syncFollow();
  $('quranFollow').addEventListener('click',()=>{autoFollow=!autoFollow;try{localStorage.setItem(FOLLOW_KEY,autoFollow?'1':'0');}catch(_){}syncFollow();if(autoFollow&&activeEl){lastUserScroll=0;scrollToAyah(activeEl);}});
  $('quranMemMode').addEventListener('click',()=>{memoryMode=!memoryMode;$('quranMemMode').setAttribute('aria-pressed',String(memoryMode));$('quranMemMode').classList.toggle('selected',memoryMode);$('quranVerses').classList.toggle('quran-hide-text',memoryMode);$('quranVerses').querySelectorAll('.quran-ayah.revealed').forEach(x=>x.classList.remove('revealed'));$('quranMemMode').querySelector('em').textContent=memoryMode?'Show text':'Hide text';status(memoryMode?'Memory mode: Arabic text is hidden. Tap an ayah’s text to reveal it.':'Arabic text is visible.');});
  $('quranMemSurah').addEventListener('click',()=>{const total=Number(surahMeta?.numberOfAyahs)||Number(surahs[current-1]?.numberOfAyahs)||document.querySelectorAll('#quranVerses .quran-ayah').length;if(!total)return;const before=Object.keys(memory).length;Mem.addMany(memory,current,total,todayISO());saveMemory();const added=Object.keys(memory).length-before;$('quranVerses').querySelectorAll('[data-mem-ayah]').forEach(b=>{b.classList.add('on');b.setAttribute('aria-pressed','true');b.innerHTML=ICON.check;});notify(added?`Added ${added} ayahs of ${surahName(current)} to your memorisation.`:`${surahName(current)} is already in your memorisation.`);});

  /* ---------- memorisation ---------- */
  function saveMemory(){writeJSON(MEMORY_KEY,memory);renderMemory();}
  function renderMemory(){
    const host=$('quranMemory'),chip=$('quranDueChip');if(!host)return;
    const st=Mem.stats(memory,todayISO());
    if(chip){chip.hidden=!st.due;chip.innerHTML=st.due?`<b>${st.due}</b> ayah${st.due===1?'':'s'} due for review<span>Review ↗</span>`:'';}
    const rows=st.surahs.map(s=>`<div class="qr-row qm-row"><button type="button" class="qr-row-main" data-open-surah="${s.surah}"><strong>${s.surah}. ${esc(surahName(s.surah))}</strong><small>${s.total} ayah${s.total===1?'':'s'} · ${s.due?`${s.due} due`:'none due'}</small></button><button type="button" class="qa-btn" data-mem-remove-surah="${s.surah}" aria-label="Remove ${esc(surahName(s.surah))} from memorisation">${ICON.close}</button></div>`).join('');
    host.innerHTML=`<div class="qm-stats"><div><strong>${st.total}</strong><small>In memory</small></div><div><strong>${st.due}</strong><small>Due today</small></div><div><strong>${st.strong}</strong><small>Well known</small></div></div>
      <button type="button" class="v404-primary qm-start" id="quranReviewStart"${st.due?'':' disabled'}>${st.due?`Review ${Math.min(st.due,30)} ayah${Math.min(st.due,30)===1?'':'s'} now`:(st.total?'Nothing due today':'Review')}</button>
      ${st.total?`<div class="qr-list qm-list">${rows}</div>`:'<p class="v404-note qm-empty">Build your memorisation list from the reader: tap + beside any ayah, or open Reading settings → Add surah. Each ayah comes back for review at growing intervals (1, 3, 7, 14, 30, then 60 days) as you recall it. Hide text in the reader to test yourself.</p>'}`;
  }
  const reviewHost=()=>$('quranReview');
  async function getAyahText(s,a){
    let data;try{data=await getSurahData(s,'arabic');}catch(_){return null;}
    const ar=data.arabic.find(x=>Number(x.numberInSurah)===a);if(!ar)return null;
    const payload=await peekPayload(`${s}:translation`);let english='';
    if(payload){const items=Array.isArray(payload)?payload:[payload];const en=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs?.find(x=>Number(x.numberInSurah)===a);english=en?.text||'';}
    const parts=a===1?Mem.splitBismillah(s,ar.text):{rest:ar.text};
    return {arabic:parts.rest,english};
  }
  function startReview(){
    const due=Mem.dueItems(memory,todayISO()).slice(0,30);if(!due.length)return;
    session={queue:due.map(i=>({s:i.s,a:i.a,retry:false})),pos:0,remembered:0,again:0,total:due.length,revealed:false};
    $('quranHome').hidden=true;$('quranReader').hidden=true;reviewHost().hidden=false;syncImmersive();window.scrollTo(0,0);renderReviewCard();
  }
  function endReview(){session=null;stopRecitationIfSingle();showHome();switchQuranView('memory');}
  function stopRecitationIfSingle(){if(playMode==='single')stopRecitation();}
  async function renderReviewCard(){
    const host=reviewHost();if(!session)return;
    const item=session.queue[session.pos];
    if(!item){
      reviewBar.innerHTML=`<button type="button" class="qr-icon" data-review-close aria-label="Close review">${ICON.close}</button><div class="qr-bar-title"><strong>Review complete</strong><small>${session.total} ayah${session.total===1?'':'s'} reviewed</small></div>`;
      host.innerHTML=`<div class="qr-bar-spacer"></div><div class="qrv-card qrv-done"><strong>${session.remembered}</strong><span>recalled</span><p class="v404-note">${session.again?`${session.again} ayah${session.again===1?'':'s'} will come back tomorrow so you can strengthen them.`:'Every ayah in this session was recalled.'}</p><button type="button" class="v404-primary" data-review-close>Done</button></div>`;
      return;
    }
    session.revealed=false;const done=session.pos,pct=Math.round(done/session.queue.length*100);
    reviewBar.innerHTML=`<button type="button" class="qr-icon" data-review-close aria-label="Close review">${ICON.close}</button><div class="qr-bar-title"><strong>${esc(surahName(item.s))} · ${item.s}:${item.a}</strong><small>${done+1} of ${session.queue.length}</small></div>`;
    host.innerHTML=`<div class="qr-bar-spacer"></div><div class="qrv-progress"><i style="width:${pct}%"></i></div>
      <div class="qrv-card"><span class="eyebrow">RECITE FROM MEMORY</span><p class="qrv-prompt">Say this ayah aloud, then reveal it to check yourself.</p><div class="qrv-hint" id="qrvHint" hidden></div><div class="qrv-text" id="qrvText" hidden></div>
      <div class="qrv-tools"><button type="button" class="v404-secondary" id="qrvHear">${ICON.play}<span>Hear it</span></button><button type="button" class="v404-secondary" id="qrvHintBtn">First word</button></div>
      <button type="button" class="v404-primary qrv-reveal" id="qrvReveal">Reveal</button>
      <div class="qrv-rate" id="qrvRate" hidden><button type="button" class="v404-secondary" data-review-rate="0">Not yet</button><button type="button" class="v404-primary" data-review-rate="1">Remembered</button></div></div>`;
    const token=session;const info=await getAyahText(item.s,item.a);
    if(session!==token||!reviewHost().querySelector('#qrvText'))return;
    session.text=info;
    if(!info){$('qrvText').hidden=false;$('qrvText').innerHTML='<p class="v404-note">This ayah’s text is not available offline yet. Connect once to load it.</p>';}
  }
  reviewBar.addEventListener('click',e=>{if(e.target.closest('[data-review-close]'))endReview();});
  reviewHost().addEventListener('click',async e=>{
    if(!session)return;
    if(e.target.closest('[data-review-close]')){endReview();return;}
    const item=session.queue[session.pos];if(!item)return;
    if(e.target.closest('#qrvHintBtn')){const t=session.text;const h=$('qrvHint');h.hidden=false;h.textContent=t?String(t.arabic).trim().split(/\s+/)[0]:'—';h.setAttribute('lang','ar');h.setAttribute('dir','rtl');return;}
    if(e.target.closest('#qrvReveal')){const t=session.text;const box=$('qrvText');box.hidden=false;box.innerHTML=t?`<p class="v404-arabic" lang="ar" dir="rtl" translate="no">${esc(t.arabic)} ${markerHTML(item.a)}</p>${t.english?`<p class="quran-translation">${esc(t.english)}</p>`:''}`:'<p class="v404-note">Text unavailable offline.</p>';$('qrvHint').hidden=true;$('qrvReveal').hidden=true;$('qrvRate').hidden=false;session.revealed=true;return;}
    if(e.target.closest('#qrvHear')){
      try{const ayahs=await loadAudioAyahs(item.s),hit=ayahs.find(x=>Number(x.numberInSurah)===item.a&&x.audio);if(!hit){notify('Recitation audio is unavailable for this ayah.');return;}
        audioQueue=[{...hit,surah:item.s}];audioIndex=0;playMode='single';recitation.src=hit.audio;await recitation.play();}
      catch(_){notify('Recitation could not start. Check your connection.');}
      return;
    }
    const rate=e.target.closest('[data-review-rate]');
    if(rate&&session.revealed){
      const ok=rate.dataset.reviewRate==='1';
      if(ok){if(!item.retry)Mem.review(memory,item.s,item.a,true,todayISO());session.remembered++;}
      else{Mem.review(memory,item.s,item.a,false,todayISO());if(!item.retry){session.again++;session.queue.push({s:item.s,a:item.a,retry:true});}}
      writeJSON(MEMORY_KEY,memory);session.pos++;renderReviewCard();
    }
  });
  $('quranMemory').addEventListener('click',e=>{
    if(e.target.closest('#quranReviewStart')){startReview();return;}
    const rm=e.target.closest('[data-mem-remove-surah]');
    if(rm){const s=Number(rm.dataset.memRemoveSurah);Mem.removeSurah(memory,s);saveMemory();notify(`Removed ${surahName(s)} from your memorisation.`);return;}
    const open=e.target.closest('[data-open-surah]');if(open)openReader(Number(open.dataset.openSurah),1);
  });
  $('quranDueChip').addEventListener('click',()=>{switchQuranView('memory');startReview();});

  /* ---------- index interactions ---------- */
  $('quranSurahList').addEventListener('click',e=>{
    if(e.target.closest('[data-retry-surahs]')){loadSurahList();return;}
    const play=e.target.closest('[data-play-surah]');if(play){openReader(Number(play.dataset.playSurah),1,{play:true});return;}
    const open=e.target.closest('[data-open-surah]');if(open)openReader(Number(open.dataset.openSurah),1);
  });
  $('quranSearch').addEventListener('input',renderSurahList);
  $('quranResume').addEventListener('click',()=>openReader(progress.surah||1,progress.ayah||1));
  async function openJuz(juz){
    juz=Number(juz)||1;status(`Finding the beginning of Juz ${juz}…`);
    try{const result=await request(`/juz/${juz}/quran-uthmani`),ayahs=result?.ayahs||[];if(!ayahs.length)throw new Error('No Juz data');const first=ayahs[0];
      saveProgress(first.surah?.number||current,first.numberInSurah||1,juz);await openReader(first.surah?.number||current,first.numberInSurah||1);status(`Juz ${juz} begins at Surah ${first.surah?.englishName||first.surah?.number}, Ayah ${first.numberInSurah}.`);}
    catch(_){notify('Juz navigation is unavailable. Check your connection and try again.');}
  }
  $('quranJuzList').addEventListener('click',e=>{const b=e.target.closest('[data-open-juz]');if(b)openJuz(b.dataset.openJuz);});
  // Ayah-jump controls are not part of this reader UI; do not bind listeners to absent elements.
  $('quranOpenPage').addEventListener('click',async()=>{const page=Number($('quranPage').value);if(!Number.isInteger(page)||page<1||page>604){notify('Choose a page between 1 and 604.');return;}status(`Finding page ${page}…`);try{const result=await request(`/page/${page}/quran-uthmani`),first=result?.ayahs?.[0];if(!first)throw new Error('Page unavailable');saveProgress(first.surah.number,first.numberInSurah,first.juz||1);await openReader(first.surah.number,first.numberInSurah);status(`Page ${page} · ${first.surah.englishName}, Ayah ${first.numberInSurah}.`);}catch(_){notify('Page navigation is unavailable. Check your connection.');}});
  $('quranBookmarkList').addEventListener('click',e=>{const item=e.target.closest('[data-open-bookmark]');if(!item)return;const [surah,ayah]=item.dataset.openBookmark.split(':').map(Number);openReader(surah,ayah);});
  document.querySelectorAll('[data-quran-view]').forEach(b=>b.addEventListener('click',()=>switchQuranView(b.dataset.quranView)));
  $('quranDownloadOffline').addEventListener('click',async()=>{
    const button=$('quranDownloadOffline'),label=$('quranOfflineStatus');if(button.disabled)return;button.disabled=true;
    try{await openOfflineDB();let saved=0;
      for(let n=1;n<=114;n++){
        label.textContent=`Saving Quran text offline · ${n}/114 surahs`;
        const key=`${n}:translation`;let payload=await getOfflineSurah(key);
        if(!payload){payload=await request(`/surah/${n}/editions/quran-uthmani,en.pickthall`);await putOfflineSurah(key,payload);}
        const arabicKey=`${n}:arabic`;
        if(!(await getOfflineSurah(arabicKey))){const arabicOnly=(Array.isArray(payload)?payload:[payload]).filter(x=>String(x.edition?.identifier||'').includes('uthmani'));if(arabicOnly.length)await putOfflineSurah(arabicKey,arabicOnly);}
        saved++;
      }
      label.textContent=`Complete Quran text with English meanings saved on this device (${saved} surahs). Audio is not downloaded.`;
    }catch(error){label.textContent='Offline download paused. Check your connection or device storage, then try again; already saved surahs are kept.';}
    finally{button.disabled=false;}
  });

  // Android back button / gesture: step out of the reader or review before leaving the Quran tab.
  document.addEventListener('naseem:back',e=>{
    if(!screenActive())return;
    if(!reviewHost().hidden){e.preventDefault();e.stopImmediatePropagation();endReview();return;}
    if(readerOpen()){e.preventDefault();e.stopImmediatePropagation();showHome();}
  },true);
  window.addEventListener('resize',()=>{if(activeEl&&shouldFollow())scrollToAyah(activeEl);});

  renderHero();renderBookmarks();renderMemory();renderSurahList();

  // Quranic supplications are retrieved verbatim from the API, not retyped or translated by Naseem.
  const duaRefs={7:[23],20:[25,26,27,28],25:[74],26:[83],28:[24],40:[7,8,9],60:[4,5]};
  const duaTitles={
    '7:23':'Repentance','20:25':'Ease and clarity','20:26':'Ease and clarity','20:27':'Ease and clarity','20:28':'Ease and clarity',
    '25:74':'Family and righteousness','26:83':'Wisdom and the righteous','28:24':'Provision and goodness',
    '40:7':'Mercy and forgiveness','40:8':'Righteous company','40:9':'Protection from wrongdoing',
    '60:4':'Trust in Allah','60:5':'Steadfastness'
  };
  let duasLoaded=false;
  async function loadQuranDuas(){
    if(duasLoaded||!window.NaseemV404?.duas)return;duasLoaded=true;
    const statusEl=$('duaFeedStatus');if(statusEl)statusEl.textContent='Loading additional Quranic supplications…';
    const additions=[];
    for(const [surah,verses] of Object.entries(duaRefs)){
      try{const editions=await request(`/surah/${surah}/editions/quran-uthmani,en.pickthall`);const items=Array.isArray(editions)?editions:[editions];
        const ar=items.find(x=>String(x.edition?.identifier||'').includes('uthmani'))?.ayahs||items[0]?.ayahs||[];
        const en=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs||[];const enMap=new Map(en.map(x=>[Number(x.numberInSurah),x.text]));
        for(const n of verses){const verse=ar.find(x=>Number(x.numberInSurah)===n);if(!verse)continue;const key=`${surah}:${n}`;additions.push({id:`api-quran-${surah}-${n}`,category:duaTitles[key]||'Quranic supplication',ar:verse.text,latin:'',meaning:enMap.get(n)||'English meaning unavailable.',ref:`Qur’an ${key}`});}
      }catch(_){/* Keep built-in duas available if a source request fails. */}
      await new Promise(resolve=>setTimeout(resolve,350));
    }
    if(additions.length){const list=window.NaseemV404.duas;const ids=new Set(list.map(x=>x.id));for(const d of additions)if(!ids.has(d.id))list.push(d);$('duaSearch')?.dispatchEvent(new Event('input'));window.NaseemQuranDuas=additions;if(statusEl)statusEl.textContent='Additional Quranic supplications loaded from AlQuran Cloud. English meanings: Pickthall. Online only; built-in duas remain available offline.';}
    else if(statusEl)statusEl.textContent='Could not load additional Quranic supplications. Built-in duas remain available offline.';
  }
  document.addEventListener('noor:screen',e=>{
    if(e.detail==='duaScreen')loadQuranDuas();
    if(e.detail==='quranReaderScreen'&&!listLoaded)loadSurahList();
    updatePlayerVisibility();
  });
  // Also cover app builds whose screen switch event is emitted before this module attaches.
  const duaEntry=document.querySelector('[data-open-v404="duas"]');duaEntry?.addEventListener('click',()=>setTimeout(loadQuranDuas,0));
  window.NaseemQuran={loadSurah,loadSurahList,loadQuranDuas,openReader,startPlayback,scrollToAyah,source:'AlQuran Cloud',state:()=>({current,audioIndex,queue:audioQueue.length,playMode,memory:Object.keys(memory).length})};
})();
