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
  nav.appendChild(lens);   // after the tabs in the DOM (z-index puts it above them), so document-order queries find the real tabs first
  const copy = document.createElement('span'); copy.className = 'lens-copy'; lens.appendChild(copy);
  const tabs = () => [...nav.querySelectorAll(':scope > .nav-item')];
  let drag = false, down = false, sx = 0, pid = null, rect = null;

  let slotPx = 0, items = [], copyItems = [];
  function buildCopy() {
    items = tabs(); copy.textContent = ''; copyItems = items.map(t => {
      const c = t.cloneNode(true); c.removeAttribute('data-screen'); c.removeAttribute('id'); c.tabIndex = -1; c.setAttribute('aria-hidden', 'true'); c.disabled = true; copy.appendChild(c); return c;
    });
  }
  const syncCopy = () => {   // mirror the tab classes (active tab shows its name) without touching the DOM when nothing changed
    if (copyItems.length !== tabs().length) buildCopy();
    items.forEach((t, i) => { if (copyItems[i].className !== t.className) copyItems[i].className = t.className; });
  };
  let lastP = 0, lastT = 0, fv = 0;
  const measure = () => { const n = tabs().length || 5; slotPx = Math.max(0, (nav.clientWidth - 8) / n); nav.style.setProperty('--slot', slotPx.toFixed(2) + 'px'); nav.style.setProperty('--navw', nav.clientWidth + 'px'); write(cur); };
  // One clock moves everything: the lens (translate) and the hole in the blur layer (--lx) are written in the same frame,
  // so the refraction can never trail the capsule. Dragging writes the finger position straight through; settling uses a spring.
  let cur = 0, vel = 0, target = 0, raf = 0, last = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const write = p => {
    const px = p * slotPx, now = performance.now();
    nav.style.setProperty('--lens', p.toFixed(3)); nav.style.setProperty('--lpx', px.toFixed(2) + 'px'); nav.style.setProperty('--lx', (4 + px).toFixed(2) + 'px');
    // speed along the bar (slots per second) stretches the lens a little, like a drop being pulled
    const dt = now - lastT; if (dt > 0 && dt < 120) fv = fv * .6 + ((p - lastP) / dt * 1000) * .4; else fv = 0;
    lastP = p; lastT = now;
    nav.style.setProperty('--fx', Math.min(.12, Math.abs(fv) * .018).toFixed(3));
    // the real icon fades out as the lens reaches it; the magnified copy inside the lens shows in its place
    for (let i = 0; i < items.length; i++) { const d = Math.abs(p - i), o = nav.classList.contains('no-active') ? 1 : Math.max(0, Math.min(1, (d - .28) / .4)); items[i].style.setProperty('--o', o.toFixed(2)); }
  };
  function step(t) {
    const dt = Math.min(0.034, (t - last) / 1000 || 0.016); last = t;
    const K = 480, C = 36;                                  // damping ratio ~0.82: tight, with one soft overshoot (LastWave uses 0.9 / 520)
    vel += (-K * (cur - target) - C * vel) * dt; cur += vel * dt;
    write(cur);
    if (Math.abs(vel) < 0.004 && Math.abs(cur - target) < 0.002) { cur = target; vel = 0; fv = 0; write(cur); nav.style.setProperty('--fx', '0'); raf = 0; return; }
    raf = requestAnimationFrame(step);
  }
  const setPos = (p, instant) => {
    target = p;
    if (instant || reduced() || !nav.isConnected) { cancelAnimationFrame(raf); raf = 0; cur = p; vel = 0; write(p); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  };
  let shown = 0, settle = 0, firstSync = true;
  function sync() {
    const list = tabs();
    nav.style.setProperty('--count', String(list.length || 5));
    if (drag) return;
    const i = list.findIndex(t => t.classList.contains('active'));
    nav.classList.toggle('no-active', i < 0);         // e.g. on Settings, which is not a tab: the lens fades out
    const pos = i < 0 ? shown : i, dist = Math.abs(pos - shown);
    syncCopy();
    shown = pos; setPos(pos, firstSync); firstSync = false;
  }
  function release() {
    down = false; drag = false; pid = null; rect = null;
    nav.classList.remove('lens-press', 'lens-drag');
    sync();
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); sync(); }).observe(nav);
  buildCopy(); measure();
  new MutationObserver(recs => { if (recs.every(r => lens.contains(r.target))) return; sync(); }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });

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
    setPos(Math.max(-0.16, Math.min(n - 1 + 0.16, pos)), true);   // a little elastic travel past the end tabs
  });
  nav.addEventListener('pointerup', e => { if (e.pointerId === pid) release(); });
  nav.addEventListener('pointercancel', release);
  document.addEventListener('noor:screen', sync);
  sync();

  /* ---- Collapse: scrolling down ~28px (on any screen) turns the pill into a round
     button holding the current tab's icon (a visible mini player docks beside it); scrolling back up the same distance,
     reaching the top, changing tab, or tapping the button brings the pill back. ---- */
  const COLLAPSE_KEY = 'naseemNavCollapseV1', THRESHOLD = 28;
  const dock = document.createElement('button');
  dock.type = 'button'; dock.className = 'nav-dock'; dock.setAttribute('aria-label', 'Show navigation');
  nav.parentNode.insertBefore(dock, nav.nextSibling);
  const body = document.body;
  const collapseOn = () => { try { return localStorage.getItem(COLLAPSE_KEY) !== 'off'; } catch (_) { return true; } };
  const playerOn = () => { const p = document.getElementById('quranPlayer'); return !!p && !p.hidden && !p.classList.contains('qr-player-away'); };
  let collapsed = false, travel = 0, animT = 0;
  const lastY = new WeakMap();
  function syncDock() {
    const a = tabs().find(t => t.classList.contains('active')) || tabs()[0]; if (!a) return;
    const ni = a.querySelector('.ni'); if (!ni) return;
    const html = ni.outerHTML;
    if (dock.__html !== html) { dock.__html = html; dock.innerHTML = html; }
    dock.setAttribute('aria-label', 'Show navigation (' + (a.dataset.navLabel || 'menu') + ')');
  }
  /* One spring drives the whole collapse — the same design as LastWave's ChromeCollapse.kt:
     p = 0 (expanded) … 1 (compact), critically damped (stiffness 400, ratio 1: no overshoot), and a new target keeps the
     current velocity, so reversing mid-way never stutters. Every piece reads this single p each frame:
       full bar  : fades over the first half (p/.5) while shrinking to 70 % towards its left edge
       round dock: grows in from .6 → 1 and fades in between p = .3 and .8
       mini player: slides into the dock row and narrows (its left edge and bottom follow p)
       no player : the pill shrinks to 80 % and the selected tab's name fades
     Only transform / opacity (and the player's left/bottom) are written, from one rAF loop. */
  const K = 400, C = 40, clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v, lerp = (a, b, t) => a + (b - a) * t;
  const cc = { p: 0, v: 0, t: 0, raf: 0, last: 0, ends: null };
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function measureEnds() {                       // where the mini player sits expanded vs docked (read once per transition)
    if (!playerOn()) return null;
    const had = body.classList.contains('nav-collapsed'), player = getPlayer();
    player.style.left = player.style.bottom = '';
    body.classList.remove('nav-collapsed'); const e = player.getBoundingClientRect();
    body.classList.add('nav-collapsed');    const c = player.getBoundingClientRect();
    if (!had) body.classList.remove('nav-collapsed');
    const vh = innerHeight;
    return { el: e.left, eb: vh - e.bottom, cl: c.left, cb: vh - c.bottom };
  }
  function paint(p) {
    if (dockMode) {
      const tn = clamp01(p / .5), td = clamp01((p - .3) / .5);
      nav.style.transition = dock.style.transition = 'none'; nav.style.transformOrigin = '0 100%';
      nav.style.opacity = 1 - tn; nav.style.visibility = tn >= 1 ? 'hidden' : 'visible';
      nav.style.pointerEvents = p < .5 ? 'auto' : 'none';
      nav.style.transform = 'translateX(-50%) scale(' + lerp(1, .7, tn) + ')';
      dock.style.opacity = td; dock.style.visibility = p > 0 ? 'visible' : 'hidden';
      dock.style.pointerEvents = p >= .5 ? 'auto' : 'none';
      dock.style.transform = 'scale(' + lerp(.6, 1, td) + ')';
      const g = cc.ends, player = getPlayer();
      if (g && playerOn()) { player.style.left = lerp(g.el, g.cl, p) + 'px'; player.style.bottom = lerp(g.eb, g.cb, p) + 'px'; }
    } else {
      nav.style.transition = 'none'; nav.style.transformOrigin = '50% 100%';   // set inline: the class flips at once on expand, so a CSS origin would jump to the left edge mid-spring
      nav.style.transform = 'translateX(-50%) scale(' + lerp(1, .8, p) + ')';
      nav.style.setProperty('--cp', p.toFixed(3));
    }
  }
  function clearInline() {
    ['transition', 'opacity', 'visibility', 'pointerEvents', 'transform', 'transformOrigin'].forEach(k => { nav.style[k] = ''; dock.style[k] = ''; });
    nav.style.removeProperty('--cp'); const pe = getPlayer(); if (pe) pe.style.left = pe.style.bottom = '';
  }
  function tick(now) {
    const dt = Math.min(.034, (now - cc.last) / 1000 || .016); cc.last = now;
    const n = 3, h = dt / n;
    for (let i = 0; i < n; i++) { cc.v += (K * (cc.t - cc.p) - C * cc.v) * h; cc.p += cc.v * h; }
    if (Math.abs(cc.t - cc.p) < .0006 && Math.abs(cc.v) < .01) {
      cc.p = cc.t; cc.v = 0; cc.raf = 0; clearInline(); body.classList.remove('cc-run'); return;
    }
    paint(clamp01(cc.p)); cc.raf = requestAnimationFrame(tick);
  }
  function spring(to) {
    cc.t = to;
    if (calm()) { cc.p = to; cc.v = 0; cancelAnimationFrame(cc.raf); cc.raf = 0; clearInline(); body.classList.remove('cc-run'); return; }
    body.classList.add('cc-run'); paint(clamp01(cc.p));
    if (!cc.raf) { cc.last = performance.now(); cc.raf = requestAnimationFrame(tick); }
  }
  let dockMode = false;   // true: round button + mini player (a player is on screen); false: the pill just gets smaller
  function setCollapsed(on) {
    on = !!on && collapseOn();
    travel = 0;
    if (on === collapsed) return;
    collapsed = on; syncDock();
    if (on) dockMode = playerOn();
    if (dockMode) { cc.ends = measureEnds(); body.classList.toggle('nav-collapsed', on); }
    else body.classList.toggle('nav-compact', on);
    spring(on ? 1 : 0);
    nav.setAttribute('aria-hidden', String(on && dockMode));
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
    if (body.classList.contains('nav-away')) return;
    if (document.body.classList.contains('qr-full-player-open') || document.body.classList.contains('qr-sheet-open') || document.body.classList.contains('qr-sleep-open')) return;
    if (!collapseOn()) { if (collapsed) setCollapsed(false); return; }
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
  // Settings ("You") and the pages opened from it have their own back controls: the bar slips away there and returns on any other screen
  const AWAY = ['settingsScreen', 'featuresScreen', 'zakatScreen', 'qiblaScreen'];
  const syncAway = id => { body.classList.toggle('nav-away', AWAY.indexOf(id || window.curScreen) >= 0); };
  document.addEventListener('noor:screen', e => syncAway(e.detail)); syncAway();
  document.addEventListener('naseem:navcollapse-changed', () => { if (!collapseOn()) setCollapsed(false); });
  // the Quran stack loads lazily, so the player may not exist yet when this script runs: always look it up on use
  const getPlayer = () => document.getElementById('quranPlayer');
  (function watchPlayer() {
    const el = getPlayer();
    if (!el) { const mo = new MutationObserver(() => { if (getPlayer()) { mo.disconnect(); watchPlayer(); } }); mo.observe(document.body, { childList: true, subtree: true }); return; }
    new MutationObserver(() => { if (collapsed && playerOn() !== dockMode) setCollapsed(false); }).observe(el, { attributes: true, attributeFilter: ['hidden', 'class'] });
  })();
  // a tab change always brings the full bar back
  let lastActive = -1;
  new MutationObserver(() => { syncDock(); const i = tabs().findIndex(t => t.classList.contains('active')); if (i !== lastActive) { if (lastActive !== -1) setCollapsed(false); lastActive = i; } })
    .observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
  syncDock();
  window.NaseemNav = { collapse: setCollapsed, isCollapsed: () => collapsed };
})();
