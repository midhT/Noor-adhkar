try { window.NASEEM_FRESH_INSTALL = !localStorage.getItem('noor-adhkar-v1'); } catch (_) { window.NASEEM_FRESH_INSTALL = false; }
(() => {
  const intro = document.getElementById('noorIntro');
  if (!intro) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 450 : 1900;
  const dismiss = () => {
    if (!intro || intro.classList.contains('is-leaving')) return;
    intro.classList.add('is-leaving');
    document.body.classList.remove('intro-pending');
    window.setTimeout(() => intro.remove(), 650);
  };
  window.setTimeout(dismiss, duration);
  // Never leave the app blocked if a browser lifecycle event interrupts the animation.
  window.addEventListener('pageshow', () => window.setTimeout(dismiss, reduced ? 0 : 1500), { once: true });
})();
