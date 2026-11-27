/* Noor V3.3 — Settings tab behaviour: theme, background audio, backup / restore / reset. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const VERSION = '4.1.0';
  const APP_KEYS = ['noor-adhkar-v1', 'noor-v3-preferences', 'noorPrayerScheduleV1', 'noorRemindersV1', 'noorSalahV1', 'noorProfileV1', 'noorAccentV1', 'naseem-v404-settings', 'naseemCycleTrackerV1'];
  const SAFETY = 'noorSafetyBackupV1';
  const MAX_BYTES = 5 * 1024 * 1024;
  const SCHEDULE_FIELDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunrise'];
  const note = (msg, bad) => { const n = $('stDataNote'); if (!n) return; n.textContent = msg; n.classList.toggle('st-error', !!bad); };
  const say = msg => { try { toast(msg); } catch (_) {} };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  // ---------- groups ----------
  const groups = [...document.querySelectorAll('.st-group')];
  // Each group is a sub-page: opening slides a full-screen page in, back slides it out.
  const reduce = () => document.body.classList.contains('lite') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holders = new Map();
  const closeGroup = g => {
    if (!g.open || g.classList.contains('st-closing')) return;
    const done = () => { g.classList.remove('st-closing'); g.open = false; document.body.classList.remove('st-page-open'); holders.get(g)?.remove(); holders.delete(g); };
    if (reduce()) return done();
    g.classList.add('st-closing');
    let fin = false; const once = () => { if (fin) return; fin = true; done(); };
    g.addEventListener('animationend', once, { once: true }); setTimeout(once, 380);
  };
  groups.forEach(g => {
    g.addEventListener('toggle', () => {
      if (g.open) {
        groups.forEach(o => { if (o !== g && o.open) { o.classList.remove('st-closing'); o.open = false; holders.get(o)?.remove(); holders.delete(o); } });
        if (!holders.has(g)) { const h = document.createElement('div'); h.className = 'st-holder'; h.style.height = '74px'; g.before(h); holders.set(g, h); }
        document.body.classList.add('st-page-open');
        g.scrollTop = 0;
      }
    });
    g.querySelector(':scope > summary')?.addEventListener('click', e => { if (g.open) { e.preventDefault(); closeGroup(g); } });
  });
  // The back press closes whichever sub-page is open (looked up live, not from a list captured at startup).
  document.addEventListener('naseem:back', e => {
    const g = groups.find(x => x.open && !x.classList.contains('st-closing')) || groups.find(x => x.open);
    if (g) { e.preventDefault(); e.stopImmediatePropagation(); closeGroup(g); }
  }, true);
  // Leaving Settings by ANY route (tab bar, Home, a deep link, the theme button…) must drop the open sub-page at once: otherwise its
  // fixed overlay and the hidden header ('st-page-open') would stay behind on the next screen. 'noor:screen' is what switchScreen fires.
  const resetPages = () => { groups.forEach(g => { if (g.open || g.classList.contains('st-closing')) { g.classList.remove('st-closing'); g.open = false; } holders.get(g)?.remove(); holders.delete(g); }); document.body.classList.remove('st-page-open'); };
  document.addEventListener('noor:screen', e => { if (e.detail !== 'settingsScreen') resetPages(); });
  // Safety net: the app returning from the background (permission prompts, other apps) re-checks that the flag matches reality.
  const reconcile = () => { const any = groups.some(g => g.open); if (!any) resetPages(); else if (!document.getElementById('settingsScreen')?.classList.contains('active')) resetPages(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) reconcile(); });
  addEventListener('pageshow', reconcile);
  $('stVersion').textContent = `Naseem ${VERSION}`;

  // ---------- Theme ----------
  const syncTheme = () => document.querySelectorAll('#stThemeSeg button').forEach(b => b.setAttribute('aria-pressed', String((window.NaseemTheme?.get?.() || state.theme || 'system') === b.dataset.theme)));
  document.querySelectorAll('#stThemeSeg button').forEach(b => b.addEventListener('click', () => {
    if (window.NaseemTheme?.set) window.NaseemTheme.set(b.dataset.theme);
    else { state.theme=b.dataset.theme; document.body.classList.toggle('light', state.theme==='light'); save(); }
    syncTheme();
  }));
  document.addEventListener('naseem:theme-changed', syncTheme);
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
    if (sch) for (const [k, v] of Object.entries(sch)) if (!SCHEDULE_FIELDS.includes(k) || (v !== '' && !window.NoorTime.valid(v))) return fail('Saved prayer times are damaged.');
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
      for (const j of Object.values(sal.jamaat || {})) if (!isObj(j) || !(j.offset >= 0 && j.offset <= 120) || (j.fixed && !window.NoorTime.valid(j.fixed))) return fail('Saved Jamaat settings are damaged.');
    }
    const prof = parsed['noorProfileV1'];
    if (prof) {
      if (typeof prof.name !== 'string' || prof.name.length > 60) return fail('Saved profile name is damaged.');
      if (prof.photo && (typeof prof.photo !== 'string' || !prof.photo.startsWith('data:image/') || prof.photo.length > 400000)) return fail('Saved profile picture is damaged.');
    }
    const cycle = parsed['naseemCycleTrackerV1'];
    if (cycle) {
      if (!Array.isArray(cycle.starts) || cycle.starts.length > 500 || !Number.isInteger(cycle.cycleLength) || cycle.cycleLength < 21 || cycle.cycleLength > 45 || !Number.isInteger(cycle.periodLength) || cycle.periodLength < 2 || cycle.periodLength > 10) return fail('Cycle tracker data is damaged.');
      if (cycle.starts.some(d => { if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return true; const date = new Date(`${d}T00:00:00Z`); return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== d; })) return fail('Cycle tracker dates are damaged.');
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

  // ---------- Optional, on-device menstrual cycle tracker ----------
  const CYCLE_KEY = 'naseemCycleTrackerV1';
  const cyclePanel = $('stCycle');
  const cycleDate = $('cycleStartDate');
  const cycleLength = $('cycleLength');
  const cyclePeriodLength = $('cyclePeriodLength');
  const cycleSummary = $('cycleSummary');
  const cycleHistory = $('cycleHistory');
  const localDateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parseCycleDate = value => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || ''); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3])); return d.getUTCFullYear()===+m[1] && d.getUTCMonth()===+m[2]-1 && d.getUTCDate()===+m[3] ? d : null; };
  const readCycle = () => { try { const v=JSON.parse(localStorage.getItem(CYCLE_KEY)||'null'); if(v&&Array.isArray(v.starts)) return {starts:[...new Set(v.starts.filter(x=>parseCycleDate(x)))].sort(),cycleLength:Number.isInteger(v.cycleLength)&&v.cycleLength>=21&&v.cycleLength<=45?v.cycleLength:28,periodLength:Number.isInteger(v.periodLength)&&v.periodLength>=2&&v.periodLength<=10?v.periodLength:5}; } catch (_) {} return {starts:[],cycleLength:28,periodLength:5}; };
  let cycleData = readCycle();
  const saveCycle = () => { try { localStorage.setItem(CYCLE_KEY,JSON.stringify(cycleData)); } catch (_) { say('Could not save cycle data on this device.'); } };
  const cycleDisplayDate = key => parseCycleDate(key)?.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) || key;
  const cycleEstimate = () => { if(!cycleData.starts.length) return null; const starts=cycleData.starts.map(parseCycleDate); let length=cycleData.cycleLength; if(starts.length>=2){const gaps=[];for(let i=Math.max(1,starts.length-6);i<starts.length;i++)gaps.push((starts[i]-starts[i-1])/86400000);const plausible=gaps.filter(n=>n>=15&&n<=60);if(plausible.length)length=Math.round(plausible.reduce((a,b)=>a+b,0)/plausible.length);} const next=new Date(starts[starts.length-1]);next.setUTCDate(next.getUTCDate()+length);return {date:next.toISOString().slice(0,10),length}; };
  function renderCycle() {
    if(!cyclePanel)return;
    let gender='unspecified';try{gender=JSON.parse(localStorage.getItem('noorProfileV1')||'{}').gender||'unspecified';}catch(_){}
    cyclePanel.hidden=gender!=='female';
    if(gender!=='female')return;
    cycleLength.value=String(cycleData.cycleLength);cyclePeriodLength.value=String(cycleData.periodLength);
    const estimate=cycleEstimate();
    if(!cycleData.starts.length){cycleSummary.innerHTML='<strong>No cycle dates recorded yet</strong><p>Add the first day of your most recent period to begin.</p>';}
    else {const today=new Date();today.setHours(0,0,0,0);const target=parseCycleDate(estimate.date);const days=Math.round((target-new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())))/86400000);const estimateText=days===0?'Estimated around today':days>0?`Estimated in about ${days} day${days===1?'':'s'}`:`Estimated date was ${Math.abs(days)} day${Math.abs(days)===1?'':'s'} ago`;cycleSummary.innerHTML=`<div class="cycle-summary-grid"><span><small>Cycles recorded</small><b>${cycleData.starts.length}</b></span><span><small>Typical interval</small><b>${estimate.length} days</b></span></div><strong>Last period started · ${cycleDisplayDate(cycleData.starts[cycleData.starts.length-1])}</strong><p>Next period estimated · ${cycleDisplayDate(estimate.date)}. ${estimateText}. This is an estimate based on the dates saved. Typical bleeding duration saved: ${cycleData.periodLength} days.</p>`;}
    cycleHistory.innerHTML=cycleData.starts.length?`<strong>Recorded period starts</strong><ul>${cycleData.starts.slice().reverse().slice(0,8).map(d=>`<li>${cycleDisplayDate(d)}</li>`).join('')}</ul>`:'';
    const todayKey=localDateKey(new Date());cycleDate.max=todayKey;if(!cycleDate.value)cycleDate.value=cycleData.starts[cycleData.starts.length-1]||todayKey;
  }
  $('cycleSaveStart')?.addEventListener('click',()=>{const d=parseCycleDate(cycleDate.value),today=parseCycleDate(localDateKey(new Date()));const cl=Number(cycleLength.value),pl=Number(cyclePeriodLength.value);if(!d||d>today){say('Choose a valid period start date, not a future date.');return;}if(!Number.isInteger(cl)||cl<21||cl>45){say('Cycle length must be between 21 and 45 days.');return;}if(!Number.isInteger(pl)||pl<2||pl>10){say('Period duration must be between 2 and 10 days.');return;}cycleData.cycleLength=cl;cycleData.periodLength=pl;cycleData.starts=[...new Set([...cycleData.starts,cycleDate.value])].sort().slice(-500);saveCycle();cycleDate.value='';renderCycle();say('Period start saved privately on this device.');});
  $('cycleClearData')?.addEventListener('click',()=>{if(!confirm('Clear all saved cycle dates and cycle settings from this device?'))return;cycleData={starts:[],cycleLength:28,periodLength:5};localStorage.removeItem(CYCLE_KEY);cycleDate.value='';renderCycle();say('Cycle data cleared.');});
  document.addEventListener('naseem:profile-updated',renderCycle);
  renderCycle();

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
    localStorage.removeItem('naseem-onboarding-complete-v1');
    afterReload('All data erased');
  });
  renderUndo();
  try { const m = sessionStorage.getItem('noorFlash'); if (m) { sessionStorage.removeItem('noorFlash'); setTimeout(() => say(m), 400); } } catch (_) {}
})();

/* Quick View margins: Suhoor ends N minutes before Fajr, Iftar N minutes after Maghrib */
(function () {
  [['stSuhoorMargin', 'naseem-suhoor-margin'], ['stIftarMargin', 'naseem-iftar-margin']].forEach(function (pair) {
    var el = document.getElementById(pair[0]); if (!el) return;
    try { var v = parseInt(localStorage.getItem(pair[1]), 10); if (v >= 0 && v <= 60) el.value = String(v); } catch (_) {}
    el.addEventListener('change', function () { try { localStorage.setItem(pair[1], el.value); } catch (_) {} window.dispatchEvent(new Event('noor:schedule')); });
  });
})();
