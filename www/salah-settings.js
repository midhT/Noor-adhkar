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
  let note = '';
  const manual = () => { try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}'); } catch (_) { return {}; } };
  const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n) + ' min';

  function render() {
    const st = S.get(), now = new Date(), calc = S.calcFor(now), eff = S.timesFor(now), jam = S.jamaatFor(now);
    let profileData={};try{profileData=JSON.parse(localStorage.getItem('naseem-v404-settings')||'{}');}catch(_){}
    const profileLabels={hanafi:'Sunni · Hanafi',shafii:'Sunni · Shafi‘i',maliki:'Sunni · Maliki',hanbali:'Sunni · Hanbali',jafari:'Shia · Ja‘fari (Twelver)'};
    const profileLabel=profileLabels[profileData.tradition]||'Not selected';
    const cityOptions = S.CITIES.map(c => `<option value="${c.id}" ${st.loc.id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('') +
      (st.loc.source === 'gps' ? `<option value="gps" selected>${esc(st.loc.name)}</option>` : '');
    const methodOptions = Object.entries(S.METHODS).map(([id, m]) => `<option value="${id}" ${st.method === id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    const times6 = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    body.innerHTML = `
      <div class="setting-row"><div><strong>Location</strong><p>${esc(st.loc.name)}${st.loc.source === 'default' ? ' · default' : st.loc.source === 'gps' ? ' · from GPS' : ''}</p></div><button class="st-btn" type="button" data-a="gps">Use my location</button></div>
      <div class="setting-row"><div><strong>City</strong><p>Location is optional. Choose a city instead.</p></div><select class="st-select" id="ssCity" aria-label="City">${cityOptions}</select></div>
      <div class="setting-row"><div><strong>Calculation method</strong><p>Default for Kashmir: Karachi (Fajr 18°, Isha 18°)</p></div><select class="st-select" id="ssMethod" aria-label="Calculation method">${methodOptions}</select></div>
      <div class="setting-row"><div><strong>Learning profile</strong><p>Choose your school under More → Tradition profiles. The profile aligns the Asr rule for the four Sunni schools; Ja‘fari-specific calculation is not yet available.</p></div><span class="setting-value">${esc(profileLabel)}</span></div>
      <div class="setting-row"><div><strong>Asr calculation</strong><p>The Asr shadow-length rule is separate from the Fajr/Isha calculation method. You can still match your local mosque here.</p></div><select class="st-select" id="ssAsr" aria-label="Asr calculation"><option value="hanafi" ${st.asr === 'hanafi' ? 'selected' : ''}>Hanafi (shadow factor 2)</option><option value="standard" ${st.asr === 'standard' ? 'selected' : ''}>Standard (shadow factor 1)</option></select></div>
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
    else if (t.dataset.a === 'jmode') S.setJamaat(t.dataset.k, { mode: t.value });
  });
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return;
    const st = S.get(), a = b.dataset.a, k = b.dataset.k;
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
  render();
})();
