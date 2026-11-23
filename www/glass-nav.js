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
    nav.classList.toggle('no-active', i < 0);         // e.g. on Settings, which is not a tab: the lens fades out
    const pos = i < 0 ? shown : i, dist = Math.abs(pos - shown);
    if (dist > 0.4 && !down) {                       // the lens stretches along its travel, then settles with the spring
      nav.style.setProperty('--stretch', (1 + Math.min(0.22, dist * 0.06)).toFixed(3));
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
    if (!document.body.classList.contains('glass')) return;   // the lens (and dragging it) exists only with Liquid Glass
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

  /* ---- Collapse: only while a recitation player is on screen. Scrolling down ~28px turns the pill into a round
     button holding the current tab's icon (the mini player docks beside it); scrolling back up the same distance,
     reaching the top, changing tab, or tapping the button brings the pill back. ---- */
  const COLLAPSE_KEY = 'naseemNavCollapseV1', THRESHOLD = 28;
  const dock = document.createElement('button');
  dock.type = 'button'; dock.className = 'nav-dock'; dock.setAttribute('aria-label', 'Show navigation');
  nav.parentNode.insertBefore(dock, nav.nextSibling);
  const body = document.body;
  const collapseOn = () => { try { return localStorage.getItem(COLLAPSE_KEY) !== 'off'; } catch (_) { return true; } };
  const playerOn = () => { const p = document.getElementById('quranPlayer'); return !!p && !p.hidden && !p.classList.contains('qr-player-away'); };
  let collapsed = false, travel = 0;
  const lastY = new WeakMap();
  function syncDock() {
    const a = nav.querySelector('.nav-item.active') || tabs()[0]; if (!a) return;
    const ni = a.querySelector('.ni'); if (!ni) return;
    const html = ni.outerHTML;
    if (dock.__html !== html) { dock.__html = html; dock.innerHTML = html; }
    dock.setAttribute('aria-label', 'Show navigation (' + (a.dataset.navLabel || 'menu') + ')');
  }
  function setCollapsed(on) {
    on = !!on && collapseOn() && playerOn();
    travel = 0;
    if (on === collapsed) return;
    collapsed = on; syncDock();
    body.classList.toggle('nav-collapsed', on);
    nav.setAttribute('aria-hidden', String(on));
    document.dispatchEvent(new CustomEvent('naseem:nav-collapsed', { detail: { collapsed: on } }));
  }
  // Only the user's own scrolling counts. The reader also scrolls by itself to follow the recited ayah, and that
  // must never fold the bar. A finger drag (and its fling afterwards) or the wheel marks the scroll as user-driven.
  let userUntil = 0, fingerDown = false, t0y = 0, t0x = 0, moved = false;
  const SLOP = 14;                                   // a tap that jitters a few px is not a scroll
  document.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) { t0y = t.clientY; t0x = t.clientX; } moved = false; fingerDown = false; }, { passive: true, capture: true });
  document.addEventListener('touchmove', e => {
    const t = e.touches[0]; if (!t) return;
    if (!moved && Math.abs(t.clientY - t0y) > SLOP && Math.abs(t.clientY - t0y) >= Math.abs(t.clientX - t0x)) moved = true;
    if (moved) { fingerDown = true; userUntil = Infinity; }
  }, { passive: true, capture: true });
  const released = () => { if (moved) userUntil = performance.now() + 1200; fingerDown = false; moved = false; };
  document.addEventListener('touchend', released, { passive: true, capture: true });
  document.addEventListener('touchcancel', released, { passive: true, capture: true });
  document.addEventListener('wheel', () => { userUntil = performance.now() + 450; }, { passive: true, capture: true });
  document.addEventListener('keydown', e => { if (/^(PageDown|PageUp|ArrowDown|ArrowUp|Home|End| )$/.test(e.key)) userUntil = performance.now() + 450; }, true);
  function onScroll(e) {
    if (!(fingerDown || performance.now() < userUntil)) return;
    if (document.body.classList.contains('qr-full-player-open') || document.body.classList.contains('qr-sheet-open') || document.body.classList.contains('qr-sleep-open')) return;
    if (!collapseOn() || !playerOn()) { if (collapsed) setCollapsed(false); return; }
    const t = e.target, el = (t === document || t === document.documentElement || t === document.body) ? (document.scrollingElement || document.documentElement) : t;
    if (!el || el.nodeType !== 1) return;
    const y = el.scrollTop, prev = lastY.has(el) ? lastY.get(el) : y; lastY.set(el, y);
    if (y <= 2) { setCollapsed(false); return; }          // at the top: always the full bar
    const d = y - prev; if (!d) return;
    if (travel * d < 0) travel = 0;                        // direction change restarts the count
    travel += d;
    if (Math.abs(travel) >= THRESHOLD) setCollapsed(travel > 0);
  }
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  dock.addEventListener('click', () => setCollapsed(false));
  document.addEventListener('noor:screen', () => setCollapsed(false));
  document.addEventListener('naseem:navcollapse-changed', () => { if (!collapseOn()) setCollapsed(false); });
  const player = document.getElementById('quranPlayer');
  if (player) new MutationObserver(() => { if (!playerOn()) setCollapsed(false); }).observe(player, { attributes: true, attributeFilter: ['hidden', 'class'] });
  // a tab change always brings the full bar back
  let lastActive = -1;
  new MutationObserver(() => { syncDock(); const i = tabs().findIndex(t => t.classList.contains('active')); if (i !== lastActive) { if (lastActive !== -1) setCollapsed(false); lastActive = i; } })
    .observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
  syncDock();
  window.NaseemNav = { collapse: setCollapsed, isCollapsed: () => collapsed };
})();
