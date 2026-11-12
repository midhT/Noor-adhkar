(() => {
  'use strict';
  // Resolve the saved appearance before the first painted frame. The intro always plays.
  try {
    const saved = JSON.parse(localStorage.getItem('noor-adhkar-v1') || '{}');
    const mode = saved.theme || 'system';
    const dark = mode === 'system' ? window.matchMedia?.('(prefers-color-scheme: dark)').matches !== false : mode === 'dark';
    document.body.classList.toggle('light', !dark);
  } catch (_) { /* Keep the default dark launch appearance. */ }

  const intro = document.getElementById('noorIntro');
  if (!intro) { document.body.classList.remove('intro-pending'); return; }
  let dismissed = false;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const duration = reducedMotion ? 700 : 2600;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    intro.classList.add('is-leaving');
    document.body.classList.remove('intro-pending');
    window.setTimeout(() => intro.remove(), 720);
  };
  window.setTimeout(dismiss, duration);
  window.addEventListener('pageshow', () => { if (!dismissed) window.setTimeout(dismiss, 1200); }, { once: true });
})();
