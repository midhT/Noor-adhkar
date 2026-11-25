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
  // Morph: clip-path (paint only) shrinks/grows the pill to/from the round button; each tab slides toward the button's
  // centre while fading, so the tabs and the shape feel like one object changing form. about half a second, ease-in-out with a long soft landing (a sharp ease-out makes the pill vanish in the first frames).
  // one spring for everything that moves in a collapse (bar shape, tabs, mini player): a damped spring sampled into linear(); older WebViews fall back to the drawer curve
  const SPRING = (window.CSS && CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)')) ? 'linear(0, 0.0172, 0.0619, 0.1249, 0.1993, 0.2794, 0.3611, 0.4412, 0.5176, 0.5888, 0.6538, 0.7124, 0.7642, 0.8095, 0.8486, 0.8819, 0.91, 0.9332, 0.9523, 0.9677, 0.9799, 0.9894, 0.9966, 1.002, 1.0058, 1.0084, 1.01, 1.0109, 1.0111, 1.0109, 1.0104, 1.0097, 1.0089, 1)' : 'cubic-bezier(.32,.72,0,1)';
  let morphAnims = [];
  function runMorph(on, nb, dr) {
    morphAnims.forEach(a => { try { a.cancel(); } catch (_) {} }); morphAnims = [];
    const R = parseFloat(getComputedStyle(nav).borderTopLeftRadius) || nb.height / 2, Rd = dr.height / 2, M = 40;
    const full = 'inset(-' + M + 'px -' + M + 'px -' + M + 'px -' + M + 'px round ' + (R + M) + 'px)';
    const small = 'inset(' + (dr.top - nb.top) + 'px ' + (nb.right - dr.right) + 'px ' + (nb.bottom - dr.bottom) + 'px ' + (dr.left - nb.left) + 'px round ' + Rd + 'px)';
    const ease = SPRING, D = 560, cx = dr.left + dr.width / 2;
    const run = (el, kf, o) => { const a = el.animate(kf, Object.assign({ duration: D, easing: ease }, o)); morphAnims.push(a); return a; };
    const pair = (from, to) => on ? [from, to] : [to, from];
    run(nav, pair({ clipPath: full, opacity: 1, visibility: 'visible' }, { clipPath: small, opacity: 1, visibility: 'visible' }));
    tabs().forEach(t => {
      const r = t.getBoundingClientRect(), act = t.classList.contains('active'), ni = t.querySelector('.ni');
      const ir = (ni || t).getBoundingClientRect(), dx = cx - (ir.left + ir.width / 2), dy = (dr.top + dr.height / 2) - (ir.top + ir.height / 2);
      if (act) {   // the current tab's icon is the shared element: it travels into the round button and stays solid until the button takes over
        const lab = t.querySelector('small'); if (lab) run(lab, pair({ opacity: 1 }, { opacity: 0 }), { duration: Math.round(D * .35), easing: 'linear', fill: on ? 'none' : 'backwards', delay: on ? 0 : Math.round(D * .3) });
        run(ni || t, pair({ translate: '0px 0px', opacity: 1 }, { translate: dx + 'px ' + dy + 'px', opacity: 1 }), { easing: ease });
        run(t, on ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1 }], { easing: 'linear' });
      } else {
        const [f, to] = pair({ translate: '0px 0px', scale: 1, opacity: 1 }, { translate: dx + 'px ' + dy + 'px', scale: .5, opacity: 0 });
        run(t, [f, to], { duration: Math.round(D * .62), easing: on ? 'cubic-bezier(.4,0,.8,.6)' : 'cubic-bezier(.2,.4,.2,1)', delay: on ? 0 : Math.round(D * .22), fill: on ? 'none' : 'backwards' });
      }
    });
    morphAnims[0].finished.then(() => { morphAnims = []; }).catch(() => {});
  }
  let dockMode = false;   // true: round button + mini player (a player is on screen); false: the pill just gets smaller
  function setCollapsed(on) {
    on = !!on && collapseOn();
    travel = 0;
    if (on === collapsed) return;
    collapsed = on; syncDock();
    body.classList.add('nav-anim'); clearTimeout(animT); animT = setTimeout(() => body.classList.remove('nav-anim'), 560);
    if (on) dockMode = playerOn();
    const useDock = on ? dockMode : (body.classList.contains('nav-collapsed'));
    if (!on && !useDock) { body.classList.remove('nav-compact'); finish(false); return; }
    if (on && !dockMode) { body.classList.add('nav-compact'); finish(true); return; }
    // FLIP: the mini player jumps to its new place instantly (layout runs once), then a transform-only animation
    // slides it from where it was. Nothing is re-laid-out per frame, so it stays smooth on weak GPUs.
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, dr = dock.getBoundingClientRect();
    const nb = nav.getBoundingClientRect();
    const morph = !calm && nav.animate && dr.width && nb.width ? { nb, dr } : null;
    const pl = playerOn() ? player : null, from = pl && pl.getBoundingClientRect();
    body.classList.toggle('nav-collapsed', on);
    if (pl && from && pl.animate && !calm) {
      const to = pl.getBoundingClientRect(), dx = from.left - to.left, dy = from.top - to.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) pl.animate([{ translate: dx + 'px ' + dy + 'px' }, { translate: '0px 0px' }], { duration: 560, easing: SPRING });
    }
    if (morph) runMorph(on, morph.nb, morph.dr);
    finish(on);
  }
  function finish(on) {
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
  document.addEventListener('naseem:navcollapse-changed', () => { if (!collapseOn()) setCollapsed(false); });
  const player = document.getElementById('quranPlayer');
  if (player) new MutationObserver(() => { if (collapsed && playerOn() !== dockMode) setCollapsed(false); }).observe(player, { attributes: true, attributeFilter: ['hidden', 'class'] });
  // a tab change always brings the full bar back
  let lastActive = -1;
  new MutationObserver(() => { syncDock(); const i = tabs().findIndex(t => t.classList.contains('active')); if (i !== lastActive) { if (lastActive !== -1) setCollapsed(false); lastActive = i; } })
    .observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
  syncDock();
  window.NaseemNav = { collapse: setCollapsed, isCollapsed: () => collapsed };
})();
