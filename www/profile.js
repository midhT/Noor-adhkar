/* Noor V3.3 — Account: a name and a profile picture, stored on this device only (no sign-in, no upload). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'noorProfileV1';
  const MAX_PHOTO_CHARS = 300000;
  let profile = { name: '', photo: '' };
  try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); if (v && typeof v === 'object') profile = { name: String(v.name || '').slice(0, 40), photo: typeof v.photo === 'string' && v.photo.startsWith('data:image/') && v.photo.length < MAX_PHOTO_CHARS ? v.photo : '' }; } catch (_) {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(profile)); return true; } catch (_) { return false; } };
  const say = m => { try { toast(m); } catch (_) {} };

  const avatarHtml = () => profile.photo ? `<img alt="" src="${profile.photo}">` : (profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'ن');
  function paint() {
    const first = profile.name.trim().split(/\s+/)[0] || '';
    $('acAvatar').innerHTML = avatarHtml();
    $('stAccountSub').textContent = profile.name.trim() || 'Your name and picture';
    $('acRemovePhoto').hidden = !profile.photo;
    const bm = $('brandMark'); if (bm) { bm.innerHTML = avatarHtml(); bm.classList.toggle('has-photo', !!profile.photo); }
    const hello = document.querySelector('.greeting .muted');
    if (hello) { if (!hello.dataset.orig) hello.dataset.orig = hello.textContent; hello.textContent = first ? `Assalamu alaikum, ${first}. ${hello.dataset.orig}` : hello.dataset.orig; }
  }
  $('acName').value = profile.name;
  $('acName').addEventListener('input', e => { profile.name = e.target.value.slice(0, 40); persist(); paint(); });
  $('acRemovePhoto').addEventListener('click', () => { profile.photo = ''; persist(); paint(); $('acNote').textContent = 'Picture removed.'; });
  $('brandMark').addEventListener('click', () => { switchScreen('settingsScreen'); setTimeout(() => { const g = $('stAccount'); g.open = true; g.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300); });

  // Resize to a 256 px square (centre crop) so the stored picture stays small.
  const toSquare = file => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const size = 256, c = document.createElement('canvas'); c.width = c.height = size;
      const s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) / 2;
      c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
  $('acPhoto').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { $('acNote').textContent = 'Please choose an image file.'; return; }
    try {
      const data = await toSquare(f);
      if (data.length >= MAX_PHOTO_CHARS) throw new Error('large');
      profile.photo = data;
      if (!persist()) { profile.photo = ''; $('acNote').textContent = 'There is not enough space to save the picture.'; return; }
      paint(); $('acNote').textContent = 'Picture saved on this device.'; say('Picture saved');
    } catch (_) { $('acNote').textContent = 'That picture could not be read. Try a different image.'; }
  });
  window.NaseemProfile = { get: () => ({ ...profile }) };
  document.addEventListener('naseem:profile-updated', () => { try { const v=JSON.parse(localStorage.getItem(KEY)||'{}'); profile.name=String(v.name||'').slice(0,40); paint(); } catch (_) {} });
  paint();
})();
