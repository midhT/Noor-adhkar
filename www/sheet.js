/* Noor V3.3 M2.1 — themed bottom-sheet menus.
   Every <select> in the app is kept (so existing code, values and change events work unchanged) but its
   plain Android dropdown is replaced by a Noor-styled button + bottom sheet. Cheap by design: no blur,
   transform/opacity animation only, one shared sheet element. */
(() => {
  'use strict';
  const doc = document;
  let sheet, panel, list, titleEl, scrim, current = null, open = false, lastFocus = null, backPushed = false, popping = false;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const check = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const chev = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';

  function build() {
    if (sheet) return;
    sheet = doc.createElement('div');
    sheet.className = 'nsheet'; sheet.hidden = true;
    sheet.innerHTML = '<div class="nsheet-scrim"></div><div class="nsheet-panel" role="dialog" aria-modal="true" aria-labelledby="nsheetTitle"><div class="nsheet-grab" aria-hidden="true"><span></span></div><div class="nsheet-title" id="nsheetTitle"></div><div class="nsheet-list" role="listbox"></div></div>';
    doc.body.appendChild(sheet);
    panel = sheet.querySelector('.nsheet-panel'); list = sheet.querySelector('.nsheet-list');
    titleEl = sheet.querySelector('.nsheet-title'); scrim = sheet.querySelector('.nsheet-scrim');
    scrim.addEventListener('click', () => close());
    list.addEventListener('click', e => {
      const b = e.target.closest('.nsheet-opt'); if (!b || !current) return;
      const sel = current; const v = b.dataset.v;
      close();
      if (sel.value !== v) { sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      refresh(sel);
    });
    doc.addEventListener('keydown', e => { if (open && e.key === 'Escape') close(); });
    // drag the grab area / title downwards to dismiss
    let y0 = null, dy = 0, t0 = 0;
    const head = [sheet.querySelector('.nsheet-grab'), titleEl];
    head.forEach(h => {
      h.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); panel.style.transition = 'none'; }, { passive: true });
      h.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = `translate3d(0,${dy}px,0)`; }, { passive: true });
      h.addEventListener('touchend', () => {
        if (y0 === null) return; panel.style.transition = ''; panel.style.transform = '';
        const fast = dy / Math.max(1, Date.now() - t0) > 0.6; if (dy > 90 || fast) close(); y0 = null;
      });
    });
    window.addEventListener('popstate', () => { if (open && !popping) { backPushed = false; close(true); } });
    document.addEventListener('naseem:back', e => { if (open) { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
  }

  function labelOf(sel) { const o = sel.options[sel.selectedIndex]; return o ? o.textContent.trim() : ''; }
  function refresh(sel) {
    const t = sel && sel._nTrigger; if (!t) return;
    t.querySelector('.ntrig-text').textContent = labelOf(sel) || 'Choose';
    t.disabled = sel.disabled;
  }
  function sync() { doc.querySelectorAll('select.nsel').forEach(refresh); }

  function openFor(sel, trigger) {
    build(); current = sel; lastFocus = trigger;
    titleEl.textContent = sel.dataset.title || sel.getAttribute('aria-label') || (sel.id && doc.querySelector(`label[for="${sel.id}"]`) ? doc.querySelector(`label[for="${sel.id}"]`).textContent.trim() : 'Choose');
    list.innerHTML = [...sel.options].map(o => `<button type="button" class="nsheet-opt" role="option" data-v="${esc(o.value)}" aria-selected="${o.selected}"${o.disabled ? ' disabled' : ''}><span class="nsheet-lbl">${esc(o.textContent.trim())}</span>${o.dataset.ar ? `<span class="nsheet-ar" lang="ar" dir="rtl">${esc(o.dataset.ar)}</span>` : ''}<span class="nsheet-tick">${o.selected ? check : ''}</span></button>`).join('');
    sheet.hidden = false; open = true;
    panel.style.transform = ''; void panel.offsetWidth; sheet.classList.add('is-open');
    doc.body.classList.add('sheet-open');
    const sel1 = list.querySelector('[aria-selected="true"]');
    if (sel1) sel1.scrollIntoView({ block: 'center' });
    (sel1 || list.firstElementChild)?.focus({ preventScroll: true });
    try { history.pushState({ noorSheet: 1 }, ''); backPushed = true; } catch (_) {}
  }
  function close(fromPop) {
    if (!open) return; open = false;
    sheet.classList.remove('is-open'); doc.body.classList.remove('sheet-open');
    const done = () => { if (!open) sheet.hidden = true; };
    setTimeout(done, 240);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (_) {} }
    if (backPushed && !fromPop) { popping = true; backPushed = false; history.back(); setTimeout(() => { popping = false; }, 60); }
    current = null;
  }

  function enhance(sel) {
    if (sel._nTrigger || sel.dataset.native !== undefined) return;
    sel.classList.add('nsel'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'ntrig ' + (sel.dataset.trigClass || '');
    const lab = sel.getAttribute('aria-label') || (sel.id && doc.querySelector(`label[for="${sel.id}"]`)?.textContent.trim()) || '';
    if (lab) b.setAttribute('aria-label', lab + ': ' + labelOf(sel));
    b.setAttribute('aria-haspopup', 'listbox');
    b.innerHTML = `<span class="ntrig-text"></span><span class="ntrig-chev">${chev}</span>`;
    sel.insertAdjacentElement('afterend', b);
    sel._nTrigger = b;
    b.addEventListener('click', () => openFor(sel, b));
    sel.addEventListener('change', () => refresh(sel));
    refresh(sel);
  }
  let queued = false;
  function scan() { queued = false; doc.querySelectorAll('select:not(.nsel)').forEach(enhance); }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(scan); } };
  new MutationObserver(queue).observe(doc.body, { childList: true, subtree: true });
  scan();
  window.NoorSheet = { sync, refresh, isOpen: () => open, close: () => close() };
})();
