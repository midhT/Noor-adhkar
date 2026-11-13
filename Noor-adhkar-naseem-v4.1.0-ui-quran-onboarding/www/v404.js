/* Naseem V4.0.6 feature centre. Offline-first tools; online access is optional and explicit. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORE = 'naseem-v404-settings';
  const read = () => { try { const v=JSON.parse(localStorage.getItem(STORE) || '{}'); return v&&typeof v==='object'&&!Array.isArray(v)?v:{}; } catch { return {}; } };
  const data = read();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch { notify('Device storage is full.'); } };
  const notify = message => { if (typeof window.toast === 'function') window.toast(message); else { const el=$('toast'); if(el){el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200);} } };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const screen = (id, title, eyebrow, body, backTarget='featuresScreen') => {
    if ($(id)) return $(id);
    const el=document.createElement('section'); el.className='screen v404-screen'; el.id=id;
    const backLabel=backTarget==='salahScreen'?'Salah':backTarget==='homeScreen'?'Home':'More';
    el.innerHTML=`<button class="back-link" type="button" data-v404-back>‹ ${backLabel}</button><div class="screen-heading"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1></div>${body}`;
    document.querySelector('main').appendChild(el);
    el.querySelector('[data-v404-back]').addEventListener('click',()=>window.switchScreen(backTarget));
    return el;
  };
  const open = id => { window.switchScreen(id); };

  // Hijri calendar uses the device's ICU Islamic calendar data; no network dependency.
  const hijriFmt = (() => { try { return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {day:'numeric',month:'long',year:'numeric'}); } catch { return new Intl.DateTimeFormat('en-u-ca-islamic', {day:'numeric',month:'long',year:'numeric'}); } })();
  const withAH = label => String(label).replace(/\s*AH$/i,'')+' AH';
  let hijriCorrection=Math.max(-1,Math.min(1,Number(data.hijriCorrection)||0));
  const correctedHijriDate=date=>{const d=new Date(date);d.setDate(d.getDate()+hijriCorrection);return d;};
  const hijriPartsRaw = date => { const p=Object.fromEntries(hijriFmt.formatToParts(date).map(x=>[x.type,x.value])); return {day:Number(p.day),month:p.month,year:Number(p.year),label:hijriFmt.format(date)}; };
  const hijriParts = date => hijriPartsRaw(correctedHijriDate(date));
  const hijriNumericFmt = (()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'});}catch{return new Intl.DateTimeFormat('en-u-ca-islamic',{day:'numeric',month:'numeric',year:'numeric'});}})();
  const hijriNumericRaw = date => {const p=Object.fromEntries(hijriNumericFmt.formatToParts(date).map(x=>[x.type,x.value]));return {day:Number(p.day),month:Number(p.month),year:Number(p.year)};};
  const hijriNumeric = date => hijriNumericRaw(correctedHijriDate(date));
  const HIJRI_MONTHS=['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab','Sha‘ban','Ramadan','Shawwal','Dhul-Qadah','Dhul-Hijjah'];
  const hijriMonthName=n=>HIJRI_MONTHS[n-1]||'Islamic month';
  const dayStart = d => new Date(d.getFullYear(),d.getMonth(),d.getDate());
  function updateHomeCalendar(){
    const homeDate=$('homeHijriDate');const hp=hijriNumeric(new Date());if(homeDate)homeDate.textContent=`${hp.day} ${hijriMonthName(hp.month)} ${hp.year} AH`;
    const ramadan=$('homeRamadanCard'),activeHijriMonth=hp.month;
    if(ramadan&&activeHijriMonth===9&&window.NoorSalah){const times=window.NoorSalah.timesFor(new Date());const fmt=v=>window.NoorTime?.to12?window.NoorTime.to12(v):v;ramadan.hidden=false;$('homeSehriTime').textContent=fmt(times.fajr);$('homeIftarTime').textContent=fmt(times.maghrib);}
    else if(ramadan)ramadan.hidden=true;
  }
  updateHomeCalendar();window.addEventListener('noor:schedule',updateHomeCalendar);window.setInterval(updateHomeCalendar,60000);
  const hijriBody = `<div class="v404-card"><div class="v404-row"><button class="v404-btn" id="hijriPrev" aria-label="Previous Hijri month">‹</button><div class="v404-centre"><strong id="hijriMonthTitle">Loading…</strong><small id="hijriGregorianTitle"></small></div><button class="v404-btn" id="hijriNext" aria-label="Next Hijri month">›</button></div><div class="v404-calendar" id="hijriGrid"></div><p class="v404-note" id="hijriToday"></p><div class="v404-row hijri-adjust-row"><span class="v404-note">Local date adjustment</span><button type="button" class="v404-chip" data-hijri-adjust="-1">−1 day</button><button type="button" class="v404-chip" data-hijri-adjust="0">Reset</button><button type="button" class="v404-chip" data-hijri-adjust="1">+1 day</button></div><p class="v404-note" id="hijriSyncStatus" role="status" aria-live="polite">Monthly calendar reference check pending.</p><button type="button" class="v404-secondary" id="hijriCheckOnline">Check calendar online</button></div><div class="v404-card"><span class="eyebrow">DATE CONVERSION</span><label class="v404-label" for="hijriDateInput">Gregorian date → Hijri</label><input class="v404-input" type="date" id="hijriDateInput"><strong id="hijriConversion"></strong><label class="v404-label" for="hijriYearInput">Hijri date → Gregorian</label><div class="v404-hijri-convert"><input class="v404-input" id="hijriDayInput" type="number" min="1" max="30" value="1" aria-label="Hijri day"><select class="v404-input" id="hijriMonthInput" aria-label="Hijri month">${HIJRI_MONTHS.map((name,i)=>`<option value="${i+1}">${name}</option>`).join('')}</select><input class="v404-input" id="hijriYearInput" type="number" min="1300" max="1600" aria-label="Hijri year"></div><button class="v404-secondary" id="hijriReverseBtn">Convert to Gregorian</button><strong id="hijriReverseResult"></strong></div><div class="v404-card"><span class="eyebrow">IMPORTANT DATES</span><div id="hijriEvents" class="v404-list"></div><p class="v404-note">Dates are calculated using the device's Islamic calendar data. Local moon sighting and regional conventions can shift observances by a day or more.</p></div>`;
  screen('hijriScreen','Hijri calendar','DATES & CONVERSION',hijriBody);
  // Month-based navigation: the view is a (year, month) pair, never a ±30-day offset, so months can't be skipped or repeated.
  const HIJRI_MIN_YEAR=1300,HIJRI_MAX_YEAR=1600,MEAN_MONTH=29.530589;
  const noon=d=>{const x=new Date(d);x.setHours(12,0,0,0);return x;};
  // Hijri -> Gregorian: converge on the date whose device-calendar parts match, instead of a fixed search window.
  function hijriToGregorian(year,month,day){
    if(!(year>=HIJRI_MIN_YEAR&&year<=HIJRI_MAX_YEAR&&month>=1&&month<=12&&day>=1&&day<=30))return null;
    const ord=(y,m)=>y*12+(m-1),target=ord(year,month),now=hijriNumeric(new Date());
    let guess=noon(new Date());guess.setDate(guess.getDate()+Math.round((target-ord(now.year,now.month))*MEAN_MONTH+(day-now.day)));
    for(let i=0;i<24;i++){
      const h=hijriNumeric(guess),delta=(ord(h.year,h.month)-target)*MEAN_MONTH+(h.day-day);
      if(h.year===year&&h.month===month&&h.day===day)return guess;
      let step=Math.round(delta);if(step===0)step=delta>0?1:-1;
      guess=new Date(guess);guess.setDate(guess.getDate()-step);
    }
    return null;
  }
  // Days in a Hijri month (29 or 30) as reported by the device calendar.
  function hijriMonthLength(year,month){return hijriToGregorian(year,month,30)?30:29;}
  const todayH=hijriNumeric(new Date());let viewYear=todayH.year,viewMonth=todayH.month;
  function shiftHijriMonth(delta){let m=viewMonth+delta,y=viewYear;if(m<1){m=12;y--;}if(m>12){m=1;y++;}if(y<HIJRI_MIN_YEAR||y>HIJRI_MAX_YEAR){notify('That is outside the supported calendar range.');return;}viewYear=y;viewMonth=m;renderHijri();}
  const HIJRI_REFERENCE_KEY='naseem-hijri-reference-v1';
  const readHijriReference=()=>{try{return JSON.parse(localStorage.getItem(HIJRI_REFERENCE_KEY)||'null');}catch(_){return null;}};
  async function refreshHijriReference(force=false){
    const now=new Date(),monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`,cached=readHijriReference();
    if(!force&&cached?.monthKey===monthKey&&Date.now()-Number(cached.checkedAt||0)<30*86400000){$('hijriSyncStatus').textContent=cached.summary;return;}
    if(!navigator.onLine){$('hijriSyncStatus').textContent=cached?.summary||'Offline. The device calendar remains available; online comparison will retry later.';return;}
    $('hijriSyncStatus').textContent='Checking the Umm al-Qura reference…';
    const date=`${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
    try{
      const response=await fetch(`https://api.aladhan.com/v1/gToH/${date}?calendarMethod=UAQ`,{cache:'no-store'});if(!response.ok)throw new Error('reference unavailable');
      const json=await response.json(),remote=json?.data?.hijri;if(!remote?.day||!remote?.month?.number||!remote?.year)throw new Error('invalid calendar reference');
      const local=hijriNumericRaw(now),same=Number(remote.day)===local.day&&Number(remote.month.number)===local.month&&Number(remote.year)===local.year;
      const summary=same?`Monthly check ${date}: device Umm al-Qura and AlAdhan UAQ agree. Local moon sighting may still differ.`:`Monthly check ${date}: AlAdhan UAQ reports ${remote.day} ${remote.month.en} ${remote.year} AH; device calendar reports ${local.day} ${HIJRI_MONTHS[local.month-1]} ${local.year} AH. Use the ±1 day control only if it matches your local authority.`;
      localStorage.setItem(HIJRI_REFERENCE_KEY,JSON.stringify({monthKey,checkedAt:Date.now(),summary,remote:{day:Number(remote.day),month:Number(remote.month.number),year:Number(remote.year)},local}));$('hijriSyncStatus').textContent=summary;
    }catch(_){$('hijriSyncStatus').textContent=cached?.summary||'Calendar reference unavailable. The device calendar remains active.';}
  }
  function renderHijri(){
    const first=hijriToGregorian(viewYear,viewMonth,1);
    if(!first){$('hijriGrid').textContent='Islamic calendar data is unavailable on this device.';return;}
    const length=hijriMonthLength(viewYear,viewMonth),last=new Date(first);last.setDate(last.getDate()+length-1);
    const names=hijriParts(first);
    $('hijriMonthTitle').textContent=`${hijriMonthName(viewMonth)} ${viewYear} AH`; $('hijriMonthInput').value=String(viewMonth);
    $('hijriGregorianTitle').textContent=`${first.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${last.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`;
    const labels=['Su','Mo','Tu','We','Th','Fr','Sa'],todayKey=dayStart(new Date()).getTime();
    let cells='';for(let day=1;day<=length;day++){const d=new Date(first);d.setDate(d.getDate()+day-1);const isToday=dayStart(d).getTime()===todayKey;cells+=`<span class="v404-day ${isToday?'today':''}" ${isToday?'aria-current="date"':''} title="${esc(d.toDateString())}">${day}</span>`;}
    $('hijriGrid').innerHTML=labels.map(x=>`<span class="v404-weekday">${x}</span>`).join('')+Array(first.getDay()).fill('<span></span>').join('')+cells;
    const t=hijriNumeric(new Date());
    $('hijriToday').innerHTML=`Today: ${esc(withAH(hijriParts(new Date()).label))}. Based on the Umm al-Qura calendar; local moon sighting can differ by a day. ${length} days this month. ${(viewYear!==t.year||viewMonth!==t.month)?'<button type="button" class="v404-chip" id="hijriGoToday">Back to this month</button>':''}`;
    const back=$('hijriGoToday');if(back)back.addEventListener('click',()=>{viewYear=t.year;viewMonth=t.month;renderHijri();});
  }
  $('hijriPrev').addEventListener('click',()=>shiftHijriMonth(-1));
  $('hijriNext').addEventListener('click',()=>shiftHijriMonth(1));
  $('hijriDateInput').value=new Date().toLocaleDateString('en-CA');
  $('hijriDateInput').addEventListener('change',e=>{if(!e.target.value)return;const d=new Date(e.target.value+'T12:00:00');$('hijriConversion').textContent=withAH(hijriParts(d).label);});
  $('hijriDateInput').dispatchEvent(new Event('change'));const initialHijri=hijriNumeric(new Date());$('hijriDayInput').value=initialHijri.day;$('hijriMonthInput').value=initialHijri.month;$('hijriYearInput').value=initialHijri.year;$('hijriReverseBtn').addEventListener('click',()=>{const day=Number($('hijriDayInput').value),month=Number($('hijriMonthInput').value),year=Number($('hijriYearInput').value);if(day<1||day>30||month<1||month>12||year<1300||year>1600){$('hijriReverseResult').textContent='Enter a valid Hijri date.';return;}const found=hijriToGregorian(year,month,day);if(!found&&day===30&&hijriToGregorian(year,month,29)){$('hijriReverseResult').textContent='This Hijri month has only 29 days.';return;}$('hijriReverseResult').textContent=found?found.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'}):'Enter a valid Hijri date (years 1300–1600).';}); renderHijri();
  $('hijriCheckOnline').addEventListener('click',()=>refreshHijriReference(true));
  $('hijriGrid').closest('.v404-card').addEventListener('click',e=>{const b=e.target.closest('[data-hijri-adjust]');if(!b)return;hijriCorrection=Number(b.dataset.hijriAdjust);data.hijriCorrection=hijriCorrection;save();renderHijri();updateHomeCalendar();nextOccasions=buildNextOccasions();renderOccasions();});
  refreshHijriReference(false);window.addEventListener('online',()=>refreshHijriReference(false));

  // Quranic supplications. Translation is a concise rendering; references are supplied for review.
  const duas=[
    {id:'q201',category:'Guidance & goodness',ar:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',latin:'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar.',meaning:'Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',ref:'Qur’an 2:201'},
    {id:'q114',category:'Knowledge',ar:'رَبِّ زِدْنِي عِلْمًا',latin:'Rabbi zidni ilma.',meaning:'My Lord, increase me in knowledge.',ref:'Qur’an 20:114'},
    {id:'q23',category:'Repentance',ar:'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',latin:'Rabbana zalamna anfusana wa illam taghfir lana wa tarhamna lanakunanna minal-khasirin.',meaning:'Our Lord, we have wronged ourselves. If You do not forgive us and have mercy upon us, we will surely be among the losers.',ref:'Qur’an 7:23'},
    {id:'q8',category:'Steadfastness',ar:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً',latin:'Rabbana la tuzigh qulubana bada idh hadaytana wa hab lana min ladunka rahmah.',meaning:'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself.',ref:'Qur’an 3:8'},
    {id:'q173',category:'Trust',ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',latin:'Hasbunallahu wa ni mal-wakil.',meaning:'Allah is sufficient for us, and He is the best disposer of affairs.',ref:'Qur’an 3:173'}
  ];
  const favs=new Set(Array.isArray(data.duaFavourites)?data.duaFavourites:[]);
  const duaBody=`<div class="v404-card"><input class="v404-input" id="duaSearch" placeholder="Search duas or meanings…" aria-label="Search duas"><div class="v404-chips" id="duaCategories"></div></div><div id="duaList" class="v404-list"></div><p class="v404-note" id="duaFeedStatus">Built-in Quranic supplications are available offline. Online additions are checked when connected.</p>`;
  screen('duaScreen','Dua library','QURANIC SUPPLICATIONS',duaBody,'salahScreen');
  const salahList=$('salahList');
  if(salahList&&!$('salahDuaEntry')){const entry=document.createElement('section');entry.id='salahDuaEntry';entry.className='v404-salah-entry v404-card';entry.innerHTML='<span class="eyebrow">SUPPLICATIONS</span><h2>Dua library</h2><p class="v404-note">Quranic supplications with Arabic, transliteration, meanings and saved favourites.</p><button type="button" class="v404-primary" id="openSalahDuas">Explore duas ↗</button>';salahList.insertAdjacentElement('afterend',entry);entry.querySelector('#openSalahDuas').addEventListener('click',()=>open('duaScreen'));}
  let duaCategory='All';
  function renderDuas(){const q=$('duaSearch').value.trim().toLowerCase();$('duaCategories').innerHTML=['All',...new Set(duas.map(x=>x.category))].map(c=>`<button class="v404-chip ${c===duaCategory?'selected':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');$('duaList').innerHTML=duas.filter(x=>(duaCategory==='All'||x.category===duaCategory)&&`${x.ar} ${x.latin} ${x.meaning} ${x.ref}`.toLowerCase().includes(q)).map(x=>`<article class="v404-card dua-card"><div class="v404-row"><span class="eyebrow">${esc(x.category)}</span><button class="v404-icon-btn" data-fav="${x.id}" aria-label="${favs.has(x.id)?'Remove favourite':'Add favourite'}">${favs.has(x.id)?'♥':'♡'}</button></div><div class="v404-arabic" lang="ar" dir="rtl">${x.ar}</div><p class="v404-latin">${esc(x.latin)}</p><p>${esc(x.meaning)}</p><small class="v404-reference">${esc(x.ref)}</small></article>`).join('')||'<div class="v404-card">No matching duas.</div>';}
  $('duaSearch').addEventListener('input',renderDuas);$('duaCategories').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(b){duaCategory=b.dataset.cat;renderDuas();}});$('duaList').addEventListener('click',e=>{const b=e.target.closest('[data-fav]');if(!b)return;const id=b.dataset.fav;favs.has(id)?favs.delete(id):favs.add(id);data.duaFavourites=[...favs];save();renderDuas();});renderDuas();
  async function refreshRemoteDuas(){const url='https://raw.githubusercontent.com/midhT/Naseem-public/main/content/duas.json';try{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('feed unavailable');const json=await response.json();if(!json||Number(json.schemaVersion)!==1||!Array.isArray(json.duas)||!json.duas.length)throw new Error('invalid or unsupported dua feed');const valid=json.duas.filter(x=>x&&x.id&&x.arabic&&x.meaning&&x.reference).map(x=>({id:String(x.id).slice(0,64),category:String(x.category||'General').slice(0,80),ar:String(x.arabic).slice(0,1200),latin:String(x.transliteration||'').slice(0,500),meaning:String(x.meaning).slice(0,1200),ref:String(x.reference).slice(0,160)}));if(!valid.length)throw new Error('no valid duas');duas.splice(0,duas.length,...valid);data.duaCache=valid;data.duaCacheAt=Date.now();data.duaCacheVersion=Number(json.contentVersion)||1;save();$('duaFeedStatus').textContent=`Dua Library updated from Naseem-public · content v${data.duaCacheVersion}.`;renderDuas();}catch(_){if(Array.isArray(data.duaCache)&&data.duaCache.length){duas.splice(0,duas.length,...data.duaCache);renderDuas();$('duaFeedStatus').textContent='Offline: showing the last saved Dua Library update.';}else $('duaFeedStatus').textContent='Offline: showing the built-in Dua Library.';}}
  refreshRemoteDuas();

  // Salah learning: foundational, non-sectarian learning cards; differences are not presented as rulings.
  const lessons=[
    ['Before prayer','Ensure the prayer time has begun, cover the required area, face the Qibla, and have a clean body, clothing and place. Intention is in the heart; a spoken formula is not required.'],
    ['Wudu overview','Make the intention, wash the face, wash both arms including elbows, wipe the head, and wash both feet including ankles. Details and sequence should be learned with a qualified teacher according to your tradition.'],
    ['Opening the prayer','Stand where able, face the Qibla, make the intention in the heart, and begin with the opening takbir: Allahu Akbar.'],
    ['Recitation and bowing','Recite Al-Fatihah while standing, then bow (ruku) with calmness. Say Subhana Rabbiyal Adheem in ruku; wording and repetition guidance can vary.'],
    ['Prostration and sitting','Rise from bowing, then prostrate with calmness. Say Subhana Rabbiyal A’la. Sit between the two prostrations, then complete the second prostration.'],
    ['Final sitting and salam','Complete the required rakats, sit for tashahhud, send blessings upon the Prophet, and conclude with salam. Learn the exact sequence and recitations from a trusted teacher.'],
    ['Ghusl overview','Ghusl is a full ritual bath required in specific circumstances. Learn its obligations and recommended practices from a reliable teacher; do not rely on a short app summary for complex cases.']
  ];
  const salahBody=`<div class="v404-card"><p class="v404-note">A learning aid, not a substitute for a qualified teacher. Some details differ between recognised schools.</p><div id="salahLessons" class="v404-list"></div></div>`;
  screen('salahLearningScreen','Salah learning','LEARN STEP BY STEP',salahBody);
  $('salahLessons').innerHTML=lessons.map((x,i)=>`<details class="v404-lesson"><summary><span class="v404-lesson-num">${String(i+1).padStart(2,'0')}</span><strong>${esc(x[0])}</strong></summary><p>${esc(x[1])}</p></details>`).join('');

  // Traditional learning profiles are preferences only; they do not calculate rulings.
  const traditions=[['hanafi','Sunni · Hanafi','A recognised Sunni school of jurisprudence.'],['shafii','Sunni · Shafi‘i','A recognised Sunni school of jurisprudence.'],['maliki','Sunni · Maliki','A recognised Sunni school of jurisprudence.'],['hanbali','Sunni · Hanbali','A recognised Sunni school of jurisprudence.'],['jafari','Shia · Ja‘fari (Twelver)','A recognised Ja‘fari school of jurisprudence.']];
  const SCHOOL_GUIDANCE={
    hanafi:[['Asr timing','Asr begins when an object’s shadow reaches twice its height, in addition to its noon shadow.'],['Prayer structure','Hanafi teaching distinguishes Fard, Wajib, Sunnah and Nafl; Witr is treated as Wajib.'],['Common practice','The opening takbir is followed by folded hands and the opening supplication; details such as recitation behind the imam follow Hanafi rulings.'],['Learn next','Rak‘at structure, Witr and Qunut, Sajdah Sahw, and the rules of following an imam.']],
    shafii:[['Asr timing','Asr begins when an object’s shadow reaches its height, in addition to its noon shadow.'],['Prayer structure','Shafi‘i teaching classifies the pillars (arkan), conditions and recommended Sunnahs distinctly; Witr is Sunnah.'],['Common practice','The school has specific guidance on basmalah, recitation behind the imam, raising the hands and the sitting posture.'],['Learn next','Pillars and conditions, recitation in each rak‘ah, Qunut in Fajr, and Witr.']],
    maliki:[['Asr timing','Asr follows the single-shadow rule in the standard calculation.'],['Prayer structure','Maliki teaching has its own classifications and details for obligatory acts and Sunnahs; Witr is recommended.'],['Common practice','The school recognises practices such as sadl (arms at the sides) in prayer; details are taught according to the relied-upon Maliki position.'],['Learn next','Prayer prerequisites, recitation, sadl, Qunut practice and Witr.']],
    hanbali:[['Asr timing','Asr follows the single-shadow rule in the standard calculation.'],['Prayer structure','Hanbali teaching distinguishes pillars, obligations and Sunnahs; Witr is a strongly emphasised Sunnah.'],['Common practice','The school has specific narrational preferences for raising the hands, recitation and supplications in prayer.'],['Learn next','Pillars and obligations, raising the hands, Qunut in Witr and prostration of forgetfulness.']],
    jafari:[['Prayer timing','Ja‘fari timing conventions include distinct definitions for Fajr and Maghrib; the selected method uses a Ja‘fari calculation profile.'],['Prayer structure','Ja‘fari jurisprudence has distinct rules for combining prayers, Qunut, hand placement and recitation.'],['Common practice','Follow a qualified Ja‘fari authority (marja‘) for the exact method and rulings; do not apply Sunni school summaries to Ja‘fari practice.'],['Learn next','Wudu, prayer times, recitation, Qunut, sajdah and the rules of combining prayers.']]
  };

  const profileBody=`<div class="v404-card"><p>Choose your school. Naseem uses this preference for the Asr shadow rule and displays school-specific learning notes. Calculation method and jurisprudential school are separate settings. Local mosque timetables remain the practical authority for congregational prayer.</p><div id="traditionOptions" class="v404-list"></div><p class="v404-note" id="traditionSaved"></p></div><div class="v404-card"><span class="eyebrow">YOUR SCHOOL'S PRAYER GUIDE</span><div id="schoolGuidance" class="v404-list"></div><p class="v404-note">This is an introductory comparison, not a fatwa. Details can vary within a school and by circumstance. Follow a qualified teacher of your tradition.</p><div class="v404-list"><a href="https://daruliftabirmingham.co.uk/method-of-hanafi-salah/" target="_blank" rel="noopener noreferrer">Hanafi Salah guide · Darul Ifta Birmingham</a><a href="https://seekersguidance.org/answers/prayer-shafii-fiqh/" target="_blank" rel="noopener noreferrer">Shafi‘i prayer answers · SeekersGuidance</a><a href="https://www.fiqhpedia.org/articles/article:kwfe:v27:a016?lang=en" target="_blank" rel="noopener noreferrer">Comparative Sunni fiqh · Kuwait Fiqh Encyclopedia</a><a href="https://www.sistani.org/english/book/48/" target="_blank" rel="noopener noreferrer">Ja‘fari prayer rulings · Office of Sayyid al-Sistani</a></div></div>`;
  screen('traditionScreen','Traditional profiles','YOUR LEARNING PATH',profileBody);
  function renderTraditions(){ $('traditionOptions').innerHTML=traditions.map(t=>`<button class="v404-option ${data.tradition===t[0]?'selected':''}" data-tradition="${t[0]}"><strong>${esc(t[1])}</strong><small>${esc(t[2])}</small><span>${data.tradition===t[0]?'Selected':'Select'}</span></button>`).join('');$('traditionSaved').textContent=`Current preference: ${(traditions.find(t=>t[0]===data.tradition)||null)?.[1]||'Not selected'}. You can change this any time.`; }
  const syncTraditionNote=()=>{
    const chosen=traditions.find(t=>t[0]===data.tradition), label=chosen?.[1]||'Not selected';
    const lessonNote=$('salahLearningScreen').querySelector('.v404-note');
    if(lessonNote)lessonNote.textContent=`Learning profile: ${label}. The learning cards now follow this selected school at an introductory level. Confirm detailed rulings with a qualified teacher.`;
    const guide=$('schoolGuidance');if(guide){const rows=SCHOOL_GUIDANCE[data.tradition]||[];guide.innerHTML=rows.map(([h,t])=>`<article class="v404-lesson"><strong>${esc(h)}</strong><p>${esc(t)}</p></article>`).join('');}
    const hero=$('salahScreen')?.querySelector('.v3-hero');
    if(hero){hero.querySelector('.v3-kicker').textContent='SELECTED LEARNING PROFILE';hero.querySelector('h2').textContent=chosen?chosen[1]:'Choose a learning profile';hero.querySelector('p').textContent=`Salah learning follows your ${chosen?chosen[1]:'selected'} profile at an introductory level. Follow a qualified teacher for detailed rulings.`;hero.querySelector('.v3-badge').textContent=chosen?chosen[1].toUpperCase()+' · LEARNING GUIDE':'LEARNING PROFILE NOT SELECTED';}
  };
  if(data.setupComplete!==true&&!data.tradition){data.tradition='hanafi';save();}
  // Migration: adopt a previously saved profile as the school WITHOUT touching the saved Asr rule or method.
  {const S=window.NoorSalah;if(S&&S.get&&S.SCHOOLS){const st=S.get();if(!st.school&&S.SCHOOLS[data.tradition])S.setSchool(data.tradition,false);else if(st.school&&S.SCHOOLS[st.school]&&st.school!==data.tradition){data.tradition=st.school;save();}}}
  renderTraditions();syncTraditionNote();
  // Single source of truth for the school is NoorSalah.get().school; the local copy only mirrors it for the learning screens.
  function applySchool(id){
    const S=window.NoorSalah;if(!S||!S.setSchool(id)){notify('That school is not supported.');return false;}
    data.tradition=id;save();return true;
  }
  document.addEventListener('naseem:tradition-changed',()=>{const S=window.NoorSalah,school=S?.get?.().school;if(school&&school!==data.tradition){data.tradition=school;save();}renderTraditions();syncTraditionNote();});
  $('traditionOptions').addEventListener('click',e=>{
    const b=e.target.closest('[data-tradition]');if(!b)return;
    if(!applySchool(b.dataset.tradition))return;
    notify(data.tradition==='jafari'?'Ja‘fari school saved. Calculation method set to Ja‘fari; you can still change it in Salah settings.':`School saved. Asr now uses the ${data.tradition==='hanafi'?'Hanafi (double shadow)':'standard (single shadow)'} rule; the calculation method is unchanged.`);
    document.dispatchEvent(new CustomEvent('naseem:tradition-changed'));
  });

  // Islamic occasions use the local Hijri calendar and are explicitly approximate.
  const occasions=[['1 Muharram','Islamic New Year',1,1,'A new Hijri year begins. Practices and observances vary.'],['10 Muharram','Ashura',1,10,'A significant day of fasting and remembrance; consult trusted scholarship for its merits.'],['12 Rabi‘ al-Awwal','Mawlid (observance varies)',3,12,'Commemorations vary across communities and scholars.'],['27 Rajab','Isra and Mi‘raj (date not definitive)',7,27,'The exact historical date is not established with certainty.'],['15 Sha‘ban','Mid-Sha‘ban (observance varies)',8,15,'Practices differ; avoid treating disputed reports as universally established.'],['1 Ramadan','Ramadan begins',9,1,'The start depends on local moon sighting or the calendar authority followed.'],['1 Shawwal','Eid al-Fitr',10,1,'The date depends on the end of Ramadan and local moon sighting.'],['9 Dhul-Hijjah','Day of ‘Arafah',12,9,'The date follows the local or adopted Hijri calendar.'],['10 Dhul-Hijjah','Eid al-Adha',12,10,'The date depends on the local or adopted Hijri calendar.']];
  const occBody=`<div class="v404-card"><p class="v404-note">Dates are indicative. Confirm local announcements and moon-sighting decisions. Some observances are disputed or vary by community.</p><div id="occasionList" class="v404-list"></div><button class="v404-primary" id="occasionReminders">Enable occasion reminders</button><p class="v404-note" id="occasionReminderStatus"></p></div>`;
  screen('occasionsScreen','Islamic occasions','HIJRI YEAR',occBody);
  // Numeric Hijri parts are shared by the calendar, converter and occasion reminders.
  const buildNextOccasions=()=>occasions.map(o=>{let next=null;for(let i=0;i<380;i++){const d=new Date();d.setDate(d.getDate()+i);const hp=hijriNumeric(d);if(hp.month===o[2]&&hp.day===o[3]){next=d;break;}}return {item:o,date:next};});
  let nextOccasions=buildNextOccasions();
  function renderOccasions(){
    $('occasionList').innerHTML=nextOccasions.map(({item:o,date:next})=>`<article class="v404-occasion"><div><strong>${esc(o[1])}</strong><small>${esc(o[0])}</small><p>${esc(o[4])}</p></div><time>${next?next.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Date varies'}</time></article>`).join('');
    $('hijriEvents').innerHTML=nextOccasions.slice(0,4).map(({item:o,date:d})=>`<div class="v404-occasion"><div><strong>${esc(o[1])}</strong><small>${esc(o[0])}</small></div><time>${d?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Varies'}</time></div>`).join('');
  }
  renderOccasions();
  $('occasionReminderStatus').textContent='Dates follow the Umm al-Qura calendar on this device and match the Hijri calendar and Home. Local moon-sighting announcements may differ by a day.';
  $('occasionReminders').addEventListener('click',async()=>{const n=window.NoorNative?.notifications;if(!n){$('occasionReminderStatus').textContent='Native notifications are unavailable in this browser.';return;}let permission=await n.permission();if(permission==='prompt')permission=await n.request();if(permission!=='granted'){$('occasionReminderStatus').textContent='Notification permission was not granted. You can enable it later in Android settings.';return;}await n.ensureChannels();const reminders=nextOccasions.filter(x=>x.date).map((x,i)=>({id:95000+i,at:new Date(x.date.getFullYear(),x.date.getMonth(),x.date.getDate(),9,0,0),channel:'silent',title:x.item[1],body:x.item[4]})).filter(x=>x.at>Date.now());await n.cancelRange(95000,95009);if(reminders.length)await n.schedule(reminders);data.occasionReminders=true;save();$('occasionReminderStatus').textContent=`${reminders.length} upcoming occasion reminders scheduled for 9:00 AM. Dates may shift with local moon sighting.`;});

  // Widget Studio configures the appearance of the three supported native Android widgets.
  const widgetBody=`
    <div class="v404-card v404-widget-card"><div class="v404-row"><span class="eyebrow">PRAYER TIMES WIDGET</span><span class="v404-live-dot">AUTO SYNC</span></div>
      <div class="v404-widget-preview prayer"><strong>NASEEM · SALAH</strong><div id="studioPrayerTimes" class="studio-prayer-times"><span>Fajr —</span><span>Dhuhr —</span><span>Asr —</span><span>Maghrib —</span><span>Isha —</span></div><small id="studioPrayerNext">Your local prayer schedule</small></div>
      <p class="v404-note">Uses your current location, calculation method, Asr rule and any manual time adjustments. Updated automatically when your Salah schedule changes.</p>
    </div>
    <div class="v404-card v404-widget-card"><div class="v404-row"><span class="eyebrow">TASBEEH WIDGET</span><span class="v404-live-dot">AUTO SYNC</span></div>
      <div class="v404-widget-preview tasbeeh"><strong>NASEEM · TASBEEH</strong><b id="studioTasbeehCount">0 / 100</b><small id="studioTasbeehName">Astaghfirullah</small></div>
      <p class="v404-note">Follows your selected dhikr, count and target. Changes in the Counter sync automatically; taps made on the Android widget are merged when Naseem is next opened.</p>
    </div>
    <div class="v404-card v404-widget-card"><div class="v404-row"><span class="eyebrow">HIJRI DATE WIDGET</span><span class="v404-live-dot">DAILY SYNC</span></div><div class="v404-widget-preview hijri"><strong>NASEEM · ISLAMIC CALENDAR</strong><b id="studioHijriDate">Loading Islamic date…</b><small>Complete Hijri date · updated when Naseem opens</small></div><p class="v404-note">Shows the Islamic day, month and year on your Android home screen. Calendar dates can differ with local moon sighting.</p></div>
    <div class="v404-card"><span class="eyebrow">WIDGET APPEARANCE</span><p class="v404-note">Configure the appearance of your installed Naseem widgets. Add or resize widget types from your Android home-screen picker.</p><label class="v404-label" for="studioWidgetTheme">Widget theme</label><select class="v404-input" id="studioWidgetTheme"><option value="system">Follow Naseem theme</option><option value="dark">Dark</option><option value="light">Light</option></select><label class="v404-label" for="studioWidgetAccent">Accent</label><select class="v404-input" id="studioWidgetAccent"><option value="emerald">Emerald</option><option value="silver">Silver</option><option value="blue">Blue</option></select><label class="v404-label" for="studioWidgetDensity">Spacing</label><select class="v404-input" id="studioWidgetDensity"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select><button type="button" class="v404-primary" id="studioWidgetSave">Save widget appearance</button><p class="v404-note" id="studioWidgetAppearanceStatus" aria-live="polite"></p></div>
    <div class="v404-card" id="studioCustomWidgetEditor">
      <span class="eyebrow">CUSTOM WIDGET</span>
      <p class="v404-note">Build a home-screen widget from the information you use most.</p>
      <div class="v404-row" role="group" aria-label="Widget content blocks">
        <label class="v404-label"><input class="studio-widget-block" type="checkbox" value="prayer"> Prayer times</label>
        <label class="v404-label"><input class="studio-widget-block" type="checkbox" value="tasbeeh"> Tasbeeh counter</label>
        <label class="v404-label"><input class="studio-widget-block" type="checkbox" value="hijri"> Hijri date</label>
        <label class="v404-label"><input class="studio-widget-block" type="checkbox" value="dua"> Personal reminder</label>
      </div>
      <label class="v404-label" for="studioWidgetLayout">Widget layout</label>
      <select class="v404-input" id="studioWidgetLayout"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select>
      <label class="v404-label" for="studioWidgetAction">Tap action</label>
      <select class="v404-input" id="studioWidgetAction"><option value="open">Open Naseem</option><option value="count">Open counter</option></select>
      <label class="v404-label" for="studioWidgetDua">Personal reminder text</label>
      <textarea class="v404-input" id="studioWidgetDua" rows="2" placeholder="A short reminder (optional unless selected)"></textarea>
      <div class="v404-widget-preview" id="studioCustomPreview">
        <strong>NASEEM · YOUR WIDGET</strong>
        <small id="studioCustomPreviewBlocks" aria-live="polite">Prayer times · Tasbeeh counter · Hijri date</small>
      </div>
      <button type="button" class="v404-primary" id="studioCustomSave">Save custom widget</button>
      <p class="v404-note" id="studioCustomStatus" aria-live="polite"></p>
    </div>
    <div class="v404-card"><p id="studioWidgetStatus" class="v404-note">Widget data syncs automatically in the installed Android app. Add Prayer Times, Tasbeeh or Hijri Date from your Android home-screen widget picker.</p></div>`;
  screen('widgetStudioScreen','Widget Studio','YOUR HOME SCREEN',widgetBody);
  const WIDGET_STYLE_KEY='naseem-widget-style-v1';
  let widgetStyle={theme:'system',accent:'emerald',density:'comfortable'};
  try{widgetStyle={...widgetStyle,...JSON.parse(localStorage.getItem(WIDGET_STYLE_KEY)||'{}')};}catch(_){}
  ['Theme','Accent','Density'].forEach(k=>{const el=$('studioWidget'+k);if(el)el.value=widgetStyle[k.toLowerCase()];});
  const CUSTOM_WIDGET_KEY='naseem-custom-widget-v1';
/* CUSTOM_WIDGET_EDITOR_GUARD */
  if ($('studioWidgetLayout') && $('studioWidgetAction') && $('studioWidgetDua') && $('studioCustomPreviewBlocks') && $('studioCustomPreview') && $('studioCustomSave') && $('studioCustomStatus') && document.querySelector('.studio-widget-block')) {
  let customWidget={blocks:['prayer','tasbeeh','hijri'],layout:'comfortable',action:'open',dua:''};
  try{customWidget={...customWidget,...JSON.parse(localStorage.getItem(CUSTOM_WIDGET_KEY)||'{}')};}catch(_){}
  document.querySelectorAll('.studio-widget-block').forEach(el=>{el.checked=customWidget.blocks.includes(el.value);});
  $('studioWidgetLayout').value=customWidget.layout;$('studioWidgetAction').value=customWidget.action;$('studioWidgetDua').value=customWidget.dua||'';
  const renderCustomWidgetPreview=()=>{customWidget.blocks=[...document.querySelectorAll('.studio-widget-block:checked')].map(el=>el.value);customWidget.layout=$('studioWidgetLayout').value;customWidget.action=$('studioWidgetAction').value;customWidget.dua=$('studioWidgetDua').value.trim();const labels={prayer:'Prayer times',tasbeeh:'Tasbeeh counter',hijri:'Hijri date',dua:'Personal reminder'};const parts=customWidget.blocks.map(k=>labels[k]);if(!parts.length)parts.push('Choose at least one content block');$('studioCustomPreviewBlocks').textContent=parts.join(' · ')+(customWidget.layout==='compact'?' · Compact':'');$('studioCustomPreview').style.padding=customWidget.layout==='compact'?'10px':'18px';};
  document.querySelectorAll('.studio-widget-block').forEach(el=>el.addEventListener('change',renderCustomWidgetPreview));
  ['studioWidgetLayout','studioWidgetAction','studioWidgetDua'].forEach(id=>$(id).addEventListener('input',renderCustomWidgetPreview));
  ['studioWidgetLayout','studioWidgetAction'].forEach(id=>$(id).addEventListener('change',renderCustomWidgetPreview));
  $('studioCustomSave').addEventListener('click',async()=>{renderCustomWidgetPreview();if(!customWidget.blocks.length){$('studioCustomStatus').textContent='Select at least one content block.';return;}if(customWidget.blocks.includes('dua')&&!customWidget.dua){$('studioCustomStatus').textContent='Enter the text for your personal reminder.';return;}try{localStorage.setItem(CUSTOM_WIDGET_KEY,JSON.stringify(customWidget));const ok=await window.NoorNative?.widgets?.setCustomWidget?.({...customWidget,blocks:customWidget.blocks.join(',')});$('studioCustomStatus').textContent=ok?'Your custom widget is saved and synced. Add “Naseem · Custom widget” from the Android widget picker.':'Your design is saved on this device. Install the updated Android app to add it to your home screen.';}catch(_){$('studioCustomStatus').textContent='Could not save the custom widget.';}});
  renderCustomWidgetPreview();
  }
  const paintWidgetPreview=()=>{
    const light=widgetStyle.theme==='light'||(widgetStyle.theme==='system'&&document.body.classList.contains('light'));
    const accents={emerald:light?'#267b5b':'#8fd2aa',silver:light?'#53616a':'#dce3e8',blue:light?'#315f9c':'#91baff'};
    document.querySelectorAll('#widgetStudioScreen .v404-widget-preview').forEach(el=>{el.style.background=light?'linear-gradient(145deg,#f3f6f2,#e5ebe6)':'linear-gradient(145deg,#1d2824,#101512)';el.style.color=light?'#1d2822':'#f1f5f2';el.style.border='1px solid '+accents[widgetStyle.accent];el.style.padding=widgetStyle.density==='compact'?'10px':'18px';});
  };
  ['Theme','Accent','Density'].forEach(k=>$('studioWidget'+k)?.addEventListener('change',e=>{widgetStyle[k.toLowerCase()]=e.target.value;paintWidgetPreview();}));
  $('studioWidgetSave')?.addEventListener('click',async()=>{
    try{localStorage.setItem(WIDGET_STYLE_KEY,JSON.stringify(widgetStyle));const light=widgetStyle.theme==='light'||(widgetStyle.theme==='system'&&document.body.classList.contains('light'));const result=await window.NoorNative?.widgets?.setStyle?.({...widgetStyle,theme:light?'light':'dark'});$('studioWidgetAppearanceStatus').textContent=result?'Appearance saved and synced to your Android widgets.':'Appearance saved on this device. Install/update the Android build to sync native widget styling.';}
    catch(_){$('studioWidgetAppearanceStatus').textContent='Could not save widget appearance.';}
  });
  paintWidgetPreview();
  async function syncWidgetAppearance(){const light=widgetStyle.theme==='light'||(widgetStyle.theme==='system'&&document.body.classList.contains('light'));try{await window.NoorNative?.widgets?.setStyle?.({...widgetStyle,theme:light?'light':'dark'});}catch(_){}}
  document.addEventListener('naseem:theme-changed',()=>{paintWidgetPreview();if(widgetStyle.theme==='system')syncWidgetAppearance();});
  syncWidgetAppearance();
  let widgetSyncRunning=false,widgetSyncPending=false;
  const dateKeyLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function updateStudioPreview(){
    const count=$('countValue')?.textContent||'0',name=$('counterLatin')?.textContent||'Astaghfirullah',target=$('targetInput')?.value||'100';
    const hp=hijriNumeric(new Date());$('studioHijriDate').textContent=`${hp.day} ${hijriMonthName(hp.month)} ${hp.year} AH`;
    $('studioTasbeehCount').textContent=`${count} / ${target}`;$('studioTasbeehName').textContent=name;
    const S=window.NoorSalah,T=window.NoorTime;
    if(S){const times=S.timesFor(new Date()),labels=[['Fajr','fajr'],['Dhuhr','dhuhr'],['Asr','asr'],['Maghrib','maghrib'],['Isha','isha']];$('studioPrayerTimes').innerHTML=labels.map(([label,key])=>`<span><small>${label}</small><b>${T?.to12?T.to12(times[key]):times[key]}</b></span>`).join('');}
  }
  async function syncStudioWidgets(){
    const w=window.NoorNative?.widgets,S=window.NoorSalah;
    updateStudioPreview();
    if(!w){$('studioWidgetStatus').textContent='Widget previews are available here. Install Naseem on Android to use the two home-screen widgets.';return;}
    if(widgetSyncRunning){widgetSyncPending=true;return;}widgetSyncRunning=true;
    try{
      const times={};
      if(S){for(let offset=0;offset<21;offset++){const day=new Date();day.setHours(12,0,0,0);day.setDate(day.getDate()+offset);times[dateKeyLocal(day)]=S.timesFor(day);}}
      const dhikr={name:$('counterLatin')?.textContent||'Astaghfirullah',arabic:$('counterArabic')?.textContent||'ذِكْر',count:Number($('countValue')?.textContent||0),target:Number($('targetInput')?.value||100)};
      const prayerOk=Object.keys(times).length?await w.setPrayerTimes(times):false;
      const tasbeehOk=await w.setTasbeeh(dhikr);
      const hp=hijriNumeric(new Date()),hijriText=`${hp.day} ${hijriMonthName(hp.month)} ${hp.year} AH`;
      const hijriOk=await (w.setHijriDate?w.setHijriDate(hijriText):false);
      $('studioWidgetStatus').textContent=prayerOk&&tasbeehOk&&hijriOk?'Prayer Times, Tasbeeh and Hijri Date widgets are synced. Add them from your Android home-screen widget picker.':`Widget sync — Prayer Times: ${prayerOk?'updated':'unavailable'} · Tasbeeh: ${tasbeehOk?'updated':'unavailable'} · Hijri Date: ${hijriOk?'updated':'unavailable'}.`;
    }catch(_){$('studioWidgetStatus').textContent='Naseem could not sync one or more widgets. Open the app again to retry.';}
    finally{widgetSyncRunning=false;if(widgetSyncPending){widgetSyncPending=false;syncStudioWidgets();}}
  }
  document.addEventListener('noor:screen',e=>{if(e.detail==='widgetStudioScreen')syncStudioWidgets();});
  window.addEventListener('noor:schedule',()=>{updateStudioPreview();syncStudioWidgets();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncStudioWidgets();});
  // Tasbeeh widget follows the counter, the selected dhikr and the target automatically (debounced; no manual sync needed).
  {let timer=null;const queue=()=>{clearTimeout(timer);timer=setTimeout(syncStudioWidgets,600);};
   const mo=new MutationObserver(queue);['countValue','counterLatin','counterArabic'].forEach(id=>{const el=$(id);if(el)mo.observe(el,{childList:true,characterData:true,subtree:true});});
   const target=$('targetInput');if(target){target.addEventListener('input',queue);target.addEventListener('change',queue);}
   document.addEventListener('click',e=>{if(e.target.closest('#targetMinus,#targetPlus,.target-control button'))queue();});}
  // Populate both native widgets when the app opens, even if Studio is never visited.
  syncStudioWidgets();

  // Glance uses the public content endpoint internally; the endpoint is not displayed as a setting.
  const GLANCE_FEED_URL='https://raw.githubusercontent.com/midhT/Naseem-public/main/content/glance.json';
  const BUILTIN_GLANCE=[
    {type:'Quranic reminder',title:'A moment of reflection',body:'Indeed, with hardship comes ease.',reference:'Qur’an 94:5–6'},
    {type:'Daily lesson',title:'Learn the meaning of Tasbeeh',body:'SubhanAllah means that Allah is free from every imperfection. Alhamdulillah is praise and gratitude to Allah.',reference:'Daily learning · Dhikr'},
    {type:'Salah lesson',title:'Pause in Ruku and Sujood',body:'Perform each movement with calmness and composure. Learn the exact recitations and rulings according to your selected school.',reference:'Sahih al-Bukhari 757 · introductory reminder'},
    {type:'Daily quiz',title:'Quick knowledge check',body:'Which Surah is known as Umm al-Kitab (the Mother of the Book)?',reference:'Qur’an · Surah Al-Fatihah',quiz:{options:['Al-Baqarah','Al-Fatihah','Al-Ikhlas'],answer:1,explanation:'Al-Fatihah is also known as Umm al-Kitab.'}},
    {type:'Daily quiz',title:'Test your knowledge',body:'How many obligatory daily prayers are there?',reference:'Basic Islamic knowledge',quiz:{options:['Three','Four','Five'],answer:2,explanation:'Muslims are obligated to perform five daily prayers.'}}
  ];
  const fallback=BUILTIN_GLANCE[Math.floor(Date.now()/86400000)%BUILTIN_GLANCE.length];
  const glanceBody=`<div class="v404-card"><div class="v404-row"><span class="eyebrow">LATEST FROM NASEEM</span><span class="v404-live-dot">DAILY REFLECTION</span></div><article id="glanceCard" class="v404-glance"><small>${fallback.type}</small><h2>${fallback.title}</h2><p>${fallback.body}</p><strong>${fallback.reference}</strong></article><p class="v404-note" id="glanceStatus">Showing the built-in reminder. Online content refreshes when available.</p><button type="button" class="v404-secondary" id="glanceRefresh">Refresh Glance</button></div>`;
  screen('glanceScreen','Glance','A SHARED MOMENT',glanceBody,'homeScreen');
  const home=$('homeScreen');
  if(home&&!$('homeGlancePreview')){
    const card=document.createElement('button');card.type='button';card.id='homeGlancePreview';card.className='home-glance-card';
    card.innerHTML='<span class="home-glance-copy"><small>GLANCE · DAILY REFLECTION</small><strong id="homeGlanceTitle"></strong><span id="homeGlanceBody"></span><em id="homeGlanceReference"></em></span><b aria-hidden="true">↗</b>';
    const hijri=$('homeHijriDate')?.closest('.home-hijri-card');if(hijri)hijri.insertAdjacentElement('afterend',card);else home.prepend(card);
    card.addEventListener('click',()=>open('glanceScreen'));
  }
  function renderHomeGlance(content){
    const title=$('homeGlanceTitle'),body=$('homeGlanceBody'),reference=$('homeGlanceReference');
    if(title)title.textContent=content.title;if(body)body.textContent=content.body;if(reference)reference.textContent=content.reference||content.type||'Open Glance';
  }
  function renderGlanceItem(content){
    const quiz=content.quiz&&Array.isArray(content.quiz.options)?`<div class="glance-quiz"><div class="v404-list">${content.quiz.options.map((o,i)=>`<button type="button" class="v404-option" data-quiz-answer="${i}">${esc(o)}</button>`).join('')}</div><p id="glanceQuizResult" class="v404-note" aria-live="polite"></p></div>`:'';
    $('glanceCard').innerHTML=`<small>${esc(content.type||'Naseem reflection')}</small><h2>${esc(content.title)}</h2><p>${esc(content.body)}</p><strong>${esc(content.reference||'')}</strong>${quiz}`;
    if(quiz){$('glanceCard').querySelectorAll('[data-quiz-answer]').forEach(b=>b.addEventListener('click',()=>{const correct=Number(b.dataset.quizAnswer)===Number(content.quiz.answer);$('glanceQuizResult').textContent=(correct?'Correct. ':'Not quite. ')+String(content.quiz.explanation||'Review the reference above.');$('glanceCard').querySelectorAll('[data-quiz-answer]').forEach(x=>x.disabled=true);}));}
    renderHomeGlance(content);
  }
  function showFallback(status){renderGlanceItem(fallback);$('glanceStatus').textContent=status+' Daily lessons and quizzes are available offline.';}
  // The feed request is time-limited (a hanging connection used to leave the Home card empty and Refresh silent),
  // never overlaps itself, and every outcome is reported on screen.
  const GLANCE_TIMEOUT_MS=8000;let glanceBusy=false,glanceLastFetch=0,glanceOffset=0;
  async function fetchGlanceFeed(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),GLANCE_TIMEOUT_MS);
    try{const response=await fetch(GLANCE_FEED_URL,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error(`Feed returned ${response.status}.`);return await response.json();}
    finally{clearTimeout(timer);}
  }
  async function refreshGlance(manual){
    manual=manual===true;
    if(glanceBusy)return;
    if(!manual&&Date.now()-glanceLastFetch<600000)return;
    glanceBusy=true;const button=$('glanceRefresh');
    if(manual){glanceOffset+=1;if(button){button.disabled=true;button.textContent='Refreshing…';}$('glanceStatus').textContent='Checking for today’s Glance…';}
    try{
      const json=await fetchGlanceFeed();
      if(!json||Number(json.schemaVersion)!==1||!Array.isArray(json.items))throw new Error('Unsupported Glance feed schema.');
      const items=json.items,published=items.filter(x=>x&&x.published===true&&x.title&&x.body),pool=[...published,...BUILTIN_GLANCE],item=pool[(Math.floor(Date.now()/86400000)+glanceOffset)%pool.length]||fallback;
      const content={title:String(item.title).slice(0,120),body:String(item.body).slice(0,1200),reference:String(item.reference||item.source||'').slice(0,160),type:String(item.type||'Naseem update').slice(0,60),quiz:item.quiz&&Array.isArray(item.quiz.options)?item.quiz:null,contentVersion:Number(json.contentVersion)||1,fetchedAt:Date.now()};
      data.glanceCache=content;data.glanceCacheVersion=content.contentVersion;save();glanceLastFetch=Date.now();renderGlanceItem(content);$('glanceStatus').textContent=`Today’s Glance is ready · public content v${content.contentVersion}.`;
    }catch(error){
      const cached=data.glanceCache;
      if(cached&&Date.now()-Number(cached.fetchedAt||0)<30*86400000){renderGlanceItem(cached);$('glanceStatus').textContent='Offline or feed unavailable. Showing the last saved reflection.';}
      else showFallback(error&&error.name==='AbortError'?'The connection is slow right now. Showing the built-in reminder.':'Online content is unavailable. Showing the built-in reminder.');
    }finally{glanceBusy=false;if(button){button.disabled=false;button.textContent='Refresh Glance';}}
  }
  $('glanceRefresh').addEventListener('click',()=>refreshGlance(true));
  // Show something immediately (last saved item, else the built-in one) so the Home card is never empty, then refresh in the background.
  {const saved=data.glanceCache;if(saved&&saved.title&&saved.body&&Date.now()-Number(saved.fetchedAt||0)<30*86400000)renderGlanceItem(saved);else renderGlanceItem(fallback);}
  refreshGlance();
  document.addEventListener('noor:screen',e=>{if(e.detail==='glanceScreen')refreshGlance();});

  // Routes for the More-screen cards; each opens a working screen.
  const routes={hijri:'hijriScreen',duas:'duaScreen','salah-learning':'salahLearningScreen',widgets:'widgetStudioScreen',occasions:'occasionsScreen',profiles:'traditionScreen',glance:'glanceScreen'};
  document.querySelectorAll('[data-open-v404]').forEach(button=>button.addEventListener('click',()=>open(routes[button.dataset.openV404])));
  document.querySelectorAll('[data-open-existing=\"adhkar\"]').forEach(button=>button.addEventListener('click',()=>{const routine=document.querySelector('[data-routine=\"morning\"]');if(routine)routine.click();else open('dhikrScreen');}));
  // First-launch setup: six focused pages. Preferences are committed only on completion.
  function startSetup(){
    let setupDone=data.setupComplete===true;
    try{setupDone=setupDone||localStorage.getItem('naseem-onboarding-complete-v1')==='1';}catch(_){}
    if(setupDone){try{localStorage.setItem('naseem-onboarding-complete-v1','1');}catch(_){}return;}
    const overlay=document.createElement('div');overlay.className='v404-onboarding';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Naseem setup');
    overlay.innerHTML=`<div class="v404-onboard-panel">
      <div class="v404-onboard-top"><span class="eyebrow">NASEEM · YOUR SPACE</span><span class="v404-onboard-count" id="setupCount">01 / 06</span></div>
      <div class="v404-onboard-progress" aria-label="Setup progress"><span id="setupProgress"></span></div>
      <div class="v404-onboard-mark" aria-hidden="true">ن</div>
      <section class="setup-page active" data-page="0"><span class="setup-kicker">A QUIETER MOMENT, EVERY DAY</span><h1>Make space for remembrance.</h1><p>Build a daily companion around the way you pray, your place, and your rhythm.</p><div class="setup-orbit" aria-hidden="true"><i></i><b>ن</b></div></section>
      <section class="setup-page" data-page="1" hidden><span class="setup-kicker">01 · PERSONALISE</span><h1>What should we call you?</h1><p>This is optional. Your name stays on this device.</p><label class="v404-label" for="setupName">Your name</label><input id="setupName" class="v404-input" type="text" maxlength="40" autocomplete="name" placeholder="Enter your name"><div class="setup-note">You can leave this blank and continue.</div></section>
      <section class="setup-page" data-page="2" hidden><span class="setup-kicker">02 · LEARNING TRADITION</span><h1>Choose your learning path.</h1><p>Select the tradition you follow. You can change it later in Settings.</p><div class="setup-choice-list" id="setupTraditionChoices">${traditions.map(t=>`<button type="button" class="setup-choice" data-tradition-choice="${t[0]}"><span><strong>${esc(t[1])}</strong><small>${esc(t[2])}</small></span><b aria-hidden="true">○</b></button>`).join('')}</div><select id="setupTradition" class="v404-input setup-hidden-select" aria-label="Learning tradition"><option value="">Choose later</option>${traditions.map(t=>`<option value="${t[0]}">${esc(t[1])}</option>`).join('')}</select></section>
      <section class="setup-page" data-page="3" hidden><span class="setup-kicker">03 · YOUR LOCATION</span><h1>Where do you pray?</h1><p>Choose a city for local prayer timings, or use your device location.</p><label class="v404-label" for="setupCitySearch">Find your city</label><input id="setupCitySearch" class="v404-input" type="search" autocomplete="off" placeholder="Search available cities"><select id="setupCity" class="v404-input" aria-label="Prayer city"></select><button type="button" id="setupGps" class="v404-secondary setup-gps">◎ &nbsp; Use device location</button><p id="setupLocationStatus" class="setup-note" role="status" aria-live="polite">Your location is only used to calculate local prayer times.</p></section>
      <section class="setup-page" data-page="4" hidden><span class="setup-kicker">04 · APPEARANCE</span><h1>Set the atmosphere.</h1><p>Choose how Naseem should look. You can change this any time.</p><div class="setup-theme-list"><button type="button" class="setup-theme selected" data-theme-choice="dark"><span class="theme-swatch theme-dark"><i></i></span><strong>Dark</strong><small>Quiet · focused</small></button><button type="button" class="setup-theme" data-theme-choice="light"><span class="theme-swatch theme-light"><i></i></span><strong>Light</strong><small>Clear · bright</small></button><button type="button" class="setup-theme" data-theme-choice="system"><span class="theme-swatch theme-system"><i></i></span><strong>System</strong><small>Follow device</small></button></div><select id="setupTheme" class="setup-hidden-select" aria-label="Appearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><div class="setup-preview" id="setupPreview"><span>YOUR NASEEM</span><b>السَّلَامُ عَلَيْكُمْ</b><small>A moment of calm.</small></div></section>
      <section class="setup-page" data-page="5" hidden><span class="setup-kicker">05 · READY</span><div class="setup-ready-mark">✓</div><h1>Your space is ready.</h1><p>Your choices will be saved on this device. Prayer location and appearance can be changed later in Settings.</p><div class="setup-summary" id="setupSummary"></div></section>
      <div class="v404-onboard-actions"><button type="button" id="setupSkip" class="v404-secondary">Skip setup</button><div class="setup-nav"><button type="button" id="setupBack" class="v404-secondary" disabled>Back</button><button type="button" id="setupFinish" class="v404-primary">Continue</button></div></div>
      <small class="setup-privacy">No account required. Your preferences stay on this device.</small>
    </div>`;
    document.body.appendChild(overlay);
    let profile={name:'',photo:''};try{profile=Object.assign(profile,JSON.parse(localStorage.getItem('noorProfileV1')||'{}'));}catch(_){}
    const pages=[...overlay.querySelectorAll('.setup-page')],nameInput=overlay.querySelector('#setupName'),traditionSelect=overlay.querySelector('#setupTradition'),citySelect=overlay.querySelector('#setupCity'),themeSelect=overlay.querySelector('#setupTheme');
    const salah=window.NoorSalah,citySearch=overlay.querySelector('#setupCitySearch');
    const initialLoc=salah?.get?.().loc;
    const draft={name:String(profile.name||'').slice(0,40),tradition:data.tradition||salah?.get?.().school||'',city:'',gps:null,theme:window.NaseemTheme?.get?.()||'system'};
    nameInput.value=draft.name;traditionSelect.value=draft.tradition;
    const cityOptions=[...(salah?.CITIES||[])];
    const renderCityOptions=(query='')=>{const q=query.trim().toLowerCase(),filtered=cityOptions.filter(c=>!q||c.name.toLowerCase().includes(q));citySelect.innerHTML='<option value="">Keep current location</option>'+filtered.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');};
    renderCityOptions();
    citySearch.addEventListener('input',()=>{const selected=citySelect.value;renderCityOptions(citySearch.value);if([...citySelect.options].some(o=>o.value===selected))citySelect.value=selected;});
    if(initialLoc?.source==='manual'&&initialLoc.id)citySelect.value=initialLoc.id;
    else if(initialLoc?.source==='default'&&initialLoc.id)citySelect.value=initialLoc.id;
    draft.city=citySelect.value;
    const setSelected=(selector,attr,value)=>overlay.querySelectorAll(selector).forEach(el=>{const active=el.getAttribute(attr)===value;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
    const setPage=index=>{
      pages.forEach((page,i)=>{page.hidden=i!==index;page.classList.toggle('active',i===index);});
      overlay.querySelector('#setupCount').textContent=`${String(index+1).padStart(2,'0')} / 06`;
      overlay.querySelector('#setupProgress').style.width=`${((index+1)/6)*100}%`;
      overlay.querySelector('#setupBack').disabled=index===0;
      overlay.querySelector('#setupSkip').hidden=index===5;
      overlay.querySelector('#setupFinish').textContent=index===5?'Enter Naseem':index===4?'Continue':'Continue';
      if(index===5){const school=traditions.find(t=>t[0]===draft.tradition)?.[1]||'Choose later';const city=(salah?.CITIES||[]).find(c=>c.id===draft.city)?.name||(draft.gps?'Device location':initialLoc?.name||'Keep current location');overlay.querySelector('#setupSummary').innerHTML=`<span>${esc(draft.name||'Personal profile')}</span><span>${esc(school)}</span><span>${esc(city)}</span><span>${esc(draft.theme[0].toUpperCase()+draft.theme.slice(1))} appearance</span>`;}
      overlay.querySelector('#setupFinish').focus({preventScroll:true});
    };
    setSelected('[data-tradition-choice]','data-tradition-choice',draft.tradition);
    setSelected('[data-theme-choice]','data-theme-choice',draft.theme);
    overlay.querySelector('#setupTraditionChoices').addEventListener('click',e=>{const btn=e.target.closest('[data-tradition-choice]');if(!btn)return;draft.tradition=btn.dataset.tradition;traditionSelect.value=draft.tradition;setSelected('[data-tradition-choice]','data-tradition-choice',draft.tradition);});
    traditionSelect.addEventListener('change',()=>{draft.tradition=traditionSelect.value;setSelected('[data-tradition-choice]','data-tradition-choice',draft.tradition);});
    citySelect.addEventListener('change',()=>{draft.city=citySelect.value;draft.gps=null;overlay.querySelector('#setupLocationStatus').textContent=draft.city?'City selected. It will be saved when you finish.':'Your current prayer location will be kept.';});
    overlay.querySelector('#setupGps').addEventListener('click',()=>{const status=overlay.querySelector('#setupLocationStatus');if(!navigator.geolocation){status.textContent='Location is unavailable. Choose a city instead.';return;}status.textContent='Requesting device location…';navigator.geolocation.getCurrentPosition(pos=>{draft.gps={id:'gps',name:`My location (${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°)`,lat:pos.coords.latitude,lng:pos.coords.longitude,tz:Intl.DateTimeFormat().resolvedOptions().timeZone,source:'gps'};draft.city='';citySelect.value='';status.textContent='Device location found. It will be saved when you finish.';},()=>{status.textContent='Location was not available. You can choose a city instead.';},{enableHighAccuracy:false,timeout:12000,maximumAge:600000});});
    overlay.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>{draft.theme=btn.dataset.themeChoice;themeSelect.value=draft.theme;setSelected('[data-theme-choice]','data-theme-choice',draft.theme);overlay.querySelector('#setupPreview').dataset.theme=draft.theme;}));
    nameInput.addEventListener('input',()=>{draft.name=nameInput.value.trim().slice(0,40);});
    const finish=(skipped=false)=>{
      if(!skipped){
        draft.name=nameInput.value.trim().slice(0,40);
        draft.tradition=traditionSelect.value;
        draft.theme=themeSelect.value;
        draft.city=citySelect.value;
        profile.name=draft.name;
        try{localStorage.setItem('noorProfileV1',JSON.stringify(profile));}catch(_){}
        if(draft.tradition)applySchool(draft.tradition);
        if(draft.gps)salah?.setLocation?.(draft.gps);
        else if(draft.city){
          const chosen=(salah?.CITIES||[]).find(c=>c.id===draft.city);
          if(chosen)salah?.setLocation?.({id:chosen.id,name:chosen.name,lat:chosen.lat,lng:chosen.lng,tz:chosen.tz,source:chosen.id==='srinagar'?'default':'manual'});
        }
        window.NaseemTheme?.set?.(draft.theme);
      }
      data.setupComplete=true;
      data.setupCompletedAt=Date.now();
      save();
      try{localStorage.setItem('naseem-onboarding-complete-v1','1');}catch(_){}
      // Close setup immediately. Permission prompts belong in Settings, not in the first-run flow.
      overlay.remove();
      renderTraditions();
      syncTraditionNote();
      document.dispatchEvent(new CustomEvent('naseem:tradition-changed'));
      notify((skipped?'Setup skipped. ':'Your preferences are saved. ')+'You can enable reminders later in Settings.');
      document.dispatchEvent(new CustomEvent('naseem:profile-updated',{detail:{name:skipped?profile.name:draft.name}}));
    };
    let current=0;
    overlay.querySelector('#setupBack').addEventListener('click',()=>{if(current>0){current--;setPage(current);}});
    overlay.querySelector('#setupFinish').addEventListener('click',()=>{if(current<5){current++;setPage(current);}else finish(false);});
    overlay.querySelector('#setupSkip').addEventListener('click',()=>finish(true));
    setPage(0);
  }
  window.setTimeout(()=>startSetup(),2200);
  // Android back-button navigation: return to More from feature detail screens.
  document.addEventListener('naseem:back',e=>{const active=document.querySelector('.screen.active');if(!active||active.id==='homeScreen')return;e.preventDefault();if(active.id==='duaScreen'){open('salahScreen');return;}if(active.id==='glanceScreen'){open('homeScreen');return;}if(Object.values(routes).includes(active.id)||['qiblaScreen','zakatScreen'].includes(active.id))open('featuresScreen');else open('homeScreen');});
  window.NaseemV404={hijriParts,hijriNumeric,hijriToGregorian,hijriMonthLength,duas,traditions,refreshGlance};
})();
