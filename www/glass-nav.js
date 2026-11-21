/* Naseem glass navigation: one glass "lens" under the active tab.
   The lens only moves with a CSS transform driven by the --lens variable (no layout reads, no per-frame JS while
   settling). Press and hold swells it; sliding a finger along the bar makes it follow the finger, and on release it
   springs to the tab that is active (the existing drag handler in motion.js decides which screen opens).
   Styling lives in glass.css and applies only while Settings > Liquid Glass is on. */
(function () {
  'use strict';
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;
  const lens = document.createElement('span');
  lens.className = 'nav-lens'; lens.setAttribute('aria-hidden', 'true');
  nav.insertBefore(lens, nav.firstChild);
  const tabs = () => [...nav.querySelectorAll('.nav-item')];
  let drag = false, down = false, sx = 0, pid = null, rect = null;

  let slotPx = 0;
  const measure = () => { const n = tabs().length || 5; slotPx = Math.max(0, (nav.clientWidth - 8) / n); nav.style.setProperty('--slot', slotPx.toFixed(2) + 'px'); };
  // --lx is the lens position in px; the capsule's blur layer has a hole at that spot so the lens can refract the crisp page.
  const setPos = p => { nav.style.setProperty('--lens', p.toFixed(3)); nav.style.setProperty('--lx', (4 + p * slotPx).toFixed(2) + 'px'); };
  let shown = 0, settle = 0;
  function sync() {
    const list = tabs();
    nav.style.setProperty('--count', String(list.length || 5));
    if (drag) return;
    const i = list.findIndex(t => t.classList.contains('active'));
    const pos = i < 0 ? 0 : i, dist = Math.abs(pos - shown);
    if (dist > 0.4 && !down) {                       // the lens stretches along its travel, then settles with the spring
      nav.style.setProperty('--stretch', (1 + Math.min(0.3, dist * 0.085)).toFixed(3));
      nav.classList.add('lens-moving'); clearTimeout(settle);
      settle = setTimeout(() => nav.classList.remove('lens-moving'), 190);
    }
    shown = pos; setPos(pos);
  }
  function release() {
    down = false; drag = false; pid = null; rect = null;
    nav.classList.remove('lens-press', 'lens-drag');
    sync();
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); sync(); }).observe(nav);
  measure();
  new MutationObserver(sync).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });

  nav.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!(e.target.closest && e.target.closest('.nav-item'))) return;
    down = true; drag = false; sx = e.clientX; pid = e.pointerId;
    rect = nav.getBoundingClientRect();           // read once per gesture, never while moving
    nav.classList.add('lens-press');
  });
  nav.addEventListener('pointermove', e => {
    if (!down || e.pointerId !== pid || !rect) return;
    if (!drag) { if (Math.abs(e.clientX - sx) < 8) return; drag = true; nav.classList.add('lens-drag'); }
    const n = tabs().length || 5, pad = 4, slot = (rect.width - pad * 2) / n;
    const pos = (e.clientX - rect.left - pad) / slot - 0.5;
    setPos(Math.max(-0.16, Math.min(n - 1 + 0.16, pos)));   // a little elastic travel past the end tabs
  });
  nav.addEventListener('pointerup', e => { if (e.pointerId === pid) release(); });
  nav.addEventListener('pointercancel', release);
  document.addEventListener('noor:screen', sync);
  sync();
})();
