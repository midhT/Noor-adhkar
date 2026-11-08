/* Noor V3.2 — Salah alarm reminders.
   Uses the prayer times the user saved in the dashboard. On Android (the installed app) each enabled
   prayer gets a repeating exact alarm via a high-importance notification channel. In a plain browser
   there is no way to fire background alarms, so the card says so instead of pretending. */
(() => {
  'use strict';
  const dash = document.getElementById('prayerDashboard');
  if (!dash || document.getElementById('rmCard')) return;

  const KEY = 'noorRemindersV1';
  const SCHEDULE_KEY = 'noorPrayerScheduleV1';
  const PRAYERS = [
    { id: 'fajr', label: 'Fajr', nid: 1001 },
    { id: 'dhuhr', label: 'Dhuhr', nid: 1002 },
    { id: 'asr', label: 'Asr', nid: 1003 },
    { id: 'maghrib', label: 'Maghrib', nid: 1004 },
    { id: 'isha', label: 'Isha', nid: 1005 }
  ];
  const TEST_ID = 1999;
  const OFFSETS = [0, 5, 10, 15, 30];
  const N = window.NoorNative || {};
  const native = !!(N.isNative && N.notifications);

  const defaults = { master: false, offset: 0, on: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } };
  const load = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...defaults, ...v, on: { ...defaults.on, ...(v.on || {}) } };
    } catch (_) { return { ...defaults, on: { ...defaults.on } }; }
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {} };
  const schedule = () => { try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '{}'); } catch (_) { return {}; } };
  const toMin = v => {
    if (!/^\d{2}:\d{2}$/.test(v || '')) return null;
    const [h, m] = v.split(':').map(Number);
    return h < 24 && m < 60 ? h * 60 + m : null;
  };
  const toast = msg => { const el = document.getElementById('toast'); if (!el) return; el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); };

  let cfg = load();
  let note = '';

  const bell = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/></svg>';
  const card = document.createElement('section');
  card.id = 'rmCard';
  card.className = 'rm-card';
  card.innerHTML = `
    <div class="rm-head">
      <div class="rm-bell">${bell}</div>
      <div><strong>Salah reminders</strong><small id="rmStatus">Off</small></div>
      <button type="button" class="rm-switch" id="rmMaster" role="switch" aria-checked="false" aria-label="Salah reminders"></button>
    </div>
    <div class="rm-body" id="rmBody" hidden>
      <div id="rmRows"></div>
      <span class="rm-label">ALERT ME</span>
      <div class="rm-seg" id="rmSeg" role="group" aria-label="When to alert"></div>
      <div class="rm-actions">
        <button type="button" id="rmTest">Test alarm in 10 s</button>
        <button type="button" id="rmExact" hidden>Allow exact alarms</button>
      </div>
      <p class="rm-note" id="rmNote" role="status" aria-live="polite"></p>
    </div>`;
  const editor = dash.querySelector('#pdEditor');
  (editor || dash.lastElementChild).insertAdjacentElement('afterend', card);
  const $ = id => card.querySelector('#' + id);

  const offsetLabel = o => (o === 0 ? 'At time' : `${o} min`);
  const rowsFor = () => {
    const sch = schedule();
    return PRAYERS.map(p => ({ ...p, time: sch[p.id] || '', min: toMin(sch[p.id]) }));
  };

  function render() {
    const rows = rowsFor();
    const active = rows.filter(r => cfg.on[r.id] && r.min !== null);
    $('rmMaster').setAttribute('aria-checked', String(cfg.master));
    $('rmBody').hidden = !cfg.master;
    $('rmRows').innerHTML = rows.map(r => `
      <div class="rm-row"><span>${r.label}</span><em>${r.time || 'Set time'}</em>
        <button type="button" class="rm-switch" data-id="${r.id}" role="switch" aria-checked="${cfg.on[r.id]}" aria-label="${r.label} reminder"></button>
      </div>`).join('');
    $('rmSeg').innerHTML = OFFSETS.map(o => `<button type="button" data-off="${o}" aria-pressed="${cfg.offset === o}">${offsetLabel(o)}</button>`).join('');
    let status;
    if (!cfg.master) status = 'Off — tap to get an alarm at each prayer';
    else if (!native) status = 'Preview only — alarms need the Android app';
    else if (!rows.some(r => r.min !== null)) status = 'Add your prayer times to start';
    else status = `On · ${active.length} prayer${active.length === 1 ? '' : 's'} · ${cfg.offset ? cfg.offset + ' min before' : 'at prayer time'}`;
    $('rmStatus').textContent = status;
    $('rmNote').textContent = note || (native ? 'Alarms repeat daily and are restored after a restart. Change prayer times above and they update automatically.' : 'Reminders are scheduled by the installed Android app. A browser cannot ring an alarm in the background.');
    $('rmTest').disabled = !native;
  }

  async function apply() {
    // Keep the prayer-times widget in sync regardless of reminder state.
    if (N.widgets) N.widgets.setPrayerTimes(schedule());
    if (!native) return;
    const nt = N.notifications;
    await nt.cancel(PRAYERS.map(p => p.nid));
    if (!cfg.master) return;
    await nt.ensureChannel();
    const list = [];
    for (const r of rowsFor()) {
      if (!cfg.on[r.id] || r.min === null) continue;
      const at = (r.min - cfg.offset + 1440) % 1440;
      list.push({
        id: r.nid, hour: Math.floor(at / 60), minute: at % 60,
        title: cfg.offset ? `${r.label} in ${cfg.offset} minutes` : `Time for ${r.label}`,
        body: cfg.offset ? `${r.label} is at ${r.time}.` : `It is ${r.time}. Take a moment to pray.`
      });
    }
    if (list.length) await nt.schedule(list);
  }

  async function turnOn() {
    if (!native) { cfg.master = true; save(); note = ''; render(); return; }
    const nt = N.notifications;
    let perm = await nt.permission();
    if (perm !== 'granted') perm = await nt.request();
    if (perm !== 'granted') {
      cfg.master = false; save();
      note = 'Notifications are blocked for Noor. Allow them in Android Settings › Apps › Noor › Notifications.';
      render(); return;
    }
    const exact = await nt.exactAlarm();
    $('rmExact').hidden = exact === 'granted';
    cfg.master = true; save(); note = '';
    try { await apply(); } catch (e) { note = 'Could not schedule alarms: ' + (e && e.message ? e.message : e); }
    render();
  }

  $('rmMaster').addEventListener('click', async () => {
    if (cfg.master) {
      cfg.master = false; save(); note = '';
      try { await apply(); } catch (_) {}
      render();
    } else { await turnOn(); }
  });
  card.addEventListener('click', async e => {
    const sw = e.target.closest('.rm-row .rm-switch');
    const off = e.target.closest('#rmSeg button');
    if (sw) {
      cfg.on[sw.dataset.id] = !cfg.on[sw.dataset.id]; save();
      try { await apply(); } catch (_) {} render();
    } else if (off) {
      cfg.offset = Number(off.dataset.off); save();
      try { await apply(); } catch (_) {} render();
    }
  });
  $('rmTest').addEventListener('click', async () => {
    if (!native) return;
    const nt = N.notifications;
    let perm = await nt.permission();
    if (perm !== 'granted') perm = await nt.request();
    if (perm !== 'granted') { note = 'Allow notifications first to test the alarm.'; render(); return; }
    await nt.ensureChannel();
    try {
      await nt.schedule([{ id: TEST_ID, title: 'Noor test alarm', body: 'Your salah alarms are working.', at: Date.now() + 10000 }]);
      toast('Test alarm in 10 seconds — you can lock the screen');
    } catch (e) { note = 'Test failed: ' + (e && e.message ? e.message : e); render(); }
  });
  $('rmExact').addEventListener('click', async () => {
    const r = await N.notifications.openExactAlarmSettings();
    $('rmExact').hidden = r === 'granted';
  });

  window.addEventListener('noor:schedule', async () => {
    render();
    try { await apply(); } catch (_) {}
  });

  render();
  // Re-apply once per launch so alarms self-heal after updates or cleared state.
  (async () => {
    try {
      if (native && cfg.master) {
        const perm = await N.notifications.permission();
        if (perm !== 'granted') { cfg.master = false; save(); note = 'Notifications were turned off in Android settings.'; render(); return; }
        const exact = await N.notifications.exactAlarm();
        $('rmExact').hidden = exact === 'granted';
      }
      await apply();
    } catch (_) {}
  })();
})();
