/* Noor V3.3 M2.1 — motion & performance.
   1) Smooth mode: Auto (weak phones / Save-Data / reduced motion), Full, or Smooth — chosen in Settings › Appearance.
   2) Swipe left/right to move between tabs (and between Counter and Adhkar inside Dhikr).
   3) Small count "pop" on the Tasbeeh counter. */
(() => {
  'use strict';
  const KEY = 'noorMotionV1', doc = document, body = doc.body;
  const read = () => { try { const v = localStorage.getItem(KEY); return ['auto', 'full', 'smooth'].includes(v) ? v : 'auto'; } catch (_) { return 'auto'; } };
  const weak = () => {
    const n = navigator, c = n.connection || {};
    return (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 3) || c.saveData === true;
  };
  let mode = read();
  function applyMode() {
    const lite = mode === 'smooth' || (mode === 'auto' && weak());
    body.classList.toggle('lite', lite);
    doc.querySelectorAll('#stMotionSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.motion === mode)));
    const note = doc.getElementById('stMotionNote');
    if (note) note.textContent = mode === 'auto' ? (lite ? 'Auto is using Smooth mode on this phone.' : 'Auto is using Full animations on this phone.') : (mode === 'full' ? 'All animations on.' : 'Lighter effects for the smoothest scrolling.');
  }
  doc.addEventListener('click', e => {
    const b = e.target.closest('#stMotionSeg button'); if (!b) return;
    mode = b.dataset.motion; try { localStorage.setItem(KEY, mode); } catch (_) {}
    applyMode();
  });
  applyMode();

  /* Pause decorative infinite animations while the app is in the background. */
  doc.addEventListener('visibilitychange', () => body.classList.toggle('bg-paused', doc.hidden));

  /* Counter pop */
  const cb = doc.getElementById('countButton'), cv = doc.getElementById('countValue');
  if (cb && cv) cb.addEventListener('click', () => { cv.classList.remove('pop'); void cv.offsetWidth; cv.classList.add('pop'); });

  /* Swipe between tabs */
  const TABS = ['homeScreen', 'dhikrScreen', 'salahScreen', 'settingsScreen'];
  const PANELS = ['counterScreen', 'libraryScreen'];
  const EDGE = 24, MIN_DX = 56;
  let sx = 0, sy = 0, st = 0, track = false, tgt = null;
  const blocked = el => {
    if (!el || !el.closest) return true;
    if (body.classList.contains('sheet-open')) return true;
    if (el.closest('input,textarea,select,.count-button,.t12,.nsheet,[data-noswipe]')) return true;
    for (let n = el; n && n !== doc.body; n = n.parentElement) {
      if (n.scrollWidth > n.clientWidth + 4) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return true; }
    }
    return false;
  };
  doc.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { track = false; return; }
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); tgt = e.target;
    track = TABS.includes(window.curScreen || (typeof curScreen !== 'undefined' ? curScreen : '')) && sx > EDGE && sx < innerWidth - EDGE && !blocked(tgt);
  }, { passive: true });
  doc.addEventListener('touchend', e => {
    if (!track) return; track = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, dt = Math.max(1, Date.now() - st);
    if (Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 700) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });
  function go(step) {
    const cur = typeof curScreen !== 'undefined' ? curScreen : 'homeScreen';
    const dir = step > 0 ? 'next' : 'prev';
    if (cur === 'dhikrScreen') {
      const lib = doc.getElementById('libraryScreen');
      const onLib = lib && !lib.hidden;
      if (step > 0 && !onLib) { switchScreen('libraryScreen'); return; }
      if (step < 0 && onLib) { switchScreen('counterScreen'); return; }
    }
    const i = TABS.indexOf(cur) + step; if (i < 0 || i >= TABS.length) return;
    switchScreen(TABS[i], { dir });
  }
  window.NoorSwipe = { go };
})();
