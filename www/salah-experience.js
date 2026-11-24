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
  const STATUS={on_time:'Salah on time!',not_early:'Not praying early!',very_late:'Praying Salah very late!',periods:'Periods'};
  const profileGender=()=>{try{const p=JSON.parse(localStorage.getItem('noorProfileV1')||'{}');return p.gender==='female'?'female':p.gender==='male'?'male':'unspecified';}catch(_){return 'unspecified';}};
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
    <section class="salah-improve card-surface" id="salahImprove"><span class="eyebrow">YOUR NEXT STEP</span><h3>Where to improve</h3><p>Track each prayer honestly. Your weekly patterns will appear here.</p><div id="salahImproveStats"></div></section>
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
  const prayerIsAvailable=(prayerId,now,times)=>!!S.isPrayerTimeReached?.(times?.[prayerId],now);
  const statusOf=(data,id)=>data[id]===true?'on_time':(Object.hasOwn(data,id)?data[id]:'');
  function renderTracker(now,times){
    const data=dayData(now),gender=profileGender(),periods=prayers.filter(p=>statusOf(data,p.id)==='periods').length;
    const done=prayers.filter(p=>['on_time','not_early','very_late'].includes(statusOf(data,p.id))).length,denom=5-periods;
    $('salahDoneCount').textContent=`${done} / ${denom}`;$('salahProgressBar').style.width=`${denom?done/denom*100:100}%`;
    $('salahPrayerList').innerHTML=prayers.map(p=>{
      const status=statusOf(data,p.id),performed=['on_time','not_early','very_late'].includes(status),available=!!status||prayerIsAvailable(p.id,now,times);
      const choices=[['on_time',STATUS.on_time],['not_early',STATUS.not_early],['very_late',STATUS.very_late],...(gender==='female'?[['periods',STATUS.periods]]:[])];
      return `<div class="salah-prayer-entry"><button type="button" class="salah-prayer-row ${performed?'is-done':''} ${available?'':'is-locked'}" data-prayer-id="${p.id}" aria-expanded="false" title="${available?'Choose how this prayer went':`Available at ${fmt(times[p.id])}`} "><span class="salah-prayer-icon" aria-hidden="true">${p.icon}</span><span class="salah-prayer-info"><strong>${p.name}</strong><small lang="ar" dir="rtl">${p.ar}</small><small class="salah-status-label">${status?STATUS[status]||'Not recorded':'Tap to record'}</small></span><span class="salah-prayer-time">${fmt(times[p.id])}</span><span class="salah-prayer-check" aria-hidden="true">${status==='periods'?'—':performed?'✓':available?'+':'·'}</span></button><div class="salah-status-options" data-status-for="${p.id}" hidden>${choices.map(([value,label])=>`<button type="button" class="salah-status-choice ${status===value?'is-selected':''}" data-status="${value}" data-prayer="${p.id}" aria-pressed="${status===value}">${label}</button>`).join('')}<button type="button" class="salah-status-clear" data-clear-prayer="${p.id}">Clear</button></div></div>`;
    }).join('');
    const totals={not_early:0,very_late:0,on_time:0};
    for(let i=0;i<7;i++){const d=new Date(now);d.setDate(d.getDate()-i);const day=history[dateKey(d)]||{};for(const p of prayers){const st=statusOf(day,p.id);if(Object.hasOwn(totals,st))totals[st]++;}}
    $('salahImproveStats').innerHTML=`<div class="salah-improve-grid"><span><b>${totals.on_time}</b><small>On time</small></span><span><b>${totals.not_early}</b><small>Could be earlier</small></span><span><b>${totals.very_late}</b><small>Very late</small></span></div><p>${totals.not_early+totals.very_late?`You recorded ${totals.not_early+totals.very_late} prayers that you may want to improve this week.`:'Keep tracking to discover your weekly patterns.'}</p>`;
    $('salahTahajjudToggle').setAttribute('aria-pressed',String(data.tahajjud===true));$('salahTahajjudToggle').classList.toggle('is-done',data.tahajjud===true);$('salahTahajjudToggle').textContent=data.tahajjud===true?'Tahajjud completed · Undo':'Mark Tahajjud complete';
  }
  function renderWeek(now){const days=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const day=history[dateKey(d)]||{},n=prayers.filter(p=>['on_time','not_early','very_late'].includes(statusOf(day,p.id))||day[p.id]===true).length,eligibleCount=prayers.filter(p=>statusOf(day,p.id)!=='periods').length;days.push({label:new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(d).slice(0,3),count:n,total:eligibleCount,today:i===0});} $('salahWeek').innerHTML=days.map(d=>`<div class="salah-week-day ${d.today?'is-today':''}"><div class="salah-week-bar"><span style="height:${d.total?d.count/d.total*100:100}%"></span></div><small>${d.label}</small><b>${d.count}/${d.total}</b></div>`).join('');}
  function render(){const now=new Date(),times=S.timesFor(now),next=chooseNext(now,times),target=new Date(next.date);const parts=String(next.time).split(':').map(Number);target.setHours(parts[0]||0,parts[1]||0,0,0);const diff=Math.max(0,Math.floor((target-now)/1000));$('salahNextName').textContent=next.prayer.name;$('salahNextTime').textContent=fmt(next.time);$('salahNextCountdown').textContent=countdown(diff);renderSky(now,times);renderTracker(now,times);renderWeek(now);const night=tahajjudWindow(now);if(night){$('salahTahajjudStart').textContent=fmt(night.start);$('salahTahajjudMeta').textContent=`Approx. last third begins at ${fmt(night.start)} · Fajr ends the night window.`;}else{$('salahTahajjudStart').textContent='—';$('salahTahajjudMeta').textContent='Prayer times are unavailable for this date.';}}
  root.addEventListener('click',e=>{
    const choice=e.target.closest('[data-status][data-prayer]');
    if(choice){const id=choice.dataset.prayer,status=choice.dataset.status;if(!prayers.some(p=>p.id===id)||!Object.hasOwn(STATUS,status))return;if(status==='periods'&&profileGender()!=='female')return;const now=new Date(),times=S.timesFor(now),d=dayData(now);if(status!=='periods'&&!statusOf(d,id)&&!prayerIsAvailable(id,now,times)){render();return;}d[id]=status;save();render();return;}
    const clear=e.target.closest('[data-clear-prayer]');if(clear){delete dayData(new Date())[clear.dataset.clearPrayer];save();render();return;}
    const b=e.target.closest('[data-prayer-id]');if(!b)return;const now=new Date(),times=S.timesFor(now),id=b.dataset.prayerId;if(!prayers.some(p=>p.id===id))return;const d=dayData(now);const panel=root.querySelector(`[data-status-for="${id}"]`);if(panel){const open=panel.hidden;panel.hidden=!open;b.setAttribute('aria-expanded',String(open));}
  });
  $('salahTahajjudToggle').addEventListener('click',()=>{const d=dayData(new Date());d.tahajjud=d.tahajjud!==true;save();render();});
  $('salahResetToday').addEventListener('click',()=>{if(!confirm("Reset today's prayer tracker?"))return;history[dateKey(new Date())]={};save();render();});
  $('salahPrayerSettings').addEventListener('click',()=>{switchScreen('settingsScreen');setTimeout(()=>{const panel=document.getElementById('stSalah');if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'start'});}},280);});
  render();window.addEventListener('noor:schedule',render);
  const tick=()=>{const now=new Date(),next=chooseNext(now,S.timesFor(now)),t=new Date(next.date),p=String(next.time).split(':').map(Number);t.setHours(p[0]||0,p[1]||0,0,0);const el=$('salahNextCountdown');if(el)el.textContent=countdown(Math.max(0,Math.floor((t-now)/1000)));};
  if(window.NaseemPerf){window.NaseemPerf.every(tick,1000,'salahScreen');window.NaseemPerf.every(render,60000,'salahScreen');}else window.setInterval(render,1000);
  window.NaseemSalahTracker={KEY,phaseFor:getPhase,lastThirdWindow:tahajjudWindow,prayerIsAvailable,statusOf};
})();
