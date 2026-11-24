/* Naseem Liquid Glass refraction map.
   Real refraction on the web = an SVG feDisplacementMap used inside backdrop-filter (Chromium / Android WebView).
   The map is an image whose red/green channels say how far to shift each backdrop pixel. This builds it once, at runtime,
   for a capsule-shaped lens: no shift in the middle, an increasing bend toward the rim, like the edge of a glass pebble. */
(function () {
  'use strict';
  const build = () => {
  try {
    const W = 144, H = 120, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const img = ctx.createImageData(W, H), a = W / 2, b = H / 2, r = b, flat = a - r, band = r * 0.62;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = x + 0.5 - a, py = y + 0.5 - b;
      const cx = Math.max(-flat, Math.min(flat, px)), dx = px - cx, dy = py;
      const dist = Math.hypot(dx, dy), depth = r - dist;           // 0 at the rim, grows toward the centre
      let mx = 0, my = 0;
      if (depth >= 0 && depth < band && dist > 0) {
        const t = 1 - depth / band, m = t * t * t;                  // steep near the rim, calm inside
        mx = -(dx / dist) * m; my = -(dy / dist) * m;               // sample from inside the lens: the rim magnifies what is behind
      }
      const i = (y * W + x) * 4;
      img.data[i] = Math.round(128 + mx * 127); img.data[i + 1] = Math.round(128 + my * 127); img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const url = c.toDataURL('image/png');
    document.querySelectorAll('.naseem-lens-map').forEach(el => { el.setAttribute('href', url); el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url); });
    document.documentElement.classList.add('lens-map-ready');
  } catch (_) { /* no refraction map: the lens simply keeps its plain frosted look */ }
  };
  if (window.requestIdleCallback) requestIdleCallback(build, { timeout: 1500 }); else setTimeout(build, 300);
})();
