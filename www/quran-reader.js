/* Naseem Quran Reader and Quranic Dua additions.
   Online-only: AlQuran Cloud API. No API text is bundled or persisted. */
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
  section.innerHTML=`<button class="back-link" type="button" id="quranBack">‹ More</button>
    <div class="screen-heading"><span class="eyebrow">QURAN · READING</span><h1>Quran reader</h1><p class="muted">Browse the Qur’an by surah. An internet connection is required.</p></div>
    <div class="v404-card"><label class="v404-label" for="quranSurah">Choose a surah</label><select class="v404-input" id="quranSurah"><option value="">Loading surahs…</option></select>
    <div class="v404-row"><button class="v404-secondary" id="quranPrev" type="button" disabled>Previous</button><button class="v404-secondary" id="quranNext" type="button" disabled>Next</button></div>
    <label class="v404-label" for="quranEdition">Display</label><select class="v404-input" id="quranEdition"><option value="arabic">Arabic only</option><option value="translation">Arabic + English meaning</option></select>
    <p class="v404-note" id="quranStatus" aria-live="polite">Connecting to the Quran text service…</p></div>
    <div id="quranVerses" class="v404-list"></div>
    <div class="v404-card"><p class="v404-note">Arabic text is supplied live by AlQuran Cloud, sourced from GlobalQuran.com, Tanzil.net and Quran Academy. English edition: Marmaduke Pickthall. Translation is an interpretation of meaning, not a replacement for the Arabic Qur’an. Naseem does not modify or cache this API content. AlQuran Cloud permits free non-commercial display; commercial redistribution or paid offline corpus bundles need separate review.</p><a href="https://alquran.cloud" target="_blank" rel="noopener noreferrer">Source: AlQuran Cloud ↗</a> · <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer">Tanzil Project ↗</a></div>`;
  document.querySelector('main')?.appendChild(section);
  let surahs=[],current=1,busy=false;
  const status=m=>{if($('quranStatus'))$('quranStatus').textContent=m;};
  const surahSelect=$('quranSurah');
  async function loadSurahList(){
    try{const rows=await request('/surah');if(!Array.isArray(rows)||rows.length!==114)throw new Error('Unexpected surah list');surahs=rows;
      surahSelect.innerHTML=rows.map(x=>`<option value="${Number(x.number)}">${Number(x.number)}. ${esc(x.englishName||x.name)} · ${esc(x.name)}</option>`).join('');surahSelect.value=String(current);await loadSurah(current);
    }catch(_){surahSelect.innerHTML='<option value="">Unavailable</option>';status('Could not load the Quran index. Check your connection and retry.');}
  }
  async function loadSurah(number){if(busy)return;busy=true;current=Math.max(1,Math.min(114,Number(number)||1));$('quranVerses').innerHTML='';status('Loading surah…');$('quranPrev').disabled=current===1;$('quranNext').disabled=current===114;
    try{
      const editions=$('quranEdition').value==='translation'?'quran-uthmani,en.pickthall':'quran-uthmani';
      const result=await request(`/surah/${current}/editions/${editions}`);
      const items=Array.isArray(result)?result:[result];
      const arabic=items.find(x=>String(x.edition?.identifier||'').includes('uthmani')||x.englishName||x.name)?.ayahs||items[0]?.ayahs||[];
      const english=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs||[];
      if(!arabic.length)throw new Error('No verses returned');
      const englishByNo=new Map(english.map(x=>[Number(x.numberInSurah),x.text]));
      const title=arabic[0]?.surah?.englishName||surahs[current-1]?.englishName||`Surah ${current}`;
      $('quranVerses').innerHTML=`<div class="v404-card quran-surah-heading"><span class="eyebrow">SURAH ${current}</span><h2>${esc(title)}</h2><p class="v404-note">${esc(arabic[0]?.surah?.revelationType||'')} · ${arabic.length} verses</p></div>`+arabic.map(a=>`<article class="v404-card quran-ayah"><div class="v404-row"><span class="eyebrow">${current}:${Number(a.numberInSurah)}</span><span class="v404-reference">۞</span></div><p class="v404-arabic" lang="ar" dir="rtl" translate="no">${esc(a.text)}</p>${englishByNo.has(Number(a.numberInSurah))?`<p class="quran-translation">${esc(englishByNo.get(Number(a.numberInSurah)))}</p>`:''}</article>`).join('');
      status('Loaded from AlQuran Cloud. Content is not stored on this device.');surahSelect.value=String(current);
    }catch(_){status('This surah could not be loaded. Check your connection and try again.');$('quranVerses').innerHTML='<div class="v404-card">Quran text is temporarily unavailable.</div>';}
    finally{busy=false;}
  }
  $('quranBack').addEventListener('click',()=>window.switchScreen('featuresScreen'));
  surahSelect.addEventListener('change',()=>loadSurah(surahSelect.value));
  $('quranEdition').addEventListener('change',()=>loadSurah(current));
  $('quranPrev').addEventListener('click',()=>loadSurah(current-1));$('quranNext').addEventListener('click',()=>loadSurah(current+1));
  const grid=$('plannedFeatureGrid');if(grid){const card=document.createElement('button');card.type='button';card.className='feature-card feature-live';card.innerHTML='<span class="feature-icon">۞</span><span class="feature-name">Quran reader</span><span class="feature-desc">Read by surah with Arabic text and optional English meaning.</span><span class="feature-state live">Online reader ↗</span>';card.addEventListener('click',()=>{window.switchScreen('quranReaderScreen');if(!surahs.length)loadSurahList();});grid.appendChild(card);}
  document.querySelectorAll('[data-open-feature="quranReaderScreen"]').forEach(b=>b.addEventListener('click',()=>{window.switchScreen('quranReaderScreen');if(!surahs.length)loadSurahList();}));

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
  document.addEventListener('noor:screen',e=>{if(e.detail==='duaScreen')loadQuranDuas();});
  // Also cover app builds whose screen switch event is emitted before this module attaches.
  const duaEntry=document.querySelector('[data-open-v404="duas"]');duaEntry?.addEventListener('click',()=>setTimeout(loadQuranDuas,0));
  window.NaseemQuran={loadSurah,loadSurahList,loadQuranDuas,source:'AlQuran Cloud'};
})();
