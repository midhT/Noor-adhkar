/* Liquid Glass switch (Settings › Appearance). Default ON; the choice is remembered on this device.
   Off removes body.glass, which returns every screen to the previous solid look (see glass.css). */
(() => {
  'use strict';
  const KEY = 'naseemGlassV1', doc = document, body = doc.body;
  const read = () => { try { return localStorage.getItem(KEY) === 'off' ? 'off' : 'on'; } catch (_) { return 'on'; } };
  let mode = read();
  function apply() {
    const on = mode === 'on';
    body.classList.toggle('glass', on);
    const toggle = doc.getElementById('stGlassToggle');
    if (toggle) { toggle.setAttribute('aria-pressed', String(on)); toggle.textContent = on ? 'ON' : 'OFF'; }
    const note = doc.getElementById('stGlassNote');
    if (note) note.textContent = on ? 'A frosted, water-drop navigation bar.' : 'Off: the standard navigation bar.';
    doc.dispatchEvent(new CustomEvent('naseem:glass-changed', { detail: { on } }));
  }
  function set(value) { mode = value === 'off' ? 'off' : 'on'; try { localStorage.setItem(KEY, mode); } catch (_) {} apply(); }
  doc.addEventListener('click', e => { if (e.target.closest('#stGlassToggle')) set(mode === 'on' ? 'off' : 'on'); });
  window.NaseemGlass = { get: () => mode, set };
  apply();
})();
