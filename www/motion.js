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
  const TABS = ['homeScreen', 'dhikrScreen', 'salahScreen', 'quranReaderScreen', 'featuresScreen', 'zakatScreen', 'settingsScreen'];
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
    track = TABS.includes(window.curScreen || 'homeScreen') && sx > EDGE && sx < innerWidth - EDGE && !blocked(tgt);
  }, { passive: true });
  doc.addEventListener('touchend', e => {
    if (!track) return; track = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, dt = Math.max(1, Date.now() - st);
    if (Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 700) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });
  function go(step) {
    const cur = window.curScreen || 'homeScreen';
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
  /* Press-and-drag across the bottom bar (iOS-style): hold on any tab and slide; a highlight follows the finger over
     the tabs and the screen switches when you lift. While dragging, all tabs are equal width so nothing moves under the
     finger. A plain tap is untouched; the drag starts only after 8px of horizontal movement. */
  const nav = doc.querySelector('.bottom-nav');
  if (nav) {
    let down = false, dragging = false, sx = 0, pid = null, peek = null;
    const items = () => [...nav.querySelectorAll('.nav-item')];
    const itemAt = x => {
      // Clamp to the first/last tab (not the bar's padded edge) so sliding past either end selects that end tab.
      const list = items(); if (!list.length) return null;
      const a = list[0].getBoundingClientRect(), z = list[list.length - 1].getBoundingClientRect();
      const el = doc.elementFromPoint(Math.min(Math.max(x, a.left + 2), z.right - 2), a.top + a.height / 2);
      return el && el.closest ? el.closest('.nav-item') : null;
    };
    const setPeek = it => { if (it === peek) return; items().forEach(i => i.classList.toggle('peek', i === it)); peek = it; };
    const finish = commit => {
      const target = peek, was = dragging;
      down = false; dragging = false; nav.classList.remove('dragging'); setPeek(null);
      if (!was) return;
      // The finger lifted after a drag: do not let the browser also treat it as a tap.
      const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
      nav.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => nav.removeEventListener('click', stop, true), 400);
      const id = target && target.dataset.screen, cur = window.curScreen || ''; 
      if (commit && id && id !== cur) {
        const list = items(), from = list.findIndex(i => i.dataset.screen === cur);
        switchScreen(id, { dir: list.indexOf(target) > from ? 'next' : 'prev' });
      }
    };
    nav.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!(e.target.closest && e.target.closest('.nav-item'))) return;
      down = true; dragging = false; sx = e.clientX; pid = e.pointerId; peek = null;
    });
    nav.addEventListener('pointermove', e => {
      if (!down || e.pointerId !== pid) return;
      if (!dragging) {
        if (Math.abs(e.clientX - sx) < 8) return;
        dragging = true; nav.classList.add('dragging');
        try { nav.setPointerCapture(pid); } catch (_) {}
      }
      const it = itemAt(e.clientX);
      if (it && it !== peek) { setPeek(it); if (navigator.vibrate && !body.classList.contains('lite')) try { navigator.vibrate(5); } catch (_) {} }
    });
    nav.addEventListener('pointerup', e => { if (e.pointerId === pid) finish(true); });
    nav.addEventListener('pointercancel', () => finish(false));
  }

  /* Morphing tab pill: a single shape glides (and stretches) to the active or dragged-over tab instead of snapping. */
  (() => {
    const bar = doc.querySelector('.bottom-nav'); if (!bar) return;
    const pill = doc.createElement('span'); pill.className = 'nav-pill'; pill.setAttribute('aria-hidden', 'true');
    bar.insertBefore(pill, bar.firstChild); bar.classList.add('has-pill');
    let x = 0, w = 0, ready = false, raf = 0, until = 0;
    const target = () => {
      const it = bar.querySelector('.nav-item.peek') || bar.querySelector('.nav-item.active'); if (!it) return null;
      const b = bar.getBoundingClientRect(), r = it.getBoundingClientRect(), edge = parseFloat(getComputedStyle(bar).borderLeftWidth) || 0;
      return { x: r.left - b.left - edge, w: r.width };
    };
    const step = () => {
      raf = 0; const t = target(); if (!t || !t.w) return;
      if (!ready || body.classList.contains('lite')) { x = t.x; w = t.w; ready = true; } else { x += (t.x - x) * 0.24; w += (t.w - w) * 0.24; }
      pill.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'; pill.style.width = w.toFixed(2) + 'px';
      if (!pill.classList.contains('on')) pill.classList.add('on');
      if (Math.abs(t.x - x) > 0.4 || Math.abs(t.w - w) > 0.4 || performance.now() < until) raf = requestAnimationFrame(step);
    };
    const kick = () => { until = performance.now() + 380; if (!raf) raf = requestAnimationFrame(step); };
    new MutationObserver(muts => { if (muts.some(m => m.target !== pill)) kick(); }).observe(bar, { subtree: true, attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', kick); doc.addEventListener('noor:screen', kick); kick(); setTimeout(kick, 700);
  })();
  window.NoorSwipe = { go };
})();
