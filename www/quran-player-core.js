/* Naseem Quran player core: pure, dependency-free logic shared by the player UI and the node tests.
   Sleep timer, repeat modes, seek-bar wave geometry and the ambient-sound manifest rules live here. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NaseemPlayerCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SLEEP_OPTIONS = [
    { id: 'off', label: 'Off' },
    { id: '5', label: '5 minutes', minutes: 5 },
    { id: '10', label: '10 minutes', minutes: 10 },
    { id: '15', label: '15 minutes', minutes: 15 },
    { id: '30', label: '30 minutes', minutes: 30 },
    { id: '45', label: '45 minutes', minutes: 45 },
    { id: '60', label: '1 hour', minutes: 60 },
    { id: 'ayah', label: 'End of this ayah' },
    { id: 'surah', label: 'End of this surah' }
  ];

  function sleepStart(id, nowMs) {
    const option = SLEEP_OPTIONS.find(o => o.id === String(id));
    if (!option || option.id === 'off') return null;
    if (option.minutes) return { id: option.id, kind: 'time', endsAt: Number(nowMs) + option.minutes * 60000 };
    return { id: option.id, kind: option.id };
  }
  function sleepRemainingMs(state, nowMs) {
    return state && state.kind === 'time' ? Math.max(0, state.endsAt - Number(nowMs)) : null;
  }
  function formatClock(ms) {
    const total = Math.max(0, Math.ceil(Number(ms) / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }
  function sleepLabel(state, nowMs) {
    if (!state) return 'Sleep';
    if (state.kind === 'time') return formatClock(sleepRemainingMs(state, nowMs));
    return state.kind === 'ayah' ? 'Ayah end' : 'Surah end';
  }
  /* evt: 'tick' | 'ayah-end' | 'surah-end'. A timer fires only for its own kind of event. */
  function sleepShouldFire(state, evt, nowMs) {
    if (!state) return false;
    if (state.kind === 'time') return evt === 'tick' && Number(nowMs) >= state.endsAt;
    if (state.kind === 'ayah') return evt === 'ayah-end';
    if (state.kind === 'surah') return evt === 'surah-end';
    return false;
  }

  const REPEAT_MODES = ['off', 'ayah', 'surah'];
  function nextRepeat(mode) {
    const i = REPEAT_MODES.indexOf(mode);
    return REPEAT_MODES[(i + 1) % REPEAT_MODES.length];
  }
  function repeatLabel(mode) { return mode === 'ayah' ? 'Repeat ayah' : mode === 'surah' ? 'Repeat surah' : 'Repeat'; }
  /* What to do when an ayah finishes. playMode: 'surah' (queue) or 'single' (one ayah). */
  function afterAyahEnd(o) {
    if (o.repeat === 'ayah') return 'replay';
    if (o.playMode === 'single') return 'finish';
    if (o.index < o.length - 1) return 'next';
    return o.repeat === 'surah' ? 'restart' : 'nextSurah';
  }

  function remainingText(duration, current) {
    if (!Number.isFinite(duration) || duration <= 0) return '-0:00';
    return '-' + formatClock(Math.max(0, duration - current) * 1000);
  }

  /* Seek bar: the played part is a gentle sine wave. Returns an SVG path for a viewBox of width x height. */
  function wavePath(width, height, amplitude, wavelength) {
    const mid = height / 2, pts = [];
    for (let x = 0; x <= width; x += 2) pts.push(`${x === 0 ? 'M' : 'L'}${x} ${(mid + amplitude * Math.sin((2 * Math.PI * x) / wavelength)).toFixed(2)}`);
    return pts.join(' ');
  }

  /* Ambient sounds are recordings shipped in www/ambient/. Only well-formed entries are accepted. */
  const AMBIENT_ICONS = ['rain', 'birds', 'wind', 'ocean', 'fire', 'night', 'forest', 'stream'];
  function parseAmbientManifest(json) {
    const out = [];
    const list = json && Array.isArray(json.sounds) ? json.sounds : [];
    for (const s of list) {
      if (!s || typeof s !== 'object') continue;
      const id = String(s.id || ''), name = String(s.name || ''), file = String(s.file || '');
      if (!/^[a-z0-9-]{1,32}$/.test(id) || !name || name.length > 40) continue;
      if (!/^[A-Za-z0-9_\-./]+\.(mp3|ogg|m4a|wav)$/i.test(file) || file.includes('..') || file.startsWith('/')) continue;
      const volume = Math.min(1, Math.max(0, Number.isFinite(Number(s.volume)) ? Number(s.volume) : 0.6));
      out.push({ id, name, file: file.startsWith('ambient/') ? file : 'ambient/' + file, volume, icon: AMBIENT_ICONS.includes(s.icon) ? s.icon : 'night', credit: typeof s.credit === 'string' ? s.credit.slice(0, 160) : '' });
    }
    return { sounds: out.filter((s, i) => out.findIndex(x => x.id === s.id) === i) };
  }

  return { SLEEP_OPTIONS, sleepStart, sleepRemainingMs, sleepLabel, sleepShouldFire, formatClock, REPEAT_MODES, nextRepeat, repeatLabel, afterAyahEnd, remainingText, wavePath, parseAmbientManifest, AMBIENT_ICONS };
});
