/* Noor V3.3 prayer dashboard (display only). Times come from NoorSalah: calculated for the saved location
   (Srinagar by default) with the user's adjustments, or the user's own fixed times. Everything is edited in
   Settings › Salah. */
(() => {
  'use strict';
  const S = window.NoorSalah, T = window.NoorTime;
  const prayers = [
    { id: 'fajr', label: 'Fajr', ar: 'الفجر' },
    { id: 'dhuhr', label: 'Dhuhr', ar: 'الظهر' },
    { id: 'asr', label: 'Asr', ar: 'العصر' },
    { id: 'maghrib', label: 'Maghrib', ar: 'المغرب' },
    { id: 'isha', label: 'Isha', ar: 'العشاء' }
  ];
  const home = document.getElementById('homeScreen');
  const greeting = home?.querySelector('.greeting');
  if (!greeting || document.getElementById('prayerDashboard') || !S) return;
  const fmt = v => T.to12(v);

  const dashboard = document.createElement('section');
  dashboard.id = 'prayerDashboard';
  dashboard.className = 'prayer-dashboard';
  dashboard.innerHTML = `
    <div class="pd-next card-surface">
      <div class="pd-next-copy">
        <span class="pd-kicker">NEXT PRAYER</span>
        <strong class="pd-next-time" id="pdNextTime">—:—</strong>
        <span class="pd-next-meta" id="pdNextMeta"></span>
        <span class="pd-next-jamaat" id="pdNextJamaat"></span>
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
        <div class="pd-ring" id="pdRingOne"><div><span id="pdRingPrayer">Next prayer</span><strong id="pdRingTime">—:—</strong><small id="pdRingRemain"></small></div></div>
        <span class="pd-ring-label">PRAYER COUNTDOWN</span>
      </div>
      <div class="pd-ring-card card-surface">
        <div class="pd-ring pd-ring-alt" id="pdRingTwo"><div><strong id="pdRingTimeTwo">—:—</strong><span id="pdRingArabic" lang="ar" dir="rtl">الصلاة</span><small id="pdRingRemainTwo"></small></div></div>
        <span class="pd-ring-label">NEXT ON YOUR DAY</span>
      </div>
    </div>
    <div class="pd-date card-surface"><div><span class="pd-kicker" id="pdPlace">TODAY</span><strong id="pdDate"></strong><small id="pdSource"></small></div><button type="button" id="pdSettings" class="pd-edit">Prayer settings</button></div>`;
  greeting.insertAdjacentElement('afterend', dashboard);
  const $ = id => dashboard.querySelector(`#${id}`);
  $('pdSettings').addEventListener('click', () => { switchScreen('settingsScreen'); setTimeout(() => { const g = document.getElementById('stSalah'); if (g) { g.open = true; g.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 300); });

  const render = () => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = S.timesFor(now);
    const tmrDate = new Date(now); tmrDate.setDate(tmrDate.getDate() + 1);
    const list = prayers.map(p => ({ ...p, minutes: S.toMin(today[p.id]) }));
    let next = list.find(p => p.minutes > nowMin);
    let tomorrow = false, nextTimes = today, jamDate = now;
    if (!next) { tomorrow = true; nextTimes = S.timesFor(tmrDate); jamDate = tmrDate; next = { ...prayers[0], minutes: S.toMin(nextTimes.fajr) }; }
    $('pdTimetable').innerHTML = prayers.map(p => `<div class="pd-prayer ${next.id === p.id ? 'is-next' : ''}"><span>${p.label}</span><strong>${fmt(today[p.id])}</strong></div>`).join('');
    $('pdSunrise').textContent = fmt(today.sunrise);
    $('pdDhuhr').textContent = fmt(today.dhuhr);
    const target = new Date(tomorrow ? tmrDate : now); target.setHours(Math.floor(next.minutes / 60), next.minutes % 60, 0, 0);
    const diff = Math.max(0, Math.floor((target - now) / 1000));
    const remaining = `${Math.floor(diff / 3600)}h ${String(Math.floor((diff % 3600) / 60)).padStart(2, '0')}m`;
    const jam = S.jamaatFor(jamDate)[next.id];
    $('pdNextTime').textContent = fmt(nextTimes[next.id]);
    $('pdNextMeta').textContent = `${next.label} in ${remaining}${tomorrow ? ' · tomorrow' : ''}`;
    $('pdNextJamaat').textContent = `Adhan ${fmt(nextTimes[next.id])} · Jamaat ${fmt(jam)}`;
    $('pdNextArabic').textContent = next.ar;
    $('pdRingPrayer').textContent = next.label; $('pdRingTime').textContent = fmt(nextTimes[next.id]); $('pdRingRemain').textContent = `in ${remaining}`;
    $('pdRingTimeTwo').textContent = fmt(nextTimes[next.id]); $('pdRingArabic').textContent = next.ar; $('pdRingRemainTwo').textContent = `in ${remaining}`;
    const angle = Math.max(12, Math.min(348, (1 - diff / 86400) * 360));
    $('pdRingOne').style.setProperty('--ring-angle', `${angle}deg`); $('pdRingTwo').style.setProperty('--ring-angle', `${angle}deg`);
    const st = S.get();
    $('pdDate').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
    $('pdPlace').textContent = st.mode === 'manual' ? 'YOUR OWN TIMES' : st.loc.name.toUpperCase();
    $('pdSource').textContent = st.mode === 'manual' ? 'Entered by you in Settings' : `${S.METHODS[st.method].name} · ${st.asr === 'hanafi' ? 'Hanafi' : 'Standard'} Asr`;
  };
  render();
  window.addEventListener('noor:schedule', render);
  window.setInterval(render, 30000);
})();
