/* Noor — 12-hour time helpers. Times are stored as "HH:mm" (24-hour, locale-independent) but are
   only ever shown to the user as "h:mm AM/PM". Replaces <input type="time">, whose display format
   follows the phone's clock setting and can show 24-hour time. */
(() => {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const valid = v => /^\d{2}:\d{2}$/.test(v || '') && Number(v.slice(0, 2)) < 24 && Number(v.slice(3)) < 60;
  const to12 = (hhmm, withSuffix = true) => {
    if (!valid(hhmm)) return '—:—';
    const h24 = Number(hhmm.slice(0, 2)), m = Number(hhmm.slice(3));
    return `${h24 % 12 || 12}:${pad(m)}${withSuffix ? ' ' + (h24 >= 12 ? 'PM' : 'AM') : ''}`;
  };
  const from12 = (h, m, ap) => {
    h = Number(h); m = Number(m);
    if (!(h >= 1 && h <= 12) || !(m >= 0 && m < 60)) return '';
    return `${pad((h % 12) + (ap === 'PM' ? 12 : 0))}:${pad(m)}`;
  };
  const fieldHtml = (id, label) => {
    const hours = ['<option value="">--</option>'].concat(Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`)).join('');
    const mins = Array.from({ length: 60 }, (_, i) => `<option value="${i}">${pad(i)}</option>`).join('');
    return `<span class="t12" id="${id}" role="group" aria-label="${label} time">` +
      `<select data-p="h" aria-label="${label} hour">${hours}</select><b aria-hidden="true">:</b>` +
      `<select data-p="m" aria-label="${label} minute">${mins}</select>` +
      `<select data-p="ap" aria-label="${label} AM or PM"><option>AM</option><option>PM</option></select></span>`;
  };
  // Gives each .t12 element a `.value` property that reads/writes "HH:mm" (or '' when unset).
  const bind = root => root.querySelectorAll('.t12').forEach(el => {
    const sel = p => el.querySelector(`[data-p="${p}"]`);
    Object.defineProperty(el, 'value', {
      get: () => (sel('h').value ? from12(sel('h').value, sel('m').value, sel('ap').value) : ''),
      set: v => {
        if (!valid(v)) { sel('h').value = ''; sel('m').value = '0'; sel('ap').value = 'AM'; return; }
        const h24 = Number(v.slice(0, 2));
        sel('h').value = String(h24 % 12 || 12); sel('m').value = String(Number(v.slice(3))); sel('ap').value = h24 >= 12 ? 'PM' : 'AM';
      }
    });
    el.value = '';
  });
  window.NoorTime = { to12, from12, valid, fieldHtml, bind };
})();
