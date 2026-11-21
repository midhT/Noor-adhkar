/* Naseem Liquid Glass: the light has a direction, and it moves a little when you tilt the phone.
   Reads the device orientation (no permission needed in the Android WebView) and turns it into one CSS variable,
   --rim-angle, which rotates the specular rim on the floating glass. Updates are throttled and small, and the whole
   thing is off when glass is off, in Smooth mode, with reduced motion, or without a motion sensor. */
(function () {
  'use strict';
  const BASE = -38, MAX = 26;
  let on = false, last = BASE, raf = 0, nextAt = 0, g = 0, b = 0;
  const root = document.documentElement;
  const allowed = () => document.body.classList.contains('glass') && !document.body.classList.contains('lite') &&
    !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function apply() {
    raf = 0;
    const target = BASE + Math.max(-MAX, Math.min(MAX, g * 0.7 + (b - 40) * 0.25));
    if (Math.abs(target - last) < 2.5) return;
    last += (target - last) * 0.6;
    root.style.setProperty('--rim-angle', last.toFixed(1) + 'deg');
  }
  function onTilt(e) {
    if (e.gamma == null) return;
    g = e.gamma; b = e.beta || 0;
    const now = performance.now();
    if (!raf && now >= nextAt) { nextAt = now + 80; raf = requestAnimationFrame(apply); }
  }
  function sync() {
    const want = allowed();
    if (want && !on) { window.addEventListener('deviceorientation', onTilt, { passive: true }); on = true; }
    else if (!want && on) { window.removeEventListener('deviceorientation', onTilt); on = false; root.style.removeProperty('--rim-angle'); last = BASE; }
  }
  document.addEventListener('naseem:glass-changed', sync);
  document.addEventListener('DOMContentLoaded', sync);
  new MutationObserver(sync).observe(document.body || root, { attributes: true, attributeFilter: ['class'] });
  window.NaseemGlassLight = { _tilt: onTilt, _apply: apply };
  sync();
})();
