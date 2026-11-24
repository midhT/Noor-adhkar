/* Naseem performance helpers: timers that only run while their screen is visible, and lazy script loading. */
(() => {
  'use strict';
  const doc = document;
  const screenActive = id => !id || !!doc.getElementById(id)?.classList.contains('active');
  // every(fn, ms, screenId): runs fn each ms only while the page is visible and (optionally) the screen is showing;
  // runs once immediately when the page or screen comes back, so nothing looks stale.
  function every(fn, ms, screenId) {
    const run = () => { try { fn(); } catch (_) {} };
    setInterval(() => { if (!doc.hidden && screenActive(screenId)) run(); }, ms);
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden && screenActive(screenId)) run(); });
    const el = screenId && doc.getElementById(screenId);
    if (el) {
      let was = el.classList.contains('active');
      new MutationObserver(() => { const now = el.classList.contains('active'); if (now && !was) run(); was = now; }).observe(el, { attributes: true, attributeFilter: ['class'] });
    }
  }
  // Lazy script groups: <script type="text/lazy" data-lazy="quran" src="…"> are fetched + run in order on first need or when idle.
  const loaded = {};
  function load(group) {
    if (loaded[group]) return loaded[group];
    const list = [...doc.querySelectorAll('script[type="text/lazy"][data-lazy="' + group + '"]')];
    loaded[group] = list.reduce((p, old) => p.then(() => new Promise(res => {
      const s = doc.createElement('script'); s.src = old.getAttribute('src'); s.async = false;
      s.onload = s.onerror = () => res(); old.replaceWith(s);
    })), Promise.resolve()).then(() => { doc.dispatchEvent(new CustomEvent('naseem:lazy-loaded', { detail: { group } })); });
    return loaded[group];
  }
  const idle = (fn, ms) => { const go = () => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 50)); addEventListener('load', () => setTimeout(go, ms)); if (doc.readyState === 'complete') setTimeout(go, ms); };
  window.NaseemPerf = { every, load, idle, screenActive };
  // Quran stack: needed only for the Quran tab, so it loads on first tap (or shortly after startup when idle).
  const needQuran = e => { if (e.target.closest && e.target.closest('[data-screen="quranReaderScreen"],[data-open-screen="quranReaderScreen"],[data-open-surah],#quranContinue')) load('quran'); };
  doc.addEventListener('pointerdown', needQuran, true);
  doc.addEventListener('click', needQuran, true);
  idle(() => load('quran'), 900);
})();
