/* Naseem Salah habit tracker and live local-sky experience. */
(() => {
  'use strict';
  const S=window.NoorSalah,T=window.NoorTime,screen=document.getElementById('salahScreen');
  if(!S||!T||!screen||document.getElementById('salahTracker'))return;
  const heading=screen.querySelector('.screen-heading');if(!heading)return;
  const prayers=[
    {id:'fajr',name:'Fajr',ar:'الفجر',icon:'☾'},
    {id:'dhuhr',name:'Dhuhr',ar:'الظهر',icon:'☼'},
    {id:'asr',name:'Asr',ar:'العصر',icon:'◒'},
    {id:'maghrib',name:'Maghrib',ar:'المغرب',icon:'◔'},
    {id:'isha',name:'Isha',ar:'العشاء',icon:'✦'}
  ];
  const KEY='naseem-salah-habit-v1';
  const root=document.createElement('section');root.id='salahTracker';root.className='salah-tracker';
  root.innerHTML=`
    <section class="salah-sky" id="salahSky" data-phase="night" aria-label="Live sky, changing with local prayer times">
      <div class="salah-sky-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="salah-sky-moon" aria-hidden="true"></div><div class="salah-sky-sun" aria-hidden="true"></div>
      <div class="salah-sky-horizon" aria-hidden="true"><i></i><b></b></div>
      <div class="salah-sky-top"><span class="salah-sky-live"><i></i> LIVE SKY</span><span id="salahSkyPhase">Night</span></div>
      <div class="salah-sky-copy"><span class="eyebrow" id="salahSkyCaption">THE NIGHT IS QUIET</span><strong id="salahSkyTitle">A moment for reflection.</strong><small id="salahSkySubtitle">Your local sky follows the prayer day.</small></div>
    </section>
    <section class="salah-next-card card-surface"><div><span class="eyebrow">NEXT PRAYER</span><strong id="salahNextName">—</strong><small id="salahNextTime">—</small></div><div class="salah-next-count"><span>IN</span><strong id="salahNextCountdown">—</strong></div></section>
    <div class="salah-section-head"><div><span class="eyebrow">TODAY</span><h2>Your five prayers</h2></div><span class="salah-done-count" id="salahDoneCount">0 / 5</span></div>
    <div class="salah-progress-track"><span id="salahProgressBar"></span></div>
    <div class="salah-prayer-list" id="salahPrayerList"></div>
    <section class="salah-tahajjud card-surface"><div class="salah-tahajjud-top"><span class="eyebrow">OPTIONAL NIGHT PRAYER</span><span class="salah-night-icon" aria-hidden="true">☾</span></div><div class="salah-tahajjud-main"><div><h3>Tahajjud</h3><p>Approximate last-third window</p></div><strong id="salahTahajjudStart">—</strong></div><div class="salah-tahajjud-meta" id="salahTahajjudMeta">Between the last third of the night and Fajr.</div><button type="button" class="salah-tahajjud-toggle" id="salahTahajjudToggle" aria-pressed="false">Mark Tahajjud complete</button><small class="salah-tahajjud-note">This is an optional prayer and is kept separate from the five daily prayers. The window is an estimate based on Maghrib and Fajr.</small></section>
    <div class="salah-section-head"><div><span class="eyebrow">CONSISTENCY</span><h2>Your week</h2></div></div>
    <section class="salah-week card-surface" id="salahWeek" aria-label="Seven-day prayer tracking history"></section>
    <div class="salah-tracker-actions"><button type="button" class="secondary-button" id="salahPrayerSettings">Prayer time settings</button><button type="button" class="secondary-button" id="salahResetToday">Reset today's tracker</button></div>`;
  heading.insertAdjacentElement('afterend',root);
  const $=id=>root.querySelector('#'+id);
  const safeLoad=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return {};}};
  let history=safeLoad();
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayData=d=>{const key=dateKey(d);if(!history[key]||typeof history[key]!=='object')history[key]={};return history[key];};
  const save=()=>{const cutoff=new Date();cutoff.setDate(cutoff.getDate()-60);const min=dateKey(cutoff);Object.keys(history).sort().forEach(k=>{if(k<min)delete history[k];});try{localStorage.setItem(KEY,JSON.stringify(history));}catch(_){}}
  const min=v=>S.toMin(v);
  const fmt=v=>T.to12(v);
  const countdown=seconds=>{const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return h?`${h}h ${String(m).padStart(2,'0')}m`:`${m}m ${String(s).padStart(2,'0')}s`;};
  const chooseNext=(now,times)=>{const n=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;for(const p of prayers){const v=min(times[p.id]);if(v!==null&&v>n)return {prayer:p,time:times[p.id],date:now};}const tomorrow=new Date(now);tomorrow.setDate(tomorrow.getDate()+1);const t=S.timesFor(tomorrow);return {prayer:prayers[0],time:t.fajr,date:tomorrow};};
  const getPhase=(now,t)=>{const n=now.getHours()*60+now.getMinutes(),f=min(t.fajr),sr=min(t.sunrise),dh=min(t.dhuhr),as=min(t.asr),mg=min(t.maghrib),is=min(t.isha);if(f===null||sr===null||dh===null||as===null||mg===null||is===null)return 'night';if(n<f||n>=is)return 'night';if(n<sr)return 'dawn';if(n<dh)return 'morning';if(n<as)return 'midday';if(n<mg)return 'afternoon';return 'sunset';};
  const phaseCopy={night:['Night','THE NIGHT IS QUIET','A moment for reflection.','The moon and stars mark the quiet hours.'],dawn:['First light','FAJR · FIRST LIGHT','A new day begins.','The sky slowly opens before sunrise.'],morning:['Morning','AFTER SUNRISE','The day is unfolding.','Soft daylight follows the first light.'],midday:['Midday','DHUHR · MIDDAY','Pause and return to prayer.','The sun reaches its highest point.'],afternoon:['Afternoon','ASR · AFTERNOON','Keep your day in balance.','The light begins its gradual descent.'],sunset:['Sunset','MAGHRIB · SUNSET','A day comes to a close.','The horizon shifts into the evening.']};
  function tahajjudWindow(now){const today=S.timesFor(now),n=now.getHours()*60+now.getMinutes(),f=min(today.fajr),mg=min(today.maghrib);let start,end;if(f!==null&&n<f){const prev=new Date(now);prev.setDate(prev.getDate()-1);start=min(S.timesFor(prev).maghrib);end=f;}else{const next=new Date(now);next.setDate(next.getDate()+1);start=mg;end=min(S.timesFor(next).fajr);}if(start===null||end===null)return null;const duration=(end-start+1440)%1440,thirdStart=(start+Math.floor(duration*2/3))%1440;return {start:`${String(Math.floor(thirdStart/60)).padStart(2,'0')}:${String(thirdStart%60).padStart(2,'0')}`,end:fmt(start===null?'':S.fromMin(end)),duration};}
  function renderSky(now,times){const phase=getPhase(now,times),copy=phaseCopy[phase],sunrise=min(times.sunrise),sunset=min(times.maghrib),minute=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;let progress=0;if(sunrise!==null&&sunset!==null&&sunset>sunrise)progress=Math.max(0,Math.min(1,(minute-sunrise)/(sunset-sunrise)));const arc=Math.sin(Math.PI*progress);$('salahSky').dataset.phase=phase;$('salahSky').style.setProperty('--solar-x',`${(8+84*progress).toFixed(2)}%`);$('salahSky').style.setProperty('--solar-y',`${(77-53*arc).toFixed(2)}%`);$('salahSky').style.setProperty('--solar-progress',progress.toFixed(4));$('salahSkyPhase').textContent=copy[0];$('salahSkyCaption').textContent=copy[1];$('salahSkyTitle').textContent=copy[2];$('salahSkySubtitle').textContent=copy[3];}
  function renderTracker(now,times){const data=dayData(now),done=prayers.filter(p=>data[p.id]===true).length;$('salahDoneCount').textContent=`${done} / 5`;$('salahProgressBar').style.width=`${done*20}%`;$('salahPrayerList').innerHTML=prayers.map(p=>{const isDone=data[p.id]===true;return `<button type="button" class="salah-prayer-row ${isDone?'is-done':''}" data-prayer-id="${p.id}" aria-pressed="${isDone}"><span class="salah-prayer-icon" aria-hidden="true">${p.icon}</span><span class="salah-prayer-info"><strong>${p.name}</strong><small lang="ar" dir="rtl">${p.ar}</small></span><span class="salah-prayer-time">${fmt(times[p.id])}</span><span class="salah-prayer-check" aria-hidden="true">${isDone?'✓':'+'}</span></button>`;}).join('');$('salahTahajjudToggle').setAttribute('aria-pressed',String(data.tahajjud===true));$('salahTahajjudToggle').classList.toggle('is-done',data.tahajjud===true);$('salahTahajjudToggle').textContent=data.tahajjud===true?'Tahajjud completed · Undo':'Mark Tahajjud complete';}
  function renderWeek(now){const days=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const n=prayers.filter(p=>history[dateKey(d)]?.[p.id]===true).length;days.push({label:new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(d).slice(0,3),count:n,today:i===0});} $('salahWeek').innerHTML=days.map(d=>`<div class="salah-week-day ${d.today?'is-today':''}"><div class="salah-week-bar"><span style="height:${d.count*20}%"></span></div><small>${d.label}</small><b>${d.count}/5</b></div>`).join('');}
  function render(){const now=new Date(),times=S.timesFor(now),next=chooseNext(now,times),target=new Date(next.date);const parts=String(next.time).split(':').map(Number);target.setHours(parts[0]||0,parts[1]||0,0,0);const diff=Math.max(0,Math.floor((target-now)/1000));$('salahNextName').textContent=next.prayer.name;$('salahNextTime').textContent=fmt(next.time);$('salahNextCountdown').textContent=countdown(diff);renderSky(now,times);renderTracker(now,times);renderWeek(now);const night=tahajjudWindow(now);if(night){$('salahTahajjudStart').textContent=fmt(night.start);$('salahTahajjudMeta').textContent=`Approx. last third begins at ${fmt(night.start)} · Fajr ends the night window.`;}else{$('salahTahajjudStart').textContent='—';$('salahTahajjudMeta').textContent='Prayer times are unavailable for this date.';}}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-prayer-id]');if(!b)return;const d=dayData(new Date()),id=b.dataset.prayerId;d[id]=d[id]!==true;save();render();});
  $('salahTahajjudToggle').addEventListener('click',()=>{const d=dayData(new Date());d.tahajjud=d.tahajjud!==true;save();render();});
  $('salahResetToday').addEventListener('click',()=>{if(!confirm("Reset today's prayer tracker?"))return;history[dateKey(new Date())]={};save();render();});
  $('salahPrayerSettings').addEventListener('click',()=>{switchScreen('settingsScreen');setTimeout(()=>{const panel=document.getElementById('stSalah');if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'start'});}},280);});
  render();window.addEventListener('noor:schedule',render);window.setInterval(render,1000);
  window.NaseemSalahTracker={KEY,phaseFor:getPhase,lastThirdWindow:tahajjudWindow};
})();
