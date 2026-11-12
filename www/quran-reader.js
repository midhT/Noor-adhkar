/* Naseem Quran Reader and Quranic Dua additions.
   AlQuran Cloud API; recently opened Surah text is cached locally, while recitation is fetched on demand. */
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
  const section=document.createElement('section');section.className='screen v404-screen';section.id='quranReaderScreen';
  section.innerHTML=`<div class="screen-heading quran-page-heading"><span class="eyebrow">THE HOLY QURAN</span><h1>Al-Quran</h1><p class="muted">Read, listen and return to where you left off.</p></div>
    <div class="quran-hero"><div><span class="eyebrow">YOUR READING</span><strong id="quranResumeLabel">Continue reading</strong><small id="quranResumeMeta">Al-Fatihah · Ayah 1</small></div><button class="quran-resume" id="quranResume" type="button">Resume ↗</button></div>
    <div class="quran-tabs" role="tablist" aria-label="Quran navigation"><button type="button" class="selected" data-quran-view="surah" aria-selected="true">Surah</button><button type="button" data-quran-view="juz" aria-selected="false">Juz</button><button type="button" data-quran-view="page" aria-selected="false">Page</button><button type="button" data-quran-view="bookmarks" aria-selected="false">Bookmarks</button></div>
    <div class="v404-card quran-controls"><div class="quran-control-view" data-quran-panel="surah"><label class="v404-label" for="quranSurah">Choose a surah</label><select class="v404-input" id="quranSurah"><option value="">Loading surahs…</option></select><div class="v404-row"><button class="v404-secondary" id="quranPrev" type="button" disabled>Previous Surah</button><button class="v404-secondary" id="quranNext" type="button" disabled>Next Surah</button></div></div><div class="quran-control-view" data-quran-panel="juz" hidden><label class="v404-label" for="quranJuz">Choose a Juz</label><div class="v404-row"><select class="v404-input" id="quranJuz">${Array.from({length:30},(_,i)=>`<option value="${i+1}">Juz ${i+1}</option>`).join('')}</select><button class="v404-primary" id="quranOpenJuz" type="button">Open Juz</button></div></div><div class="quran-control-view" data-quran-panel="page" hidden><label class="v404-label" for="quranPage">Go to page (1–604)</label><div class="v404-row"><input class="v404-input" id="quranPage" type="number" min="1" max="604" value="1" inputmode="numeric"><button class="v404-primary" id="quranOpenPage" type="button">Open page</button></div></div><div class="quran-control-view" data-quran-panel="bookmarks" hidden><div id="quranBookmarkList" class="quran-bookmark-list"><p class="v404-note">Your saved verses will appear here.</p></div></div><div class="quran-tools"><label class="quran-display-label" for="quranEdition">Translation</label><select class="v404-input" id="quranEdition"><option value="arabic">Arabic only</option><option value="translation">Arabic + English meaning</option></select><button class="v404-secondary quran-download" id="quranDownloadOffline" type="button">Save Quran text offline</button><label class="quran-font-label" for="quranFontSize">Arabic text size</label><input class="quran-font-range" id="quranFontSize" type="range" min="22" max="42" step="1" value="30"></div><p class="v404-note" id="quranOfflineStatus" aria-live="polite">Offline text is optional and stored on this device. Recitation audio requires internet.</p><p class="v404-note" id="quranStatus" aria-live="polite">Connecting to the Quran text service…</p></div>
    <div class="v404-card quran-player" id="quranPlayer" hidden><div class="v404-row"><strong id="quranNowPlaying">Quran recitation</strong><button type="button" class="v404-secondary" id="quranPauseResume">Pause</button></div><audio id="quranAudio" controls preload="none" aria-label="Quran recitation audio"></audio><label class="v404-label" for="quranSeek">Seek within this verse</label><input id="quranSeek" type="range" min="0" max="1000" value="0"><p class="v404-note" id="quranPlaybackStatus" aria-live="polite">Ready to play.</p></div>
    <div id="quranVerses" class="v404-list"></div>
    <div class="v404-card"><p class="v404-note">Translation is an interpretation of meaning, not a replacement for the Arabic Qur’an. Quran text can be saved to this device for offline reading. Audio is fetched on first play and is not included in the offline text download. Provider and contributor acknowledgements are listed in Settings → About Naseem → Credits &amp; Acknowledgements.</p></div>`;
  document.querySelector('main')?.appendChild(section);
  let surahs=[],current=1,busy=false;
  const PROGRESS_KEY='naseem-quran-progress-v1', CACHE_KEY='naseem-quran-cache-v1', BOOKMARK_KEY='naseem-quran-bookmarks-v1', FONT_KEY='naseem-quran-font-size-v1';
  const readJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(_){return fallback;}};
  let progress=readJSON(PROGRESS_KEY,{surah:1,ayah:1}), cache=readJSON(CACHE_KEY,{}), bookmarks=readJSON(BOOKMARK_KEY,[]), recitation=$('quranAudio'), audioQueue=[], audioIndex=0; recitation.preload='none';
  const DB_NAME='naseem-quran-offline-v1', DB_STORE='surahs';
  let dbPromise=null;
  function openOfflineDB(){if(!('indexedDB' in window))return Promise.reject(new Error('Offline storage is unavailable'));if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Database open failed'));});return dbPromise;}
  async function getOfflineSurah(key){const db=await openOfflineDB();return new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(key);req.onsuccess=()=>resolve(req.result?.payload||null);req.onerror=()=>reject(req.error);});}
  async function putOfflineSurah(key,payload){const db=await openOfflineDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put({key,payload,savedAt:Date.now()});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Offline save failed'));});}
  const saveProgress=(surah,ayah,juz=progress.juz||1)=>{progress={surah:Number(surah)||1,ayah:Number(ayah)||1,juz:Number(juz)||1,updatedAt:Date.now()};try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));}catch(_){}const resume=$('quranResume');if(resume)resume.textContent='Resume ↗';if($('quranResumeMeta'))$('quranResumeMeta').textContent=`Surah ${progress.surah} · Ayah ${progress.ayah}`;};
  const saveBookmarks=()=>{try{localStorage.setItem(BOOKMARK_KEY,JSON.stringify(bookmarks));}catch(_){}};
  const renderBookmarks=()=>{const host=$('quranBookmarkList');if(!host)return;host.innerHTML=bookmarks.length?bookmarks.map(b=>`<button type=\"button\" class=\"quran-bookmark-item\" data-open-bookmark=\"${Number(b.surah)}:${Number(b.ayah)}\"><strong>${esc(b.name||`Surah ${b.surah}`)}</strong><small>${Number(b.surah)}:${Number(b.ayah)}</small><span>Open ↗</span></button>`).join(''):'<p class=\"v404-note\">No saved verses yet. Tap ☆ beside an ayah to bookmark it.</p>';};
  const saveCache=(key,value)=>{try{cache[key]=value;const keys=Object.keys(cache);while(keys.length>10)delete cache[keys.shift()];localStorage.setItem(CACHE_KEY,JSON.stringify(cache));}catch(_){}};
  const status=m=>{if($('quranStatus'))$('quranStatus').textContent=m;};
  $('quranFontSize').value=String(Math.max(22,Math.min(42,Number(localStorage.getItem(FONT_KEY))||30)));document.documentElement.style.setProperty('--quran-font-size',`${$('quranFontSize').value}px`);$('quranResumeLabel').textContent=progress.updatedAt?'Continue your reading':'Begin with Al-Fatihah';$('quranResumeMeta').textContent=`Surah ${progress.surah||1} · Ayah ${progress.ayah||1}`;$('quranJuz').value=String(progress.juz||1);renderBookmarks();
  const surahSelect=$('quranSurah');
  async function loadSurahList(){
    try{const rows=await request('/surah');if(!Array.isArray(rows)||rows.length!==114)throw new Error('Unexpected surah list');surahs=rows;
      surahSelect.innerHTML=rows.map(x=>`<option value="${Number(x.number)}">${Number(x.number)}. ${esc(x.englishName||x.name)} · ${esc(x.name)}</option>`).join('');current=Math.max(1,Math.min(114,Number(progress.surah)||1));surahSelect.value=String(current);await loadSurah(current,Number(progress.ayah)||1);
    }catch(_){surahSelect.innerHTML='<option value="">Unavailable</option>';status('Could not load the Quran index. Check your connection and retry.');}
  }
  async function loadSurah(number,focusAyah=1){if(busy)return;stopRecitation();busy=true;current=Math.max(1,Math.min(114,Number(number)||1));$('quranVerses').innerHTML='';status('Loading surah…');$('quranPrev').disabled=current===1;$('quranNext').disabled=current===114;
    const edition=$('quranEdition').value==='translation'?'translation':'arabic',cacheKey=`${current}:${edition}`;
    try{
      const editions=edition==='translation'?'quran-uthmani,en.pickthall':'quran-uthmani';
      let payload=null;
      try{payload=await getOfflineSurah(cacheKey);if(payload)status('Offline mode · loaded from your saved Quran text.');}catch(_){}
      if(!payload){try{payload=await request(`/surah/${current}/editions/${editions}`);saveCache(cacheKey,payload);try{await putOfflineSurah(cacheKey,payload);}catch(_){}}
        catch(error){payload=cache[cacheKey];if(!payload)throw error;status('Offline mode · showing recently cached text for this surah.');}}
      const items=Array.isArray(payload)?payload:[payload];
      const arabic=items.find(x=>String(x.edition?.identifier||'').includes('uthmani')||x.englishName||x.name)?.ayahs||items[0]?.ayahs||[];
      const english=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs||[];
      if(!arabic.length)throw new Error('No verses returned');
      const englishByNo=new Map(english.map(x=>[Number(x.numberInSurah),x.text]));
      const title=arabic[0]?.surah?.englishName||surahs[current-1]?.englishName||`Surah ${current}`;
      $('quranVerses').innerHTML=`<div class="v404-card quran-surah-heading"><span class="eyebrow">SURAH ${current}</span><h2>${esc(title)}</h2><p class="v404-note">${esc(arabic[0]?.surah?.revelationType||'')} · ${arabic.length} verses</p></div>`+arabic.map(a=>`<article class="v404-card quran-ayah" id="quran-ayah-${Number(a.numberInSurah)}" data-ayah="${Number(a.numberInSurah)}"><div class="v404-row"><span class="eyebrow">${current}:${Number(a.numberInSurah)}</span><div class="quran-ayah-actions"><button type="button" class="v404-icon-btn" data-bookmark-ayah="${Number(a.numberInSurah)}" aria-label="Save ${current}:${Number(a.numberInSurah)}">☆</button><button type="button" class="v404-icon-btn" data-play-ayah="${Number(a.numberInSurah)}" aria-label="Play recitation for ${current}:${Number(a.numberInSurah)}">▶</button></div></div><p class="v404-arabic" lang="ar" dir="rtl" translate="no">${esc(a.text)}</p>${englishByNo.has(Number(a.numberInSurah))?`<p class="quran-translation">${esc(englishByNo.get(Number(a.numberInSurah)))}</p>`:''}</article>`).join('');
      status('Loaded from AlQuran Cloud. This surah is saved locally for offline reading.');surahSelect.value=String(current);$('quranVerses').querySelectorAll('[data-bookmark-ayah]').forEach(b=>{if(bookmarks.some(x=>x.surah===current&&x.ayah===Number(b.dataset.bookmarkAyah)))b.textContent='★';});
      saveProgress(current,focusAyah);
      const target=$(`quran-ayah-${focusAyah}`);if(target){target.classList.add('quran-last-read');setTimeout(()=>target.scrollIntoView({block:'start',behavior:'smooth'}),80);}
    }catch(_){status('This surah is not cached yet. Connect to the internet and try again.');$('quranVerses').innerHTML='<div class="v404-card">Quran text is temporarily unavailable.</div>';}
    finally{busy=false;}
  }
  function highlightPlayingAyah(number){
    $('quranVerses').querySelectorAll('.quran-ayah.quran-playing').forEach(el=>el.classList.remove('quran-playing'));
    const active=$(`quran-ayah-${number}`);if(active){active.classList.add('quran-playing');active.scrollIntoView({block:'nearest',behavior:'smooth'});}
    $('quranNowPlaying').textContent=`Now playing · ${current}:${number}`;
    $('quranPlaybackStatus').textContent=`Reciting Surah ${current}, Ayah ${number}`;
    $('quranPauseResume').textContent=recitation.paused?'Resume':'Pause';
    saveProgress(current,number);
  }
  function playQueueItem(){
    const item=audioQueue[audioIndex];if(!item?.audio){finishQueue();return;}
    recitation.src=item.audio;$('quranSeek').value='0';highlightPlayingAyah(Number(item.numberInSurah));
    recitation.play().then(()=>{$('quranPlayer').hidden=false;$('quranPauseResume').textContent='Pause';status(`Playing recitation · ${current}:${item.numberInSurah}`);}).catch(()=>{status('Recitation could not start. Check your connection and audio settings.');$('quranPlaybackStatus').textContent='Playback could not start.';});
  }
  function finishQueue(){audioQueue=[];audioIndex=0;recitation.pause();$('quranPlayer').hidden=true;$('quranPauseResume').textContent='Resume';$('quranPlaybackStatus').textContent='Recitation finished.';$('quranVerses').querySelectorAll('.quran-ayah.quran-playing').forEach(el=>el.classList.remove('quran-playing'));}
  function stopRecitation(){if(!recitation)return;recitation.pause();recitation.removeAttribute('src');recitation.load();audioQueue=[];audioIndex=0;if($('quranPlayer'))$('quranPlayer').hidden=true;}
  recitation.addEventListener('ended',()=>{audioIndex++;if(audioIndex<audioQueue.length)playQueueItem();else finishQueue();});
  recitation.addEventListener('pause',()=>{if(audioQueue.length)$('quranPauseResume').textContent='Resume';});
  recitation.addEventListener('play',()=>{$('quranPauseResume').textContent='Pause';});
  recitation.addEventListener('timeupdate',()=>{const seek=$('quranSeek');if(Number.isFinite(recitation.duration)&&recitation.duration>0){seek.value=String(Math.round(recitation.currentTime/recitation.duration*1000));}});
  $('quranPauseResume').addEventListener('click',async()=>{if(recitation.paused){if(recitation.src){try{await recitation.play();}catch(_){status('Tap play again to resume recitation.');}}else if(audioQueue.length)playQueueItem();}else recitation.pause();});
  $('quranSeek').addEventListener('input',e=>{if(Number.isFinite(recitation.duration)&&recitation.duration>0)recitation.currentTime=(Number(e.target.value)/1000)*recitation.duration;});
  $('quranVerses').addEventListener('click',async e=>{
    const bookmark=e.target.closest('[data-bookmark-ayah]');
    if(bookmark){const ayah=Number(bookmark.dataset.bookmarkAyah),key=`${current}:${ayah}`;const index=bookmarks.findIndex(b=>`${b.surah}:${b.ayah}`===key);if(index>=0){bookmarks.splice(index,1);bookmark.textContent='☆';}else{bookmarks.push({surah:current,ayah,name:surahs[current-1]?.englishName||`Surah ${current}`});bookmark.textContent='★';}saveBookmarks();renderBookmarks();return;}
    const play=e.target.closest('[data-play-ayah]');const verse=e.target.closest('[data-ayah]');
    if(verse)saveProgress(current,Number(verse.dataset.ayah));if(!play)return;
    const n=Number(play.dataset.playAyah),audioKey=`audio:${current}`;
    if(audioQueue.length&&audioQueue[audioIndex]?.numberInSurah===n&&!recitation.paused){recitation.pause();return;}
    let aud=cache[audioKey];
    if(!aud){status('Loading recitation…');try{aud=await request(`/surah/${current}/ar.alafasy`);saveCache(audioKey,aud);}catch(_){status('Recitation audio is unavailable. Text reading remains available.');return;}}
    const items=Array.isArray(aud)?aud:[aud],ayahs=items.find(x=>Array.isArray(x?.ayahs))?.ayahs||items[0]?.ayahs||[];
    audioQueue=ayahs.filter(x=>Number(x.numberInSurah)>=n&&x.audio);audioIndex=0;
    if(!audioQueue.length){status('Recitation audio is unavailable. Text reading remains available.');return;}
    $('quranPlayer').hidden=false;playQueueItem();
  });
  $('quranResume').addEventListener('click',()=>loadSurah(progress.surah||1,progress.ayah||1));
  $('quranDownloadOffline').addEventListener('click',async()=>{
    const button=$('quranDownloadOffline'),label=$('quranOfflineStatus');if(button.disabled)return;button.disabled=true;
    try{await openOfflineDB();let saved=0;for(let n=1;n<=114;n++){label.textContent=`Saving Quran text offline · ${n}/114 surahs`;const key=`${n}:arabic`;let payload=await getOfflineSurah(key);if(!payload){payload=await request(`/surah/${n}/editions/quran-uthmani`);await putOfflineSurah(key,payload);}saved++;}
      label.textContent=`Complete Arabic Quran text saved on this device (${saved} surahs). English meanings are cached as you open them. Audio is not downloaded.`;
    }catch(error){label.textContent='Offline download paused. Check your connection or device storage, then try again; already saved surahs are kept.';}
    finally{button.disabled=false;}
  });
  $('quranOpenJuz').addEventListener('click',async()=>{const juz=Number($('quranJuz').value)||1;status(`Finding the beginning of Juz ${juz}…`);try{const result=await request(`/juz/${juz}/quran-uthmani`),ayahs=result?.ayahs||[];if(!ayahs.length)throw new Error('No Juz data');const first=ayahs[0];saveProgress(first.surah?.number||current,first.numberInSurah||1,juz);await loadSurah(first.surah?.number||current,first.numberInSurah||1);status(`Juz ${juz} begins at Surah ${first.surah?.englishName||first.surah?.number}, Ayah ${first.numberInSurah}.`);}catch(_){status('Juz navigation is unavailable. Check your connection and try again.');}});
  // Ayah-jump controls are not part of this reader UI; do not bind listeners to absent elements.
  $('quranOpenPage').addEventListener('click',async()=>{const page=Number($('quranPage').value);if(!Number.isInteger(page)||page<1||page>604){status('Choose a page between 1 and 604.');return;}status(`Finding page ${page}…`);try{const result=await request(`/page/${page}/quran-uthmani`),first=result?.ayahs?.[0];if(!first)throw new Error('Page unavailable');$('quranJuz').value=String(first.juz||1);saveProgress(first.surah.number,first.numberInSurah,first.juz||1);await loadSurah(first.surah.number,first.numberInSurah);status(`Page ${page} · ${first.surah.englishName}, Ayah ${first.numberInSurah}.`);}catch(_){status('Page navigation is unavailable. Check your connection.');}});
  $('quranBookmarkList').addEventListener('click',e=>{const item=e.target.closest('[data-open-bookmark]');if(!item)return;const [surah,ayah]=item.dataset.openBookmark.split(':').map(Number);switchQuranView('surah');loadSurah(surah,ayah);});
  function switchQuranView(view){document.querySelectorAll('[data-quran-view]').forEach(b=>{const on=b.dataset.quranView===view;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});document.querySelectorAll('[data-quran-panel]').forEach(p=>p.hidden=p.dataset.quranPanel!==view);if(view==='bookmarks')renderBookmarks();}
  document.querySelectorAll('[data-quran-view]').forEach(b=>b.addEventListener('click',()=>switchQuranView(b.dataset.quranView)));
  surahSelect.addEventListener('change',()=>loadSurah(surahSelect.value));
  $('quranEdition').addEventListener('change',()=>loadSurah(current));
  $('quranFontSize').addEventListener('input',e=>{const size=Math.max(22,Math.min(42,Number(e.target.value)||30));document.documentElement.style.setProperty('--quran-font-size',`${size}px`);try{localStorage.setItem(FONT_KEY,String(size));}catch(_){}});
  $('quranPrev').addEventListener('click',()=>loadSurah(current-1));$('quranNext').addEventListener('click',()=>loadSurah(current+1));


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
  document.addEventListener('noor:screen',e=>{if(e.detail==='duaScreen')loadQuranDuas();if(e.detail==='quranReaderScreen'&&!surahs.length)loadSurahList();});
  // Also cover app builds whose screen switch event is emitted before this module attaches.
  const duaEntry=document.querySelector('[data-open-v404="duas"]');duaEntry?.addEventListener('click',()=>setTimeout(loadQuranDuas,0));
  window.NaseemQuran={loadSurah,loadSurahList,loadQuranDuas,source:'AlQuran Cloud'};
})();
