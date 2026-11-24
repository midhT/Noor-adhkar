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
  // Collapse the navigation bar into a round button while scrolling with the player open.
  const CKEY = 'naseemNavCollapseV1';
  const cRead = () => { try { return localStorage.getItem(CKEY) === 'off' ? 'off' : 'on'; } catch (_) { return 'on'; } };
  function cApply() {
    const on = cRead() === 'on', t = doc.getElementById('stNavCollapseToggle');
    if (t) { t.setAttribute('aria-pressed', String(on)); t.textContent = on ? 'ON' : 'OFF'; }
    doc.dispatchEvent(new CustomEvent('naseem:navcollapse-changed', { detail: { on } }));
  }
  doc.addEventListener('click', e => { if (e.target.closest('#stNavCollapseToggle')) { try { localStorage.setItem(CKEY, cRead() === 'on' ? 'off' : 'on'); } catch (_) {} cApply(); } });
  // Surah-name artwork in the full player.
  const AKEY = 'naseemArtV1';
  const aRead = () => { try { return localStorage.getItem(AKEY) === 'off' ? 'off' : 'on'; } catch (_) { return 'on'; } };
  function aApply() {
    const on = aRead() === 'on', t = doc.getElementById('stArtToggle');
    if (t) { t.setAttribute('aria-pressed', String(on)); t.textContent = on ? 'ON' : 'OFF'; }
    doc.dispatchEvent(new CustomEvent('naseem:art-changed', { detail: { on } }));
  }
  doc.addEventListener('click', e => { if (e.target.closest('#stArtToggle')) { try { localStorage.setItem(AKEY, aRead() === 'on' ? 'off' : 'on'); } catch (_) {} aApply(); } });
  // Adaptive glass (LastWave-style): sample what is behind the bar and scale blur + scrim to it.
  // Bright/busy content under dark glass (or dark under light glass) gets more blur and a firmer scrim.
  const bd = doc.body;
  const lum = c => { const m = c.match(/[\d.]+/g); if (!m || m.length < 3) return null; const a = m.length > 3 ? +m[3] : 1; if (a < .05) return null; return { l: (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255, a }; };
  function sampleLum(y) {
    let sum = 0, n = 0;
    for (const f of [.12, .3, .5, .7, .88]) {
      const els = doc.elementsFromPoint(innerWidth * f, y);
      let found = null;
      for (const el of els) {
        if (el.closest('.bottom-nav,.qr-player,.topbar,.toast,.qr-full-player')) continue;
        for (let e = el; e && e !== doc.documentElement && !found; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') { found = { l: .5 }; break; }
          const r = lum(cs.backgroundColor); if (r && r.a > .5) found = r;
        }
        if (found) break;
      }
      if (found) { sum += found.l; n++; }
    }
    return n ? sum / n : null;
  }
  let adTimer = 0;
  function adapt() {
    adTimer = 0;
    if (!bd.classList.contains('glass')) { bd.style.removeProperty('--glass-blur'); bd.style.removeProperty('--tint-a'); return; }
    const l = sampleLum(innerHeight - 50); if (l == null) return;
    const light = bd.classList.contains('light');
    const c = Math.max(0, Math.min(1, light ? 1 - l : l));   // how much the backdrop fights the glass
    const mid = 1 - Math.abs(l - .5) * 2;                    // mid-tone busy backdrops are the noisiest
    const k = Math.max(c, mid * .6);
    bd.style.setProperty('--glass-blur', (9 + 9 * k).toFixed(1) + 'px');
    bd.style.setProperty('--tint-a', ((light ? .30 : .26) + .26 * k).toFixed(2));
  }
  const queueAdapt = () => { clearTimeout(adTimer); adTimer = setTimeout(adapt, 260); };   // debounced: never runs while a finger is still scrolling
  addEventListener('scroll', queueAdapt, { passive: true, capture: true });
  doc.addEventListener('naseem:theme-changed', queueAdapt);
  doc.addEventListener('click', () => setTimeout(queueAdapt, 400), true);
  setTimeout(adapt, 1200);
  window.NaseemGlass = { get: () => mode, set, adapt };
  apply(); cApply(); aApply();
})();
