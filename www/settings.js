/* Noor V3.3 — Settings tab behaviour: theme, background audio, backup / restore / reset. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const VERSION = '3.3.0';
  const APP_KEYS = ['noor-adhkar-v1', 'noor-v3-preferences', 'noorPrayerScheduleV1', 'noorRemindersV1'];
  const SAFETY = 'noorSafetyBackupV1';
  const MAX_BYTES = 5 * 1024 * 1024;
  const SCHEDULE_FIELDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunrise'];
  const note = (msg, bad) => { const n = $('stDataNote'); if (!n) return; n.textContent = msg; n.classList.toggle('st-error', !!bad); };
  const say = msg => { try { toast(msg); } catch (_) {} };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  // ---------- groups ----------
  const groups = [...document.querySelectorAll('.st-group')];
  groups.forEach(g => g.addEventListener('toggle', () => { if (g.open) groups.forEach(o => { if (o !== g) o.open = false; }); }));
  $('stVersion').textContent = `Noor ${VERSION}`;

  // ---------- Salah / Notifications shortcuts ----------
  const goHome = then => { switchScreen('homeScreen'); setTimeout(then, 320); };
  document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.act === 'edit-times') goHome(() => { const e = $('pdEditor'); if (e) { e.open = true; e.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
    if (b.dataset.act === 'reminders') goHome(() => $('rmCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }));
  const syncReminderStatus = () => { const s = $('rmStatus'); if ($('stRemStatus')) $('stRemStatus').textContent = s ? s.textContent : 'Open the Home screen to set up reminders'; };
  syncReminderStatus();
  const rs = $('rmStatus'); if (rs) new MutationObserver(syncReminderStatus).observe(rs, { childList: true, characterData: true, subtree: true });

  // ---------- Theme ----------
  const syncTheme = () => document.querySelectorAll('#stThemeSeg button').forEach(b => b.setAttribute('aria-pressed', String((state.theme === 'light' ? 'light' : 'dark') === b.dataset.theme)));
  document.querySelectorAll('#stThemeSeg button').forEach(b => b.addEventListener('click', () => {
    state.theme = b.dataset.theme; document.body.classList.toggle('light', state.theme === 'light'); save(); syncTheme();
  }));
  $('themeBtn')?.addEventListener('click', () => setTimeout(syncTheme, 0));
  syncTheme();

  // ---------- Background audio ----------
  const audio = $('bgAudio'), tog = $('bgAudioToggle');
  let ownUrl = null;
  const setAudioUi = on => { tog.textContent = on ? 'ON' : 'OFF'; tog.setAttribute('aria-pressed', String(on)); };
  audio.addEventListener('pause', () => setAudioUi(false));
  audio.addEventListener('playing', () => setAudioUi(true));
  tog.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    if (!audio.getAttribute('src')) audio.setAttribute('src', 'audio/night_pad.wav');
    try { await audio.play(); $('bgAudioLabel').textContent = ownUrl ? 'Playing your chosen audio' : 'Soft ambient pad'; }
    catch (_) {
      setAudioUi(false);
      if (!ownUrl) { audio.removeAttribute('src'); $('bgAudioLabel').textContent = 'night_pad.wav is not included in this build.'; say('Background audio file not found'); }
      else say('Audio could not start. Try again.');
    }
  });
  $('bgAudioFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (ownUrl) URL.revokeObjectURL(ownUrl);
    ownUrl = URL.createObjectURL(f); audio.pause(); audio.setAttribute('src', ownUrl);
    $('bgAudioFileLabel').textContent = `Selected: ${f.name}. Plays only until the app is closed.`; $('bgAudioLabel').textContent = 'Your chosen audio';
    e.target.value = '';
  });

  // ---------- Backup ----------
  const snapshot = () => {
    try { save(); } catch (_) {}
    const data = {};
    APP_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) data[k] = v; });
    return { app: 'noor', format: 1, appVersion: VERSION, exportedAt: new Date().toISOString(), data };
  };
  const fail = error => ({ ok: false, error });
  function validate(text) {
    if (typeof text !== 'string' || !text.trim()) return fail('The file is empty.');
    if (text.length > MAX_BYTES) return fail('The file is too large to be a Noor backup.');
    let b; try { b = JSON.parse(text); } catch (_) { return fail('This is not a valid backup file (it could not be read as JSON).'); }
    if (!isObj(b) || b.app !== 'noor') return fail('This file is not a Noor backup.');
    if (b.format !== 1) return fail(b.format > 1 ? 'This backup was made by a newer version of Noor. Update Noor first.' : 'This backup format is not supported.');
    if (!isObj(b.data) || !Object.keys(b.data).length) return fail('The backup contains no data.');
    const parsed = {};
    for (const [k, v] of Object.entries(b.data)) {
      if (!APP_KEYS.includes(k)) return fail(`The backup contains an unexpected entry (${k}).`);
      if (typeof v !== 'string') return fail(`The "${k}" entry is damaged.`);
      try { parsed[k] = JSON.parse(v); } catch (_) { return fail(`The "${k}" entry is damaged.`); }
      if (!isObj(parsed[k])) return fail(`The "${k}" entry is damaged.`);
    }
    const p = parsed['noor-adhkar-v1'];
    if (p) {
      for (const f of ['days', 'counts', 'completed']) if (f in p && !isObj(p[f])) return fail(`Progress data is damaged (${f}).`);
      if ('sessions' in p && !Array.isArray(p.sessions)) return fail('Progress data is damaged (sessions).');
      for (const [d, v] of Object.entries(p.days || {})) if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !isObj(v)) return fail('Progress history contains an invalid day.');
      for (const [n, v] of Object.entries(p.counts || {})) if (!Number.isFinite(v) || v < 0) return fail(`Progress data is damaged (count for ${n}).`);
    }
    const sch = parsed['noorPrayerScheduleV1'];
    if (sch) for (const [k, v] of Object.entries(sch)) if (!SCHEDULE_FIELDS.includes(k) || (v !== '' && !NoorTime.valid(v))) return fail('Saved prayer times are damaged.');
    const rem = parsed['noorRemindersV1'];
    if (rem) {
      if ('offset' in rem && ![0, 5, 10, 15, 30].includes(rem.offset)) return fail('Reminder settings are damaged.');
      if ('on' in rem && !isObj(rem.on)) return fail('Reminder settings are damaged.');
    }
    const sum = {
      days: Object.keys((p && p.days) || {}).length,
      sessions: p && Array.isArray(p.sessions) ? p.sessions.length : 0,
      counts: Object.values((p && p.counts) || {}).reduce((a, n) => a + n, 0),
      times: !!(sch && Object.values(sch).some(Boolean)),
      date: b.exportedAt
    };
    return { ok: true, backup: b, summary: sum };
  }
  const applyData = data => {
    APP_KEYS.forEach(k => { if (k in data) localStorage.setItem(k, data[k]); else localStorage.removeItem(k); });
  };
  const keepSafetyCopy = () => { try { localStorage.setItem(SAFETY, JSON.stringify(snapshot())); return true; } catch (_) { return false; } };
  const afterReload = msg => { try { sessionStorage.setItem('noorFlash', msg); } catch (_) {} location.reload(); };

  async function exportBackup() {
    const snap = snapshot();
    const text = JSON.stringify(snap, null, 2);
    const name = `noor-backup-${new Date().toLocaleDateString('en-CA')}.json`;
    try {
      if (window.NoorNative?.files) await window.NoorNative.files.shareText(name, text, 'Noor backup');
      else {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      note('Backup created. Keep the file somewhere safe, such as cloud storage or email to yourself.');
      say('Backup ready');
    } catch (e) {
      if (e && /cancel/i.test(String(e.message || e))) return;
      note('The backup could not be saved. Please try again.', true); say('Backup failed');
    }
  }
  $('stExport').addEventListener('click', exportBackup);

  $('stRestoreFile').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) { note('That file is too large to be a Noor backup.', true); return; }
    let text; try { text = await f.text(); } catch (_) { note('The file could not be read.', true); return; }
    const r = validate(text);
    if (!r.ok) { note(`Restore cancelled. ${r.error} Your current data was not changed.`, true); say('Not a valid backup'); return; }
    const s = r.summary;
    const when = s.date && !isNaN(new Date(s.date)) ? new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'an unknown date';
    const msg = `Restore the backup from ${when}?\n\nIt contains ${s.days} day${s.days === 1 ? '' : 's'} of history, ${s.sessions} session${s.sessions === 1 ? '' : 's'} and ${s.counts} counts${s.times ? ', plus your saved prayer times' : ''}.\n\nThis replaces what is on this device now. A safety copy of your current data is kept so you can undo.`;
    if (!confirm(msg)) { note('Restore cancelled. Nothing was changed.'); return; }
    if (!keepSafetyCopy()) { note('Restore stopped: there is not enough space to keep a safety copy of your current data.', true); return; }
    try { applyData(r.backup.data); } catch (_) { note('Restore failed while writing. Use Undo to return to your previous data.', true); renderUndo(); return; }
    afterReload('Backup restored');
  });

  function renderUndo() {
    let snap = null; try { snap = JSON.parse(localStorage.getItem(SAFETY) || 'null'); } catch (_) {}
    const row = $('stUndoRow'); if (!row) return;
    row.hidden = !(snap && snap.app === 'noor');
    if (!row.hidden) $('stUndoInfo').textContent = `Returns to the data you had on ${new Date(snap.exportedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}.`;
  }
  $('stUndo').addEventListener('click', () => {
    let snap; try { snap = JSON.parse(localStorage.getItem(SAFETY) || 'null'); } catch (_) {}
    if (!snap || snap.app !== 'noor' || !isObj(snap.data)) { note('There is nothing to undo.', true); renderUndo(); return; }
    if (!confirm('Return to the data you had before the last restore or reset? What is on the device now will be replaced.')) return;
    applyData(snap.data); localStorage.removeItem(SAFETY); afterReload('Previous data restored');
  });

  $('stResetProgress').addEventListener('click', () => {
    if (!confirm('Reset all progress?\n\nThis clears your counts, sessions, streaks and history. Your settings and prayer times stay. A safety copy is kept so you can undo.')) return;
    if (!keepSafetyCopy()) { note('Reset stopped: not enough space to keep a safety copy.', true); return; }
    Object.assign(state, { counts: {}, sessions: [], days: {}, completed: {}, streak: 0, best: 0, count: 0, date: null });
    save(); renderAll(); renderUndo(); note('Progress reset. You can undo this from Data & Backup.'); say('Progress reset');
  });
  $('stEraseAll').addEventListener('click', () => {
    if (!confirm('Erase everything?\n\nThis removes all Noor data from this device: progress, presets, prayer times, reminders and settings.\n\nA safety copy is kept so you can undo. Export a backup first if you want a copy you can keep.')) return;
    if (!confirm('Are you sure? This cannot be undone once Noor is uninstalled.')) return;
    if (!keepSafetyCopy()) { note('Erase stopped: not enough space to keep a safety copy.', true); return; }
    APP_KEYS.forEach(k => localStorage.removeItem(k));
    afterReload('All data erased');
  });
  renderUndo();
  try { const m = sessionStorage.getItem('noorFlash'); if (m) { sessionStorage.removeItem('noorFlash'); setTimeout(() => say(m), 400); } } catch (_) {}
})();
