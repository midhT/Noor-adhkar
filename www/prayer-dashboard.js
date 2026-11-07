/* Noor V3.1 prayer dashboard — manual schedule until location/calculation is configured. */
(() => {
  'use strict';
  const KEY = 'noorPrayerScheduleV1';
  const prayers = [
    { id: 'fajr', label: 'Fajr', ar: 'الفجر' },
    { id: 'dhuhr', label: 'Dhuhr', ar: 'الظهر' },
    { id: 'asr', label: 'Asr', ar: 'العصر' },
    { id: 'maghrib', label: 'Maghrib', ar: 'المغرب' },
    { id: 'isha', label: 'Isha', ar: 'العشاء' }
  ];
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (_) { return {}; }
  };
  const write = value => localStorage.setItem(KEY, JSON.stringify(value));
  const fmt = value => value || '—:—';
  const toMinutes = value => {
    if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
    const [h, m] = value.split(':').map(Number);
    return h < 24 && m < 60 ? h * 60 + m : null;
  };
  const timeText = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const home = document.getElementById('homeScreen');
  const greeting = home?.querySelector('.greeting');
  if (!greeting || document.getElementById('prayerDashboard')) return;

  const dashboard = document.createElement('section');
  dashboard.id = 'prayerDashboard';
  dashboard.className = 'prayer-dashboard';
  dashboard.innerHTML = `
    <div class="pd-next card-surface">
      <div class="pd-next-copy">
        <span class="pd-kicker">NEXT PRAYER</span>
        <strong class="pd-next-time" id="pdNextTime">—:—</strong>
        <span class="pd-next-meta" id="pdNextMeta">Add your prayer times to begin</span>
      </div>
      <div class="pd-sun" aria-hidden="true">☼</div>
      <div class="pd-next-ar" lang="ar" dir="rtl" id="pdNextArabic">الصلاة</div>
    </div>
    <div class="pd-caption">PRAYER PACE</div>
    <div class="pd-timetable card-surface" id="pdTimetable" aria-label="Daily prayer timetable"></div>
    <div class="pd-caption">QUICK VIEW</div>
    <div class="pd-banner-row">
      <div class="pd-banner card-surface"><span>Sunrise</span><strong id="pdSunrise">—:—</strong><small>Sunrise</small></div>
      <div class="pd-banner card-surface"><span>Dhuhr</span><strong id="pdDhuhr">—:—</strong><small>Midday prayer</small></div>
    </div>
    <div class="pd-ring-row">
      <div class="pd-ring-card card-surface">
        <div class="pd-ring" id="pdRingOne"><div><span id="pdRingPrayer">Next prayer</span><strong id="pdRingTime">—:—</strong><small id="pdRingRemain">Set prayer times</small></div></div>
        <span class="pd-ring-label">PRAYER COUNTDOWN</span>
      </div>
      <div class="pd-ring-card card-surface">
        <div class="pd-ring pd-ring-alt" id="pdRingTwo"><div><strong id="pdRingTimeTwo">—:—</strong><span id="pdRingArabic" lang="ar" dir="rtl">الصلاة</span><small id="pdRingRemainTwo">Your daily rhythm</small></div></div>
        <span class="pd-ring-label">NEXT ON YOUR DAY</span>
      </div>
    </div>
    <div class="pd-date card-surface"><div><span class="pd-kicker">TODAY</span><strong id="pdDate"></strong><small>Prayer times are stored on this device</small></div><button type="button" id="pdEditToggle" class="pd-edit">Edit times</button></div>
    <details class="pd-editor" id="pdEditor"><summary>Set prayer times</summary>
      <p>Enter the times from your local mosque or a trusted timetable. Noor will use these values for this dashboard. Automatic location-based calculation will be added separately.</p>
      <div class="pd-input-grid" id="pdInputs"></div>
      <label class="pd-sunrise-input">Sunrise <input type="time" id="pdSunriseInput" aria-label="Sunrise time"></label>
      <div class="pd-editor-actions"><button type="button" id="pdSave" class="pd-save">Save schedule</button><button type="button" id="pdClear" class="pd-clear">Clear</button></div>
      <p class="pd-save-status" id="pdSaveStatus" role="status" aria-live="polite"></p>
    </details>`;
  greeting.insertAdjacentElement('afterend', dashboard);

  const inputs = dashboard.querySelector('#pdInputs');
  inputs.innerHTML = prayers.map(p => `<label>${p.label}<input type="time" id="pd-${p.id}" aria-label="${p.label} time"></label>`).join('');
  const $ = id => dashboard.querySelector(`#${id}`);
  const date = new Date();
  $('pdDate').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  $('pdEditToggle').addEventListener('click', () => { $('pdEditor').open = !$('pdEditor').open; $('pdEditor').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });

  let schedule = read();
  const render = () => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = prayers.map(p => ({ ...p, minutes: toMinutes(schedule[p.id]) })).filter(p => p.minutes !== null).sort((a, b) => a.minutes - b.minutes);
    const next = upcoming.find(p => p.minutes > nowMinutes) || (upcoming[0] ? { ...upcoming[0], tomorrow: true } : null);
    const hasAll = prayers.every(p => toMinutes(schedule[p.id]) !== null);
    $('pdTimetable').innerHTML = prayers.map(p => `<div class="pd-prayer ${next && next.id === p.id ? 'is-next' : ''}"><span>${p.label}</span><strong>${fmt(schedule[p.id])}</strong></div>`).join('');
    $('pdSunrise').textContent = fmt(schedule.sunrise);
    $('pdDhuhr').textContent = fmt(schedule.dhuhr);
    if (!next) {
      $('pdNextTime').textContent = '—:—'; $('pdNextMeta').textContent = 'Add your prayer times to begin'; $('pdNextArabic').textContent = 'الصلاة';
      $('pdRingPrayer').textContent = 'Next prayer'; $('pdRingTime').textContent = '—:—'; $('pdRingRemain').textContent = 'Set prayer times';
      $('pdRingTimeTwo').textContent = '—:—'; $('pdRingArabic').textContent = 'الصلاة'; $('pdRingRemainTwo').textContent = 'Your daily rhythm';
      return;
    }
    const target = new Date(now); target.setHours(Math.floor(next.minutes / 60), next.minutes % 60, 0, 0); if (next.tomorrow) target.setDate(target.getDate() + 1);
    const diff = Math.max(0, Math.floor((target - now) / 1000));
    const remaining = `${Math.floor(diff / 3600)}h ${String(Math.floor((diff % 3600) / 60)).padStart(2, '0')}m`;
    $('pdNextTime').textContent = fmt(schedule[next.id]);
    $('pdNextMeta').textContent = `in ${remaining}${next.tomorrow ? ' · tomorrow' : ''}${hasAll ? '' : ' · partial schedule'}`;
    $('pdNextArabic').textContent = next.ar;
    $('pdRingPrayer').textContent = next.label; $('pdRingTime').textContent = fmt(schedule[next.id]); $('pdRingRemain').textContent = `in ${remaining}`;
    $('pdRingTimeTwo').textContent = fmt(schedule[next.id]); $('pdRingArabic').textContent = next.ar; $('pdRingRemainTwo').textContent = `in ${remaining}`;
    const elapsed = 1 - (diff / 86400); const angle = Math.max(12, Math.min(348, elapsed * 360));
    $('pdRingOne').style.setProperty('--ring-angle', `${angle}deg`); $('pdRingTwo').style.setProperty('--ring-angle', `${angle}deg`);
  };
  const loadInputs = () => {
    prayers.forEach(p => { $(`pd-${p.id}`).value = schedule[p.id] || ''; });
    $('pdSunriseInput').value = schedule.sunrise || '';
  };
  loadInputs(); render();
  $('pdSave').addEventListener('click', () => {
    const nextSchedule = {};
    prayers.forEach(p => { nextSchedule[p.id] = $(`pd-${p.id}`).value; });
    nextSchedule.sunrise = $('pdSunriseInput').value;
    if (!prayers.some(p => nextSchedule[p.id])) { $('pdSaveStatus').textContent = 'Enter at least one prayer time.'; return; }
    schedule = nextSchedule; write(schedule); render(); $('pdSaveStatus').textContent = 'Prayer schedule saved on this device.';
  });
  $('pdClear').addEventListener('click', () => {
    schedule = {}; localStorage.removeItem(KEY); loadInputs(); render(); $('pdSaveStatus').textContent = 'Saved prayer times cleared.';
  });
  window.setInterval(render, 30000);
})();
