/* Noor V3.3 — Settings › Salah: location, calculation method, Asr, adjustments, own times, Jamaat. */
(() => {
  'use strict';
  const S = window.NoorSalah, T = window.NoorTime;
  const body = document.querySelector('#stSalah .st-body');
  if (!S || !body) return;
  const L = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  const MANUAL_KEY = 'noorPrayerScheduleV1';
  const say = m => { try { toast(m); } catch (_) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let note = '', referenceStatus = 'Online reference check has not run yet.';
  const REF_KEY='naseem-salah-reference-v1', REF_MONTH=30*24*60*60*1000;
  const readReference=()=>{try{return JSON.parse(localStorage.getItem(REF_KEY)||'null');}catch(_){return null;}};
  const manual = () => { try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}'); } catch (_) { return {}; } };
  const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n) + ' min';

  async function checkOnline(force=false) {
    const st=S.get(), now=new Date(), monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const key=[monthKey,st.loc.lat,st.loc.lng,st.method,st.asr].join('|');
    const cached=readReference(),cachedCurrent=cached&&cached.key===key;
    if(!force&&cachedCurrent&&Date.now()-Number(cached.checkedAt||0)<REF_MONTH){referenceStatus=cached.summary||'Monthly reference check completed.';return;}
    if(st.mode==='manual'){referenceStatus='Manual mosque times are selected. Online calculation comparison is skipped.';return;}
    if(!navigator.onLine){referenceStatus=(cachedCurrent&&cached.summary)||'Offline. The local prayer-time engine continues to work; online comparison will retry when connected.';return;}
    referenceStatus='Checking this month’s prayer-time reference…';render();
    const methodMap={jafari:0,karachi:1,isna:2,mwl:3,makkah:4,egypt:5};
    const date=`${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
    const params=new URLSearchParams({latitude:String(st.loc.lat),longitude:String(st.loc.lng),method:String(methodMap[st.method]??1),school:st.asr==='hanafi'?'1':'0',timezonestring:st.loc.tz||Intl.DateTimeFormat().resolvedOptions().timeZone,latitudeAdjustmentMethod:'1'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(`https://api.aladhan.com/v1/timings/${date}?${params}`,{signal:controller.signal,cache:'no-store'});
      if(!response.ok)throw new Error('reference service unavailable');
      const payload=await response.json(),remote=payload?.data?.timings;if(!remote)throw new Error('invalid reference response');
      const local=S.calcFor(now), keys=['fajr','dhuhr','asr','maghrib','isha'];
      const parse=v=>{const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null;};
      const diffs=keys.map(k=>{const a=parse(local[k]),b=parse(remote[k[0].toUpperCase()+k.slice(1)]);return a===null||b===null?null:Math.abs(a-b);}).filter(x=>x!==null);
      const max=diffs.length?Math.max(...diffs):null;
      referenceStatus=max===null?'Online reference received, but timings could not be compared.':`Checked ${date}. Maximum difference from AlAdhan reference: ${max} min. This is a comparison only; confirm with your mosque.`;
      localStorage.setItem(REF_KEY,JSON.stringify({key,checkedAt:Date.now(),summary:referenceStatus,maxDifference:max,provider:'AlAdhan'}));
    }catch(_){referenceStatus=(cachedCurrent&&cached.summary)||'Online reference unavailable. Local calculations remain active.';}
    finally{clearTimeout(timer);render();}
  }

  function render() {
    const st = S.get(), now = new Date(), calc = S.calcFor(now), eff = S.timesFor(now), jam = S.jamaatFor(now);
    const cityOptions = S.CITIES.map(c => `<option value="${c.id}" ${st.loc.id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('') +
      (st.loc.source === 'gps' ? `<option value="gps" selected>${esc(st.loc.name)}</option>` : '');
    const methodOptions = Object.entries(S.METHODS).map(([id, m]) => `<option value="${id}" ${st.method === id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    const times6 = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    body.innerHTML = `
      <div class="setting-row"><div><strong>Location</strong><p>${esc(st.loc.name)}${st.loc.source === 'default' ? ' · default' : st.loc.source === 'gps' ? ' · from GPS' : ''}</p></div><button class="st-btn" type="button" data-a="gps">Use my location</button></div>
      <div class="setting-row"><div><strong>City</strong><p>Location is optional. Choose a city instead.</p></div><select class="st-select" id="ssCity" aria-label="City">${cityOptions}</select></div>
      <div class="setting-row"><div><strong>Calculation method</strong><p>Default for Kashmir: Karachi (Fajr 18°, Isha 18°)</p></div><select class="st-select" id="ssMethod" aria-label="Calculation method">${methodOptions}</select></div>
      <div class="setting-row"><div><strong>School (madhab)</strong><p>${st.school === 'jafari' ? 'Ja‘fari uses its own calculation method (Fajr 16°, Isha 14°, Maghrib 4° after sunset) and the standard Asr shadow. Combining prayers is not modelled. Please confirm the angles with your marja‘ or local Ja‘fari authority.' : 'Sets the Asr shadow rule (Hanafi: double shadow; Shafi‘i, Maliki, Hanbali: single shadow). Independent of the calculation method. Other school differences are covered only in the Salah learning notes.'}</p></div><select class="st-select" id="ssSchool" aria-label="School"><option value="" ${st.school ? '' : 'selected'} disabled>Not selected</option>${Object.entries(S.SCHOOLS).map(([id, sc]) => `<option value="${id}" ${st.school === id ? 'selected' : ''}>${esc(sc.name)}</option>`).join('')}</select></div>
      <div class="setting-row"><div><strong>Asr calculation</strong><p>${st.school && S.SCHOOLS[st.school] && S.SCHOOLS[st.school].asr !== st.asr ? 'Overridden: your school uses ' + (S.SCHOOLS[st.school].asr === 'hanafi' ? 'the Hanafi rule' : 'the standard rule') + '. ' : ''}Separate from the Fajr/Isha method. Change it only to match your local mosque.</p></div><select class="st-select" id="ssAsr" aria-label="Asr calculation"><option value="hanafi" ${st.asr === 'hanafi' ? 'selected' : ''}>Hanafi (shadow factor 2)</option><option value="standard" ${st.asr === 'standard' ? 'selected' : ''}>Standard (shadow factor 1)</option></select></div>
      <div class="setting-row"><div><strong>Prayer times</strong><p>Calculated for your location, or enter your mosque's times</p></div>
        <div class="st-seg" role="group" aria-label="Prayer time source"><button type="button" data-a="mode" data-v="calculated" aria-pressed="${st.mode === 'calculated'}">Calculated</button><button type="button" data-a="mode" data-v="manual" aria-pressed="${st.mode === 'manual'}">My own</button></div></div>
      ${st.mode === 'calculated' ? `
        <span class="ss-head">ADJUST MINUTES</span>
        ${times6.map(k => `<div class="ss-row"><div><strong>${L[k]}</strong><small>Calculated ${T.to12(calc[k])} → <b>${T.to12(eff[k])}</b></small></div><div class="ss-step"><button type="button" data-a="adj" data-k="${k}" data-d="-1" aria-label="${L[k]} one minute earlier">−</button><span>${sign(st.adj[k] || 0)}</span><button type="button" data-a="adj" data-k="${k}" data-d="1" aria-label="${L[k]} one minute later">+</button></div></div>`).join('')}
        <div class="rm-actions"><button type="button" data-a="resetAdj">Reset to calculated</button></div>` : `
        <span class="ss-head">YOUR OWN TIMES</span>
        ${times6.map(k => `<div class="pd-field"><span>${L[k]}</span>${T.fieldHtml('ssm-' + k, L[k])}</div>`).join('')}
        <div class="rm-actions"><button type="button" data-a="saveManual">Save times</button></div>
        <p class="tiny-note">These fixed times are used every day. Switch back to Calculated for times that follow the seasons.</p>`}
      <span class="ss-head">JAMAAT</span>
      ${S.PRAYERS.map(k => { const j = st.jamaat[k]; return `<div class="ss-row"><div><strong>${L[k]}</strong><small>Adhan ${T.to12(eff[k])} · Jamaat <b>${T.to12(jam[k])}</b></small></div>
        <div class="ss-jam"><select data-a="jmode" data-k="${k}" aria-label="${L[k]} Jamaat type"><option value="offset" ${j.mode !== 'fixed' ? 'selected' : ''}>After Adhan</option><option value="fixed" ${j.mode === 'fixed' ? 'selected' : ''}>Fixed time</option></select>
        ${j.mode === 'fixed' ? T.fieldHtml('ssj-' + k, L[k] + ' Jamaat') : `<div class="ss-step"><button type="button" data-a="joff" data-k="${k}" data-d="-1" aria-label="${L[k]} Jamaat earlier">−</button><span>${j.offset} min</span><button type="button" data-a="joff" data-k="${k}" data-d="1" aria-label="${L[k]} Jamaat later">+</button></div>`}</div></div>`; }).join('')}
      <div class="rm-actions"><button type="button" data-a="resetJamaat">Reset Jamaat defaults</button></div>
      <p class="tiny-note">Jamaat starts at common defaults (Fajr +20, Dhuhr +15, Asr +15, Maghrib +5, Isha +15 minutes after Adhan). These are not any particular mosque's schedule. Set your own mosque's times above.</p>
      <p class="tiny-note">Calculated times work offline and follow the seasons and daylight saving. They are an aid: your local mosque timetable can differ by a few minutes, so adjust to match it.</p>
      <div class="v404-card"><strong>Monthly online reference check</strong><p class="tiny-note" id="ssOnlineReference" role="status" aria-live="polite">${esc(referenceStatus)}</p><button type="button" class="st-btn" data-a="checkOnline">Check prayer times online</button><p class="tiny-note">Compares this device’s calculation with AlAdhan for your coordinates, calculation method and Asr school. It never overwrites your prayer times. Local mosque timetables remain authoritative.</p></div>
      <p class="tiny-note ${note.startsWith('!') ? 'st-error' : ''}" role="status" aria-live="polite">${esc(note.replace(/^!/, ''))}</p>`;
    T.bind(body);
    if (st.mode === 'manual') { const m = manual(); times6.forEach(k => { const el = body.querySelector('#ssm-' + k); if (el) el.value = T.valid(m[k]) ? m[k] : eff[k]; }); }
    S.PRAYERS.forEach(k => { const el = body.querySelector('#ssj-' + k); if (el) el.value = T.valid(st.jamaat[k].fixed) ? st.jamaat[k].fixed : S.jamaatFor(now)[k]; });
    body.querySelectorAll('.t12 select').forEach(sel => sel.addEventListener('change', onPicker));
  }
  function onPicker(e) {
    const id = e.target.closest('.t12').id;
    if (id.startsWith('ssj-')) { const k = id.slice(4), v = e.target.closest('.t12').value; if (v) { S.setJamaat(k, { mode: 'fixed', fixed: v }); } }
  }

  body.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'ssCity') {
      const c = S.CITIES.find(x => x.id === t.value); if (!c) return;
      S.setLocation({ id: c.id, name: c.name, lat: c.lat, lng: c.lng, tz: c.tz, source: c.id === 'srinagar' ? 'default' : 'manual' }); note = '';
    } else if (t.id === 'ssMethod') S.set({ method: t.value });
    else if (t.id === 'ssAsr') S.set({ asr: t.value });
    else if (t.id === 'ssSchool') { if (!S.SCHOOLS[t.value]) return; S.setSchool(t.value); document.dispatchEvent(new CustomEvent('naseem:tradition-changed')); say(t.value === 'jafari' ? 'Ja‘fari school saved. Calculation method set to Ja‘fari.' : 'School saved. Asr rule updated; calculation method unchanged.'); }
    else if (t.dataset.a === 'jmode') S.setJamaat(t.dataset.k, { mode: t.value });
  });
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return;
    const st = S.get(), a = b.dataset.a, k = b.dataset.k;
    if (a === 'checkOnline') { checkOnline(true); return; }
    if (a === 'mode') { if (b.dataset.v === 'manual' && !Object.keys(manual()).length) { const eff = S.timesFor(new Date()); localStorage.setItem(MANUAL_KEY, JSON.stringify(eff)); } S.set({ mode: b.dataset.v }); note = ''; }
    else if (a === 'adj') S.setAdj(k, (st.adj[k] || 0) + Number(b.dataset.d));
    else if (a === 'resetAdj') { S.resetAdj(); note = 'Adjustments cleared. Times are back to the calculated values.'; }
    else if (a === 'joff') S.setJamaat(k, { offset: Math.max(0, Math.min(120, (Number(st.jamaat[k].offset) || 0) + Number(b.dataset.d))) });
    else if (a === 'resetJamaat') { S.resetJamaat(); note = 'Jamaat times are back to the defaults.'; }
    else if (a === 'saveManual') {
      const out = {};
      ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(x => { out[x] = body.querySelector('#ssm-' + x).value; });
      if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every(x => out[x])) { note = '!Choose an hour for every prayer first.'; render(); return; }
      localStorage.setItem(MANUAL_KEY, JSON.stringify(out)); S.set({ mode: 'manual' }); note = 'Your times are saved.'; say('Prayer times saved');
    }
    else if (a === 'gps') useGps(b);
  });

  function useGps(btn) {
    if (!navigator.geolocation) { note = '!This device cannot provide a location. Choose a city instead.'; render(); return; }
    btn.disabled = true; btn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = +pos.coords.latitude.toFixed(4), lng = +pos.coords.longitude.toFixed(4);
      S.setLocation({ id: 'gps', name: `My location (${lat}°, ${lng}°)`, lat, lng, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, source: 'gps' });
      note = 'Location found. Prayer times now follow where you are.';
    }, err => {
      note = `!${err && err.code === 1 ? 'Location permission was declined' : 'Your location could not be found'}. Naseem keeps using ${S.get().loc.name}. You can choose a city above.`;
      render();
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  }
  window.addEventListener('noor:schedule', render);
  window.addEventListener('naseem:tradition-changed', render);
  document.addEventListener('naseem:tradition-changed', render);
  render();
  checkOnline(false);
  window.addEventListener('online',()=>checkOnline(false));
})();
