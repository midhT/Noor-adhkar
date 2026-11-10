/* Noor V3.3 — Settings tab behaviour: theme, background audio, backup / restore / reset. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const VERSION = '4.0.4';
  const APP_KEYS = ['noor-adhkar-v1', 'noor-v3-preferences', 'noorPrayerScheduleV1', 'noorRemindersV1', 'noorSalahV1', 'noorProfileV1', 'noorAccentV1', 'naseem-v404-settings'];
  const SAFETY = 'noorSafetyBackupV1';
  const MAX_BYTES = 5 * 1024 * 1024;
  const SCHEDULE_FIELDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunrise'];
  const note = (msg, bad) => { const n = $('stDataNote'); if (!n) return; n.textContent = msg; n.classList.toggle('st-error', !!bad); };
  const say = msg => { try { toast(msg); } catch (_) {} };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  // ---------- groups ----------
  const groups = [...document.querySelectorAll('.st-group')];
  groups.forEach(g => g.addEventListener('toggle', () => { if (g.open) groups.forEach(o => { if (o !== g) o.open = false; }); }));
  $('stVersion').textContent = `Naseem ${VERSION}`;

  // ---------- Theme ----------
  const syncTheme = () => document.querySelectorAll('#stThemeSeg button').forEach(b => b.setAttribute('aria-pressed', String((state.theme === 'light' ? 'light' : 'dark') === b.dataset.theme)));
  document.querySelectorAll('#stThemeSeg button').forEach(b => b.addEventListener('click', () => {
    state.theme = b.dataset.theme; document.body.classList.toggle('light', state.theme === 'light'); save(); syncTheme();
  }));
  $('themeBtn')?.addEventListener('click', () => setTimeout(syncTheme, 0));
  syncTheme();

  // ---------- Accent colour ----------
  const accentPalette = $('accentPalette');
  const customAccent = $('accentCustom');
  const syncAccentUi = () => {
    const current = window.NaseemAccent?.get?.() || { preset: 'emerald', color: '#20a875' };
    accentPalette?.querySelectorAll('[data-accent]').forEach(b => {
      const active = b.dataset.accent === current.preset;
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('selected', active);
    });
    if (customAccent) customAccent.value = current.color;
    const label = $('accentCurrentLabel');
    if (label) label.textContent = current.preset === 'custom' ? 'Custom colour' : ({emerald:'Islamic emerald',forest:'Deep forest green',blue:'Royal blue',purple:'Midnight purple',gold:'Muted gold',silver:'Silver / grey'}[current.preset] || 'Islamic emerald');
    const customLabel = document.querySelector('.accent-custom');
    if (customLabel) customLabel.classList.toggle('selected', current.preset === 'custom');
    const preview = $('accentCustomPreview');
    if (preview) preview.style.setProperty('--swatch', current.preset === 'custom' ? current.color : 'conic-gradient(#ed5d5d,#e9c64c,#45bd78,#4a9de8,#a477e8,#ed5d5d)');
  };
  accentPalette?.querySelectorAll('[data-accent]').forEach(b => b.addEventListener('click', () => {
    window.NaseemAccent?.set?.(b.dataset.accent); syncAccentUi(); say('Accent colour updated');
  }));
  customAccent?.addEventListener('input', e => {
    window.NaseemAccent?.set?.('custom', e.target.value); syncAccentUi();
  });
  syncAccentUi();

  // ---------- Background audio: the person chooses what plays ----------
  const audio = $('bgAudio'), tog = $('bgAudioToggle'), fileIn = $('bgAudioFile');
  let ownUrl = null;
  const setAudioUi = on => { tog.textContent = on ? 'ON' : 'OFF'; tog.setAttribute('aria-pressed', String(on)); };
  audio.addEventListener('pause', () => setAudioUi(false));
  audio.addEventListener('playing', () => setAudioUi(true));
  tog.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    if (!ownUrl) { fileIn.click(); return; }            // nothing chosen yet: open the picker
    try { await audio.play(); } catch (_) { say('Audio could not start. Try choosing the file again.'); }
  });
  fileIn.addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (ownUrl) URL.revokeObjectURL(ownUrl);
    ownUrl = URL.createObjectURL(f); audio.pause(); audio.setAttribute('src', ownUrl);
    $('bgAudioFileLabel').textContent = f.name;
    $('bgAudioLabel').textContent = 'Plays until you stop it or close the app.';
    e.target.value = '';
    try { await audio.play(); } catch (_) { say('Tap the switch to start your audio'); }
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
    if (text.length > MAX_BYTES) return fail('The file is too large to be a Naseem backup.');
    let b; try { b = JSON.parse(text); } catch (_) { return fail('This is not a valid backup file (it could not be read as JSON).'); }
    if (!isObj(b) || b.app !== 'noor') return fail('This file is not a Naseem backup.');
    if (b.format !== 1) return fail(b.format > 1 ? 'This backup was made by a newer version of Naseem. Update Naseem first.' : 'This backup format is not supported.');
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
      for (const f of ['days', 'counts', 'completed', 'adhkar']) if (f in p && !isObj(p[f])) return fail(`Progress data is damaged (${f}).`);
      if ('sessions' in p && !Array.isArray(p.sessions)) return fail('Progress data is damaged (sessions).');
      for (const [d, v] of Object.entries(p.days || {})) if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !isObj(v)) return fail('Progress history contains an invalid day.');
      for (const [n, v] of Object.entries(p.counts || {})) if (!Number.isFinite(v) || v < 0) return fail(`Progress data is damaged (count for ${n}).`);
    }
    const sch = parsed['noorPrayerScheduleV1'];
    if (sch) for (const [k, v] of Object.entries(sch)) if (!SCHEDULE_FIELDS.includes(k) || (v !== '' && !NoorTime.valid(v))) return fail('Saved prayer times are damaged.');
    const rem = parsed['noorRemindersV1'];
    if (rem) {
      for (const f of ['pre', 'offset']) if (f in rem && ![0, 5, 10, 15, 30].includes(rem[f])) return fail('Reminder settings are damaged.');
      if ('lead' in rem && ![5, 10, 15, 30].includes(rem.lead)) return fail('Reminder settings are damaged.');
      for (const f of ['on', 'sound', 'jam']) if (f in rem && !isObj(rem[f])) return fail('Reminder settings are damaged.');
      for (const v of Object.values(rem.sound || {})) if (!['adhan', 'tone', 'silent'].includes(v)) return fail('Reminder sounds are damaged.');
    }
    const sal = parsed['noorSalahV1'];
    if (sal) {
      const loc = sal.loc;
      if (loc && (!isObj(loc) || !(Math.abs(loc.lat) <= 90) || !(Math.abs(loc.lng) <= 180) || typeof loc.tz !== 'string' || typeof loc.name !== 'string')) return fail('Saved location is damaged.');
      if (loc) { try { new Intl.DateTimeFormat('en-US', { timeZone: loc.tz }); } catch (_) { return fail('Saved location has an unknown time zone.'); } }
      if ('method' in sal && !['karachi', 'mwl', 'isna', 'egypt', 'makkah'].includes(sal.method)) return fail('Saved calculation method is not recognised.');
      if ('asr' in sal && !['hanafi', 'standard'].includes(sal.asr)) return fail('Saved Asr setting is not recognised.');
      if ('mode' in sal && !['calculated', 'manual'].includes(sal.mode)) return fail('Saved prayer-time mode is not recognised.');
      for (const v of Object.values(sal.adj || {})) if (!Number.isInteger(v) || Math.abs(v) > 60) return fail('Saved prayer adjustments are damaged.');
      for (const j of Object.values(sal.jamaat || {})) if (!isObj(j) || !(j.offset >= 0 && j.offset <= 120) || (j.fixed && !NoorTime.valid(j.fixed))) return fail('Saved Jamaat settings are damaged.');
    }
    const prof = parsed['noorProfileV1'];
    if (prof) {
      if (typeof prof.name !== 'string' || prof.name.length > 60) return fail('Saved profile name is damaged.');
      if (prof.photo && (typeof prof.photo !== 'string' || !prof.photo.startsWith('data:image/') || prof.photo.length > 400000)) return fail('Saved profile picture is damaged.');
    }
    const sum = {
      days: Object.keys((p && p.days) || {}).length,
      sessions: p && Array.isArray(p.sessions) ? p.sessions.length : 0,
      counts: Object.values((p && p.counts) || {}).reduce((a, n) => a + n, 0),
      times: !!((sch && Object.values(sch).some(Boolean)) || parsed['noorSalahV1']),
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
    const name = `naseem-backup-${new Date().toLocaleDateString('en-CA')}.json`;
    try {
      if (window.NoorNative?.files) await window.NoorNative.files.shareText(name, text, 'Naseem backup');
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
    if (f.size > MAX_BYTES) { note('That file is too large to be a Naseem backup.', true); return; }
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
    Object.assign(state, { counts: {}, sessions: [], days: {}, completed: {}, adhkar: {}, streak: 0, best: 0, count: 0, date: null });
    save(); renderAll(); renderUndo(); note('Progress reset. You can undo this from Data & Backup.'); say('Progress reset');
  });
  $('stEraseAll').addEventListener('click', () => {
    if (!confirm('Erase everything?\n\nThis removes all Naseem data from this device: progress, presets, prayer times, reminders and settings.\n\nA safety copy is kept so you can undo. Export a backup first if you want a copy you can keep.')) return;
    if (!confirm('Are you sure? This cannot be undone once Naseem is uninstalled.')) return;
    if (!keepSafetyCopy()) { note('Erase stopped: not enough space to keep a safety copy.', true); return; }
    APP_KEYS.forEach(k => localStorage.removeItem(k));
    afterReload('All data erased');
  });
  renderUndo();
  try { const m = sessionStorage.getItem('noorFlash'); if (m) { sessionStorage.removeItem('noorFlash'); setTimeout(() => say(m), 400); } } catch (_) {}
})();
