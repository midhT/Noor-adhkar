/* Noor V3.3 — Salah notifications (Settings › Notifications).
   Per prayer: Adhan notification (full Adhan audio, short tone or silent) and a separate Jamaat reminder.
   Alarms are scheduled one-by-one for the next 21 days from the calculated (or user-entered) times, so they
   follow the seasons; they are rebuilt every time the app opens or any prayer/Jamaat setting changes, and
   restored after a reboot by the notification plugin. A browser cannot ring background alarms, so there the
   card says so rather than pretending. */
(() => {
  'use strict';
  const root = document.querySelector('#stNotifications .st-body');
  const S = window.NoorSalah, T = window.NoorTime, N = window.NoorNative || {};
  if (!root || !S) return;
  const native = !!(N.isNative && N.notifications);
  const KEY = 'noorRemindersV1';
  const DAYS = 21, ID_LO = 1000, ID_HI = 90000, TEST_ADHAN = 99991, TEST_TONE = 99992;
  const PRAYERS = S.PRAYERS, LABEL = S.LABELS;
  const PRE = [0, 5, 10, 15, 30], LEAD = [5, 10, 15, 30];
  const defaults = () => ({ master: false, pre: 0, lead: 10,
    on: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    sound: { fajr: 'adhan', dhuhr: 'adhan', asr: 'adhan', maghrib: 'adhan', isha: 'adhan' },
    jam: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false } });
  const load = () => {
    const d = defaults();
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '{}');
      const pre = v.pre !== undefined ? v.pre : v.offset;           // V3.2 stored "offset"
      return { ...d, ...v, pre: PRE.includes(pre) ? pre : 0, lead: LEAD.includes(v.lead) ? v.lead : 10,
        on: { ...d.on, ...(v.on || {}) }, sound: { ...d.sound, ...(v.sound || {}) }, jam: { ...d.jam, ...(v.jam || {}) } };
    } catch (_) { return d; }
  };
  let cfg = load(), note = '', exactNeeded = false, previewing = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {} };
  const toast2 = m => { try { toast(m); } catch (_) {} };

  const bell = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/></svg>';
  const sw = (attrs, on, label) => `<button type="button" class="rm-switch" role="switch" aria-checked="${on}" aria-label="${label}" ${attrs}></button>`;
  const seg = (attr, opts, cur, fmt) => `<div class="rm-seg" role="group">${opts.map(o => `<button type="button" ${attr}="${o}" aria-pressed="${cur === o}">${fmt(o)}</button>`).join('')}</div>`;

  function statusText() {
    if (!cfg.master) return 'Off. Turn on to be notified at each prayer.';
    if (!native) return 'Preview only. Alarms need the installed Android app.';
    const n = PRAYERS.filter(p => cfg.on[p]).length, j = PRAYERS.filter(p => cfg.jam[p]).length;
    return `On · ${n} Adhan${n === 1 ? '' : 's'}${j ? ` · ${j} Jamaat` : ''}`;
  }
  function render() {
    const now = new Date(), t = S.timesFor(now), j = S.jamaatFor(now);
    root.innerHTML = `
      <div class="setting-row"><div><strong>Salah reminders</strong><p id="rmStatus">${statusText()}</p></div>${sw('id="rmMaster"', cfg.master, 'Salah reminders')}</div>
      <p class="rm-note" id="rmPermissionStatus" role="status">${native?'Checking Android notification permission…':'Background notifications require the installed Android app.'}</p>
      <div id="rmBody" ${cfg.master ? '' : 'hidden'}>
        ${PRAYERS.map(p => `
          <div class="rm-prayer ${cfg.on[p] ? '' : 'is-off'}">
            <div class="rm-prayer-head"><div><strong>${LABEL[p]}</strong><small>Adhan ${T.to12(t[p])} · Jamaat ${T.to12(j[p])}</small></div>${sw(`data-adhan="${p}"`, cfg.on[p], LABEL[p] + ' Adhan notification')}</div>
            <div class="rm-seg" role="group" aria-label="${LABEL[p]} sound">${[['adhan', 'Adhan'], ['tone', 'Tone'], ['silent', 'Silent']].map(([v, l]) => `<button type="button" data-sound="${p}:${v}" aria-pressed="${cfg.sound[p] === v}">${l}</button>`).join('')}</div>
            <div class="rm-jam"><span>Jamaat reminder · ${cfg.lead} min before</span>${sw(`data-jam="${p}"`, cfg.jam[p], LABEL[p] + ' Jamaat reminder')}</div>
          </div>`).join('')}
        <span class="rm-label">HEADS-UP BEFORE ADHAN</span>
        ${seg('data-pre', PRE, cfg.pre, o => (o === 0 ? 'Off' : o + ' min'))}
        <span class="rm-label">JAMAAT REMINDER LEAD TIME</span>
        ${seg('data-lead', LEAD, cfg.lead, o => o + ' min')}
        <div class="rm-actions">
          <button type="button" id="rmPreview">${previewing ? 'Stop Adhan preview' : 'Preview Adhan'}</button>
          <button type="button" id="rmTestAdhan" ${native ? '' : 'disabled'}>Test Adhan alarm</button>
          <button type="button" id="rmTestTone" ${native ? '' : 'disabled'}>Test tone</button>
          <button type="button" id="rmExact" ${exactNeeded ? '' : 'hidden'}>Allow exact alarms</button>
        </div>
        <p class="rm-note" id="rmNote" role="status" aria-live="polite">${note || (native ? 'The Adhan plays as the notification sound. If your phone shortens it, choose Tone. Heads-up reminders and Jamaat reminders use a short tone (or stay silent if that prayer is Silent).' : 'Reminders are scheduled by the installed Android app. A browser cannot ring an alarm in the background.')}</p>
        <p class="rm-note">If alarms arrive late or not at all on your phone, set Naseem to Unrestricted in Android Settings › Apps › Naseem › Battery.</p>
      </div>`;
  }

  const startOf = (d, hhmm) => { const m = S.toMin(hhmm); const x = new Date(d); x.setHours(Math.floor(m / 60), m % 60, 0, 0); return x.getTime(); };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  /** Builds every notification for the next 21 days. id = (day+1)*1000 + prayer*10 + kind (0 Adhan, 1 heads-up, 2 Jamaat). */
  function plan() {
    const out = [], nowMs = Date.now() + 3000;
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(); date.setDate(date.getDate() + d);
      const t = S.timesFor(date), j = S.jamaatFor(date);
      PRAYERS.forEach((p, i) => {
        const base = (d + 1) * 1000 + i * 10, adhanAt = startOf(date, t[p]), quiet = cfg.sound[p] === 'silent' ? 'silent' : 'tone';
        if (cfg.on[p]) {
          if (adhanAt > nowMs) out.push({ id: base, at: adhanAt, channel: cfg.sound[p], title: `Time for ${LABEL[p]}`, body: `${LABEL[p]} · ${T.to12(t[p])}. Jamaat at ${T.to12(j[p])}.` });
          const pre = adhanAt - cfg.pre * 60000;
          if (cfg.pre && pre > nowMs) out.push({ id: base + 1, at: pre, channel: quiet, title: `${LABEL[p]} in ${cfg.pre} minutes`, body: `Adhan at ${T.to12(t[p])}.` });
        }
        if (cfg.jam[p]) {
          const at = startOf(date, j[p]) - cfg.lead * 60000;
          if (at > nowMs) out.push({ id: base + 2, at, channel: quiet, title: `${LABEL[p]} Jamaat in ${cfg.lead} minutes`, body: `Jamaat at ${T.to12(j[p])}.` });
        }
      });
    }
    return out;
  }
  function widgetMap() {
    const map = {};
    for (let d = 0; d < DAYS; d++) { const date = new Date(); date.setDate(date.getDate() + d); map[dayKey(date)] = S.timesFor(date); }
    return map;
  }

  let applying = Promise.resolve();
  const apply = () => (applying = applying.then(async () => {
    if (N.widgets) N.widgets.setPrayerTimes(widgetMap());
    if (!native) return;
    const nt = N.notifications;
    await nt.cancelRange(ID_LO, ID_HI - 10);          // rebuild from scratch so nothing is ever duplicated
    if (!cfg.master) return;
    await nt.ensureChannels();
    const list = plan();
    if (list.length) await nt.schedule(list);
  }).catch(e => { note = 'Could not schedule alarms: ' + (e && e.message ? e.message : e); render(); }));

  async function turnOn() {
    if (!native) { cfg.master = true; save(); note = ''; render(); return; }
    const nt = N.notifications;
    let perm = await nt.permission();
    if (perm === 'prompt') perm = await nt.request();
    if (perm !== 'granted') {
      cfg.master = false; save();
      note = 'Notifications are blocked for Naseem. Allow them in Android Settings › Apps › Naseem › Notifications.';
      render(); return;
    }
    exactNeeded = (await nt.exactAlarm()) !== 'granted';
    cfg.master = true; save(); note = '';
    render(); await apply();
  }

  const audio = new Audio('audio/adhan.mp3');
  audio.addEventListener('ended', () => { previewing = false; const b = root.querySelector('#rmPreview'); if (b) b.textContent = 'Preview Adhan'; });

  root.addEventListener('click', async e => {
    const el = e.target.closest('button'); if (!el) return;
    if (el.id === 'rmMaster') { if (cfg.master) { cfg.master = false; save(); note = ''; render(); await apply(); } else await turnOn(); return; }
    if (el.dataset.adhan) { cfg.on[el.dataset.adhan] = !cfg.on[el.dataset.adhan]; }
    else if (el.dataset.jam) { cfg.jam[el.dataset.jam] = !cfg.jam[el.dataset.jam]; }
    else if (el.dataset.sound) { const [p, v] = el.dataset.sound.split(':'); cfg.sound[p] = v; }
    else if (el.dataset.pre !== undefined) { cfg.pre = Number(el.dataset.pre); }
    else if (el.dataset.lead !== undefined) { cfg.lead = Number(el.dataset.lead); }
    else if (el.id === 'rmPreview') {
      if (previewing) { audio.pause(); audio.currentTime = 0; previewing = false; }
      else { try { await audio.play(); previewing = true; } catch (_) { note = 'The Adhan preview could not play.'; } }
      render(); return;
    }
    else if (el.id === 'rmTestAdhan' || el.id === 'rmTestTone') {
      const nt = N.notifications;
      let perm = await nt.permission(); if (perm === 'prompt') perm = await nt.request();
      if (perm !== 'granted') { note = 'Allow notifications first to test.'; render(); return; }
      await nt.ensureChannels();
      const adhan = el.id === 'rmTestAdhan';
      try { await nt.schedule([{ id: adhan ? TEST_ADHAN : TEST_TONE, at: Date.now() + 10000, channel: adhan ? 'adhan' : 'tone', title: adhan ? 'Naseem Adhan test' : 'Naseem tone test', body: 'Your salah notifications are working.' }]); toast2('Test in 10 seconds. You can lock the screen.'); }
      catch (err) { note = 'Test failed: ' + (err && err.message ? err.message : err); render(); }
      return;
    }
    else if (el.id === 'rmExact') { exactNeeded = (await N.notifications.openExactAlarmSettings()) !== 'granted'; render(); return; }
    else return;
    save(); render(); await apply();
  });

  window.addEventListener('noor:schedule', () => { render(); apply(); });
  render();
  if(native){N.notifications.permission().then(p=>{const el=root.querySelector('#rmPermissionStatus');if(el)el.textContent=p==='granted'?'Android notification permission: allowed.':p==='denied'?'Android notification permission: blocked. Enable it in Android Settings → Apps → Naseem → Notifications.':'Android notification permission: not yet requested.';}).catch(()=>{});}
  // Rebuild once per launch so alarms self-heal after updates, date changes, time-zone changes or edits made elsewhere.
  (async () => {
    try {
      if (native && cfg.master) {
        if ((await N.notifications.permission()) !== 'granted') { cfg.master = false; save(); note = 'Notifications were turned off in Android settings.'; render(); }
        else { exactNeeded = (await N.notifications.exactAlarm()) !== 'granted'; render(); }
      }
      await apply();
    } catch (_) {}
  })();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') apply(); });
})();
