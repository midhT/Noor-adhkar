/* Naseem V4.0.7 feature centre. Offline-first tools; online access is optional and explicit. */
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
  const hijriParts = date => { const p=Object.fromEntries(hijriFmt.formatToParts(date).map(x=>[x.type,x.value])); return {day:Number(p.day),month:p.month,year:Number(p.year),label:hijriFmt.format(date)}; };
  const hijriNumericFmt = (()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'});}catch{return new Intl.DateTimeFormat('en-u-ca-islamic',{day:'numeric',month:'numeric',year:'numeric'});}})();
  const hijriNumeric = date => {const p=Object.fromEntries(hijriNumericFmt.formatToParts(date).map(x=>[x.type,x.value]));return {day:Number(p.day),month:Number(p.month),year:Number(p.year)};};
  const dayStart = d => new Date(d.getFullYear(),d.getMonth(),d.getDate());
  function updateHomeCalendar(){
    const homeDate=$('homeHijriDate');if(homeDate)homeDate.textContent=withAH(hijriParts(new Date()).label);
    const hp=hijriNumeric(new Date()),ramadan=$('homeRamadanCard'),activeHijriMonth=hp.month;
    if(ramadan&&activeHijriMonth===9&&window.NoorSalah){const times=window.NoorSalah.timesFor(new Date());const fmt=v=>window.NoorTime?.to12?window.NoorTime.to12(v):v;ramadan.hidden=false;$('homeSehriTime').textContent=fmt(times.fajr);$('homeIftarTime').textContent=fmt(times.maghrib);}
    else if(ramadan)ramadan.hidden=true;
  }
  updateHomeCalendar();window.addEventListener('noor:schedule',updateHomeCalendar);window.setInterval(updateHomeCalendar,60000);
  const hijriBody = `<div class="v404-card"><div class="v404-row"><button class="v404-btn" id="hijriPrev" aria-label="Previous Hijri month">‹</button><div class="v404-centre"><strong id="hijriMonthTitle">Loading…</strong><small id="hijriGregorianTitle"></small></div><button class="v404-btn" id="hijriNext" aria-label="Next Hijri month">›</button></div><div class="v404-calendar" id="hijriGrid"></div><p class="v404-note" id="hijriToday"></p></div><div class="v404-card"><span class="eyebrow">DATE CONVERSION</span><label class="v404-label" for="hijriDateInput">Gregorian date → Hijri</label><input class="v404-input" type="date" id="hijriDateInput"><strong id="hijriConversion"></strong><label class="v404-label" for="hijriYearInput">Hijri date → Gregorian</label><div class="v404-hijri-convert"><input class="v404-input" id="hijriDayInput" type="number" min="1" max="30" value="1" aria-label="Hijri day"><select class="v404-input" id="hijriMonthInput" aria-label="Hijri month">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select><input class="v404-input" id="hijriYearInput" type="number" min="1300" max="1600" aria-label="Hijri year"></div><button class="v404-secondary" id="hijriReverseBtn">Convert to Gregorian</button><strong id="hijriReverseResult"></strong></div><div class="v404-card"><span class="eyebrow">IMPORTANT DATES</span><div id="hijriEvents" class="v404-list"></div><p class="v404-note">Dates are calculated using the device's Islamic calendar data. Local moon sighting and regional conventions can shift observances by a day or more.</p></div>`;
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
  function renderHijri(){
    const first=hijriToGregorian(viewYear,viewMonth,1);
    if(!first){$('hijriGrid').textContent='Islamic calendar data is unavailable on this device.';return;}
    const length=hijriMonthLength(viewYear,viewMonth),last=new Date(first);last.setDate(last.getDate()+length-1);
    const names=hijriParts(first);
    $('hijriMonthTitle').textContent=`${names.month} ${viewYear} AH`;
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
  async function refreshRemoteDuas(){const url='https://raw.githubusercontent.com/midhT/Naseem-public/main/content/duas.json';try{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('feed unavailable');const json=await response.json();if(!Array.isArray(json.duas)||!json.duas.length)throw new Error('invalid dua feed');const valid=json.duas.filter(x=>x&&x.id&&x.arabic&&x.meaning&&x.reference).map(x=>({id:String(x.id).slice(0,64),category:String(x.category||'General').slice(0,80),ar:String(x.arabic).slice(0,1200),latin:String(x.transliteration||'').slice(0,500),meaning:String(x.meaning).slice(0,1200),ref:String(x.reference).slice(0,160)}));if(!valid.length)throw new Error('no valid duas');duas.splice(0,duas.length,...valid);data.duaCache=valid;data.duaCacheAt=Date.now();save();$('duaFeedStatus').textContent='Dua Library updated from Naseem’s public content repository.';renderDuas();}catch(_){if(Array.isArray(data.duaCache)&&data.duaCache.length){duas.splice(0,duas.length,...data.duaCache);renderDuas();$('duaFeedStatus').textContent='Offline: showing the last saved Dua Library update.';}else $('duaFeedStatus').textContent='Offline: showing the built-in Dua Library.';}}
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
  const profileBody=`<div class="v404-card"><p>Choose the school you follow. This sets the Asr shadow rule used for prayer times (Hanafi: double shadow; Shafi‘i, Maliki, Hanbali: single shadow) and is saved with your Salah settings. The calculation method (Karachi, MWL and others) remains a separate setting. Ja‘fari selects the Ja‘fari calculation method (Fajr 16°, Isha 14°, Maghrib 4° after sunset); its angles and rules for combining prayers should be confirmed with a qualified Ja‘fari authority, and combining prayers is not modelled.</p><div id="traditionOptions" class="v404-list"></div><p class="v404-note" id="traditionSaved"></p></div>`;
  screen('traditionScreen','Traditional profiles','YOUR LEARNING PATH',profileBody);
  function renderTraditions(){ $('traditionOptions').innerHTML=traditions.map(t=>`<button class="v404-option ${data.tradition===t[0]?'selected':''}" data-tradition="${t[0]}"><strong>${esc(t[1])}</strong><small>${esc(t[2])}</small><span>${data.tradition===t[0]?'Selected':'Select'}</span></button>`).join('');$('traditionSaved').textContent=`Current preference: ${(traditions.find(t=>t[0]===data.tradition)||null)?.[1]||'Not selected'}. You can change this any time.`; }
  const syncTraditionNote=()=>{
    const chosen=traditions.find(t=>t[0]===data.tradition), label=chosen?.[1]||'Not selected';
    const lessonNote=$('salahLearningScreen').querySelector('.v404-note');
    if(lessonNote)lessonNote.textContent=`Learning profile: ${label}. This is a general starter guide; some explanatory notes are Hanafi-specific and school-specific differences are not fully covered. Confirm details with a qualified teacher.`;
    const hero=$('salahScreen')?.querySelector('.v3-hero');
    if(hero){hero.querySelector('.v3-kicker').textContent='SELECTED LEARNING PROFILE';hero.querySelector('h2').textContent=chosen?chosen[1]:'Choose a learning profile';hero.querySelector('p').textContent='The recitation guide is a general starter resource and includes some Hanafi-specific notes. School-specific differences are not fully covered yet; follow a qualified teacher for your school.';hero.querySelector('.v3-badge').textContent=chosen?chosen[1].toUpperCase()+' · LEARNING GUIDE':'LEARNING PROFILE NOT SELECTED';}
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
  const nextOccasions=occasions.map(o=>{let next=null;for(let i=0;i<380;i++){const d=new Date();d.setDate(d.getDate()+i);const hp=hijriNumeric(d);if(hp.month===o[2]&&hp.day===o[3]){next=d;break;}}return {item:o,date:next};});
  function renderOccasions(){
    $('occasionList').innerHTML=nextOccasions.map(({item:o,date:next})=>`<article class="v404-occasion"><div><strong>${esc(o[1])}</strong><small>${esc(o[0])}</small><p>${esc(o[4])}</p></div><time>${next?next.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Date varies'}</time></article>`).join('');
    $('hijriEvents').innerHTML=nextOccasions.slice(0,4).map(({item:o,date:d})=>`<div class="v404-occasion"><div><strong>${esc(o[1])}</strong><small>${esc(o[0])}</small></div><time>${d?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Varies'}</time></div>`).join('');
  }
  renderOccasions();
  $('occasionReminderStatus').textContent='Dates follow the Umm al-Qura calendar on this device and match the Hijri calendar and Home. Local moon-sighting announcements may differ by a day.';
  $('occasionReminders').addEventListener('click',async()=>{const n=window.NoorNative?.notifications;if(!n){$('occasionReminderStatus').textContent='Native notifications are unavailable in this browser.';return;}let permission=await n.permission();if(permission!=='granted')permission=await n.request();if(permission!=='granted'){$('occasionReminderStatus').textContent='Notification permission was not granted. You can enable it later in Android settings.';return;}await n.ensureChannels();const reminders=nextOccasions.filter(x=>x.date).map((x,i)=>({id:95000+i,at:new Date(x.date.getFullYear(),x.date.getMonth(),x.date.getDate(),9,0,0),channel:'silent',title:x.item[1],body:x.item[4]})).filter(x=>x.at>Date.now());await n.cancelRange(95000,95009);if(reminders.length)await n.schedule(reminders);data.occasionReminders=true;save();$('occasionReminderStatus').textContent=`${reminders.length} upcoming occasion reminders scheduled for 9:00 AM. Dates may shift with local moon sighting.`;});

  // Widget Studio supports only the two implemented Android widgets: Prayer Times and Tasbeeh.
  const widgetBody=`
    <div class="v404-card v404-widget-card"><div class="v404-row"><span class="eyebrow">PRAYER TIMES WIDGET</span><span class="v404-live-dot">AUTO SYNC</span></div>
      <div class="v404-widget-preview prayer"><strong>NASEEM · SALAH</strong><div id="studioPrayerTimes" class="studio-prayer-times"><span>Fajr —</span><span>Dhuhr —</span><span>Asr —</span><span>Maghrib —</span><span>Isha —</span></div><small id="studioPrayerNext">Your local prayer schedule</small></div>
      <p class="v404-note">Uses your current location, calculation method, Asr rule and any manual time adjustments. Updated automatically when your Salah schedule changes.</p>
    </div>
    <div class="v404-card v404-widget-card"><div class="v404-row"><span class="eyebrow">TASBEEH WIDGET</span><span class="v404-live-dot">AUTO SYNC</span></div>
      <div class="v404-widget-preview tasbeeh"><strong>NASEEM · TASBEEH</strong><b id="studioTasbeehCount">0 / 100</b><small id="studioTasbeehName">Astaghfirullah</small></div>
      <p class="v404-note">Follows your selected dhikr, count and target. Changes in the Counter sync automatically; taps made on the Android widget are merged when Naseem is next opened.</p>
    </div>
    <div class="v404-card"><p id="studioWidgetStatus" class="v404-note">Widget data syncs automatically in the installed Android app. Add Prayer Times or Tasbeeh from your Android home-screen widget picker.</p></div>`;
  screen('widgetStudioScreen','Widget Studio','YOUR HOME SCREEN',widgetBody);
  let widgetSyncRunning=false,widgetSyncPending=false;
  const dateKeyLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function updateStudioPreview(){
    const count=$('countValue')?.textContent||'0',name=$('counterLatin')?.textContent||'Astaghfirullah',target=$('targetInput')?.value||'100';
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
      $('studioWidgetStatus').textContent=prayerOk&&tasbeehOk?'Both widget data feeds are up to date. Add the widgets from your Android home-screen widget picker.':`Widget sync status — Prayer Times: ${prayerOk?'updated':'unavailable'} · Tasbeeh: ${tasbeehOk?'updated':'unavailable'}.`;
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
  const fallback={title:'A moment of reflection',body:'Indeed, with hardship comes ease.',reference:'Qur’an 94:5–6',type:'Quranic reminder'};
  const glanceBody=`<div class="v404-card"><div class="v404-row"><span class="eyebrow">LATEST FROM NASEEM</span><span class="v404-live-dot">DAILY REFLECTION</span></div><article id="glanceCard" class="v404-glance"><small>${fallback.type}</small><h2>${fallback.title}</h2><p>${fallback.body}</p><strong>${fallback.reference}</strong></article><p class="v404-note" id="glanceStatus">Showing the built-in reminder. Online content refreshes when available.</p></div>`;
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
    $('glanceCard').innerHTML=`<small>${esc(content.type||'Naseem reflection')}</small><h2>${esc(content.title)}</h2><p>${esc(content.body)}</p><strong>${esc(content.reference||'')}</strong>`;
    renderHomeGlance(content);
  }
  function showFallback(status){renderGlanceItem(fallback);$('glanceStatus').textContent=status;}
  async function refreshGlance(){
    try{
      const response=await fetch(GLANCE_FEED_URL,{cache:'no-store'});if(!response.ok)throw new Error(`Feed returned ${response.status}.`);
      const json=await response.json(),items=Array.isArray(json.items)?json.items:[],item=items.filter(x=>x&&x.published===true).at(-1);
      if(!item||!item.title||!item.body)throw new Error('No published item in the feed.');
      const content={title:String(item.title).slice(0,120),body:String(item.body).slice(0,1200),reference:String(item.reference||item.source||'').slice(0,160),type:String(item.type||'Naseem update').slice(0,60),fetchedAt:Date.now()};
      data.glanceCache=content;save();renderGlanceItem(content);$('glanceStatus').textContent='Latest published reflection loaded.';
    }catch(error){
      const cached=data.glanceCache;
      if(cached&&Date.now()-Number(cached.fetchedAt||0)<30*86400000){renderGlanceItem(cached);$('glanceStatus').textContent='Offline or feed unavailable. Showing the last saved reflection.';}
      else showFallback('Online content is unavailable. Showing the built-in reminder.');
    }
  }
  refreshGlance();
  document.addEventListener('noor:screen',e=>{if(e.detail==='glanceScreen')refreshGlance();});

  // Routes for the More-screen cards; each opens a working screen.
  const routes={hijri:'hijriScreen',duas:'duaScreen','salah-learning':'salahLearningScreen',widgets:'widgetStudioScreen',occasions:'occasionsScreen',profiles:'traditionScreen',glance:'glanceScreen'};
  document.querySelectorAll('[data-open-v404]').forEach(button=>button.addEventListener('click',()=>open(routes[button.dataset.openV404])));
  document.querySelectorAll('[data-open-existing=\"adhkar\"]').forEach(button=>button.addEventListener('click',()=>{const routine=document.querySelector('[data-routine=\"morning\"]');if(routine)routine.click();else open('dhikrScreen');}));
  // First-launch setup: local-only and shown once. All of these choices stay editable in Settings.
  function startSetup(force=false){
    if(!force&&data.setupComplete===true)return;
    const overlay=document.createElement('div');overlay.className='v404-onboarding';
    overlay.innerHTML=`<div class="v404-onboard-panel"><span class="eyebrow">WELCOME TO NASEEM</span><div class="v404-onboard-mark">ن</div><h1>Make space for remembrance.</h1><p>A few details help personalise your daily experience. You can change them later.</p><label class="v404-label" for="setupName">Your name (optional)</label><input id="setupName" class="v404-input" type="text" maxlength="40" autocomplete="name" placeholder="What should Naseem call you?"><label class="v404-label" for="setupTradition">Learning tradition</label><select id="setupTradition" class="v404-input"><option value="">Choose later</option>${traditions.map(t=>`<option value="${t[0]}">${esc(t[1])}</option>`).join('')}</select><label class="v404-label" for="setupCity">Prayer city</label><select id="setupCity" class="v404-input"></select><button type="button" id="setupGps" class="v404-secondary">Use device location</button><label class="v404-label" for="setupTheme">Appearance</label><select id="setupTheme" class="v404-input"><option value="dark">Dark</option><option value="light">Light</option></select><div class="v404-onboard-actions"><button id="setupSkip" class="v404-secondary">Skip for now</button><button id="setupFinish" class="v404-primary">Finish setup</button></div><small>Your preferences stay on this device. Location is used for local prayer timings. Naseem does not require an account.</small></div>`;
    document.body.appendChild(overlay);
    let profile={name:'',photo:''};try{profile=Object.assign(profile,JSON.parse(localStorage.getItem('noorProfileV1')||'{}'));}catch(_){}
    overlay.querySelector('#setupName').value=String(profile.name||'').slice(0,40);
    overlay.querySelector('#setupTradition').value=data.tradition||'';
    overlay.querySelector('#setupTheme').value=document.body.classList.contains('light')?'light':'dark';
    const citySelect=overlay.querySelector('#setupCity'),salah=window.NoorSalah;
    citySelect.innerHTML='<option value="">Keep current location</option>'+(salah?.CITIES||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const finish=async(skipped=false)=>{
      const name=overlay.querySelector('#setupName').value.trim().slice(0,40);
      profile.name=name;try{localStorage.setItem('noorProfileV1',JSON.stringify(profile));}catch(_){}
      const tradition=overlay.querySelector('#setupTradition').value;if(tradition)applySchool(tradition);
      const theme=overlay.querySelector('#setupTheme').value;if((theme==='light')!==document.body.classList.contains('light'))$('themeBtn')?.click();
      const chosen=(salah?.CITIES||[]).find(c=>c.id===citySelect.value);if(chosen)salah.setLocation({id:chosen.id,name:chosen.name,lat:chosen.lat,lng:chosen.lng,tz:chosen.tz,source:chosen.id==='srinagar'?'default':'manual'});
      data.setupComplete=true;data.setupCompletedAt=Date.now();save();overlay.remove();
      renderTraditions();syncTraditionNote();document.dispatchEvent(new CustomEvent('naseem:tradition-changed'));
      notify(skipped?'Setup skipped. You can personalise Naseem in Settings.':'Your preferences are saved on this device. Enable notifications later when you turn on a reminder.');
      document.dispatchEvent(new CustomEvent('naseem:profile-updated',{detail:{name}}));
    };
    overlay.querySelector('#setupGps').addEventListener('click',()=>{if(!navigator.geolocation){notify('Location is unavailable. Choose a city instead.');return;}navigator.geolocation.getCurrentPosition(pos=>{salah?.setLocation({id:'gps',name:`My location (${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°)`,lat:pos.coords.latitude,lng:pos.coords.longitude,tz:Intl.DateTimeFormat().resolvedOptions().timeZone,source:'gps'});notify('Prayer location saved.');},()=>notify('Location was not available. You can choose a city instead.'),{enableHighAccuracy:false,timeout:12000,maximumAge:600000});});
    overlay.querySelector('#setupFinish').addEventListener('click',()=>finish(false));
    overlay.querySelector('#setupSkip').addEventListener('click',()=>finish(true));
  }
  window.setTimeout(()=>startSetup(false),2200);
  // Android back-button navigation: return to More from feature detail screens.
  document.addEventListener('naseem:back',e=>{const active=document.querySelector('.screen.active');if(!active||active.id==='homeScreen')return;e.preventDefault();if(active.id==='duaScreen'){open('salahScreen');return;}if(active.id==='glanceScreen'){open('homeScreen');return;}if(Object.values(routes).includes(active.id)||['qiblaScreen','zakatScreen'].includes(active.id))open('featuresScreen');else open('homeScreen');});
  window.NaseemV404={hijriParts,hijriNumeric,hijriToGregorian,hijriMonthLength,duas,traditions,refreshGlance};
})();
