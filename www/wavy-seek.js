/* Naseem wavy seek track.
   Own implementation of the "rolling wave" idea: a straight track, and over the played part three layered sine
   contours that roll while audio plays and flatten while the thumb is being dragged. Canvas 2D, drawn only when
   something changes; the rolling animation runs at ~30 fps, and only while audio is playing, the bar is on screen
   and motion is allowed.
   API: NaseemWave.attach(el) / set(el, fraction) / playing(bool) / dragging(el, bool) */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const FRAME_MS = 33; // every redraw re-runs the glass blur behind it, so keep animated waves at ~30 fps
  const bars = new Set();
  let isPlaying = false, visibleDoc = !document.hidden, raf = 0, last = 0;
  const reduce = () => {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('lite'); }
    catch (_) { return false; }
  };
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * t * (t * (t * 6 - 15) + 10); };
  const alpha = (c, a) => {
    const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return c;
    const p = m[1].split(',').map(s => parseFloat(s)); return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
  };

  function colors(st) {
    const now = performance.now();
    if (st.colorAt && now - st.colorAt < 800) return st.colors;
    const cs = getComputedStyle(st.el);
    const probe = st.probe;
    probe.style.color = cs.getPropertyValue('--accent').trim() || '#3aa57a';
    const accent = getComputedStyle(probe).color;
    probe.style.color = cs.color;
    const text = getComputedStyle(probe).color;
    st.colors = { accent, text }; st.colorAt = now;
    return st.colors;
  }

  function size(st) {
    const r = st.el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (st.canvas.width !== w || st.canvas.height !== h) { st.canvas.width = w; st.canvas.height = h; }
    st.w = r.width; st.h = r.height; st.dpr = dpr;
  }

  /* Flat variant (mini player): a plain 3px progress line, redrawn at most about once a second, because every
     repaint makes the glass blur behind it render again. */
  function drawFlat(st) {
    const { w, h, dpr } = st, ctx = st.ctx, c = colors(st);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const cy = h / 2, f = Math.max(0, Math.min(1, st.f)), x1 = w * f;
    ctx.lineCap = 'round'; ctx.lineWidth = 3;
    ctx.strokeStyle = alpha(c.text, 0.22); ctx.beginPath(); ctx.moveTo(1.5, cy); ctx.lineTo(w - 1.5, cy); ctx.stroke();
    if (x1 > 1) { ctx.strokeStyle = c.accent; ctx.beginPath(); ctx.moveTo(1.5, cy); ctx.lineTo(Math.max(1.5, x1 - 1.5), cy); ctx.stroke(); }
    if (st.drag) { ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(Math.max(5, Math.min(w - 5, x1)), cy, 5, 0, TAU); ctx.fill(); }
  }

  function draw(st, t) {
    if (!st.w || !st.h) size(st);
    if (st.el.dataset.flat) { if (st.w && st.h) drawFlat(st); return; }
    const { w, h, dpr } = st; if (!w || !h) return;
    const ctx = st.ctx, c = colors(st);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const sc = Math.min(1, h / 46);                 // everything scales with the bar's height
    const pad = 8 * sc + 2;
    const x0 = pad, x1 = w - pad, span = Math.max(1, x1 - x0);
    const f = Math.max(0, Math.min(1, st.f));
    const thumbX = x0 + span * f;
    const cy = h - 10 * sc - 3;                     // baseline sits low so the crests have room above it
    const track = Math.max(3, 4.5 * sc);

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = alpha(c.text, 0.24); ctx.lineWidth = track;
    ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();

    if (thumbX - x0 > 0.5) {
      const grad = (a1, a2) => { const g = ctx.createLinearGradient(x0, 0, Math.max(x0 + 1, thumbX), 0); g.addColorStop(0, alpha(c.accent, a1)); g.addColorStop(1, alpha(c.accent, a2)); return g; };
      const trans = Math.min(44 * sc, (thumbX - x0) * 0.48), inv = trans > 0 ? 1 / trans : 0;
      const layers = [
        { wl: 160, amp: 13, per: 2.4, ph: 2.2, lw: 1.0, a1: 0.42, a2: 0.30 },
        { wl: 125, amp: 10, per: 1.8, ph: 1.2, lw: 1.2, a1: 0.72, a2: 0.56 },
        { wl: 95,  amp: 7.5, per: 1.3, ph: 0,  lw: 1.6, a1: 0.98, a2: 0.88 }
      ];
      const step = Math.max(2, 2 * sc);
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - track, 0, thumbX - x0 + track * 2, h); ctx.clip();
      for (const L of layers) {
        const amp = L.amp * sc * st.amp, k = TAU / (L.wl * sc);
        const phase = ((t / L.per) % 1) * TAU + L.ph;
        ctx.beginPath(); ctx.moveTo(x0, cy - track / 2);
        for (let x = 0; x <= thumbX - x0; x += step) {
          const env = inv ? smooth(x * inv) * smooth((thumbX - x0 - x) * inv) : 1;
          ctx.lineTo(x0 + x, cy - track / 2 - (0.5 + 0.5 * Math.sin(x * k - phase)) * amp * env);
        }
        ctx.lineTo(thumbX, cy - track / 2);
        ctx.strokeStyle = grad(L.a1, L.a2); ctx.lineWidth = Math.max(1.2, L.lw * sc * 1.7); ctx.stroke();
      }
      ctx.strokeStyle = grad(1, 0.86); ctx.lineWidth = track;
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(thumbX, cy); ctx.stroke();
      ctx.restore();
    }
    const r = Math.max(5, 7.5 * sc);
    ctx.fillStyle = alpha(c.accent, 0.30); ctx.beginPath(); ctx.arc(thumbX, cy, r + 3.5 * sc, 0, TAU); ctx.fill();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(thumbX, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  function animating(st) {
    if (st.el.dataset.flat) return false;
    return isPlaying && visibleDoc && st.onscreen && !st.drag && !reduce();
  }
  function loop(now) {
    raf = 0;
    if (now - last < FRAME_MS) { raf = requestAnimationFrame(loop); return; }
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    let more = false;
    for (const st of bars) {
      if (!st.onscreen && !st.dirty) continue;
      const target = st.drag ? 0.09 : 1;           // flat while scrubbing so the thumb reads clearly
      if (Math.abs(st.amp - target) > 0.004) { st.amp += (target - st.amp) * Math.min(1, dt * 14); st.dirty = true; more = true; }
      else if (st.amp !== target) { st.amp = target; st.dirty = true; }
      const run = animating(st);
      if (run) { st.clock += dt; st.dirty = true; more = true; }
      if (st.dirty) { st.dirty = false; draw(st, st.clock); }
    }
    if (more) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  function attach(el) {
    if (!el || el.__wave) return el && el.__wave;
    const canvas = document.createElement('canvas'); canvas.className = 'qr-wave-canvas'; canvas.setAttribute('aria-hidden', 'true');
    const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
    el.append(canvas, probe);
    const st = { el, canvas, probe, ctx: canvas.getContext('2d'), f: 0, amp: 1, clock: 0, drag: false, onscreen: true, dirty: true, w: 0, h: 0 };
    el.__wave = st; bars.add(st);
    if ('ResizeObserver' in window) new ResizeObserver(() => { size(st); st.colorAt = 0; st.dirty = true; kick(); }).observe(el);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { st.onscreen = es.some(e => e.isIntersecting); if (st.onscreen) { st.dirty = true; kick(); } }).observe(el);
    kick();
    return st;
  }
  function set(el, f) { const st = el && (el.__wave || attach(el)); if (!st) return; const v = Math.max(0, Math.min(1, Number(f) || 0)); if (v === st.f) return;
    if (st.el.dataset.flat && !st.drag) {            // flat line: move about once a second, jump at once on a seek
      const now = performance.now();
      if (now - (st.flatAt || 0) < 1000 && Math.abs(v - st.f) < 0.02) return;
      st.flatAt = now;
    }
    st.f = v; st.dirty = true; kick(); }
  function dragging(el, on) { const st = el && el.__wave; if (!st) return; st.drag = !!on; st.dirty = true; kick(); }
  function playing(on) { isPlaying = !!on; for (const s of bars) s.dirty = true; kick(); }

  document.addEventListener('visibilitychange', () => { visibleDoc = !document.hidden; kick(); });
  document.addEventListener('naseem:glass-changed', () => { for (const s of bars) { s.colorAt = 0; s.dirty = true; } kick(); });
  document.addEventListener('noor:theme', () => { for (const s of bars) { s.colorAt = 0; s.dirty = true; } kick(); });
  window.NaseemWave = { attach, set, dragging, playing, _bars: bars };
})();
