/* Naseem ambient sounds: seamless looping recordings (www/ambient/manifest.json) mixed under the recitation.
   Web Audio is used so loops have no gap and the volume is independent of the recitation. Nothing starts by itself. */
(function () {
  'use strict';
  const core = window.NaseemPlayerCore;
  const KEY = 'naseem-ambient-v1';
  let ctx = null, master = null, sounds = [], loaded = null;
  const nodes = new Map(), listeners = new Set();
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } })();
  const state = { master: typeof saved.master === 'number' ? saved.master : 0.8, vol: saved.vol && typeof saved.vol === 'object' ? saved.vol : {} };

  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const emit = (type, id) => listeners.forEach(fn => { try { fn(type || 'change', id); } catch (_) {} });
  const volumeOf = id => { const s = sounds.find(x => x.id === id); const v = state.vol[id]; return typeof v === 'number' ? v : (s ? s.volume : 0.6); };

  function load() {
    if (loaded) return loaded;
    loaded = (async () => {
      try {
        const res = await fetch('ambient/manifest.json', { cache: 'no-cache' });
        sounds = res.ok ? core.parseAmbientManifest(await res.json()).sounds : [];
      } catch (_) { sounds = []; }
      emit('loaded');
      return sounds;
    })();
    return loaded;
  }
  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = state.master; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  async function bufferFor(s) {
    if (s._buffer) return s._buffer;
    const res = await fetch(s.file); if (!res.ok) throw new Error('Ambient file missing: ' + s.file);
    const data = await res.arrayBuffer();
    s._buffer = await new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject));
    return s._buffer;
  }
  async function start(id) {
    await load(); const s = sounds.find(x => x.id === id); if (!s || nodes.has(id) || !ensureContext()) return nodes.has(id);
    try {
      const buffer = await bufferFor(s); if (nodes.has(id)) return true;
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = buffer; src.loop = true; gain.gain.value = 0; src.connect(gain); gain.connect(master); src.start();
      gain.gain.linearRampToValueAtTime(volumeOf(id), ctx.currentTime + 1.2);
      nodes.set(id, { src, gain }); emit('change', id); return true;
    } catch (_) { emit('error', id); return false; }
  }
  function stop(id, fade = 0.8) {
    const n = nodes.get(id); if (!n) return; nodes.delete(id);
    try { n.gain.gain.cancelScheduledValues(ctx.currentTime); n.gain.gain.setValueAtTime(n.gain.gain.value, ctx.currentTime); n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade); } catch (_) {}
    setTimeout(() => { try { n.src.stop(); } catch (_) {} try { n.src.disconnect(); n.gain.disconnect(); } catch (_) {} }, fade * 1000 + 80);
    emit('change', id);
  }
  const toggle = id => nodes.has(id) ? (stop(id), Promise.resolve(false)) : start(id);
  function setVolume(id, v) {
    const value = Math.min(1, Math.max(0, Number(v) || 0)); state.vol[id] = value; persist();
    const n = nodes.get(id); if (n && ctx) n.gain.gain.setTargetAtTime(value, ctx.currentTime, 0.05);
  }
  function setMaster(v) { state.master = Math.min(1, Math.max(0, Number(v) || 0)); persist(); if (master && ctx) master.gain.setTargetAtTime(state.master, ctx.currentTime, 0.05); }
  function stopAll(fade = 0.8) { [...nodes.keys()].forEach(id => stop(id, fade)); }
  /* Sleep timer: ease everything out, then stop and restore the master level for next time. */
  function fadeOutAll(seconds = 4) {
    if (!ctx || !nodes.size) return Promise.resolve();
    try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + seconds); } catch (_) {}
    return new Promise(resolve => setTimeout(() => { stopAll(0.05); try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(state.master, ctx.currentTime); } catch (_) {} resolve(); }, seconds * 1000 + 60));
  }

  window.NaseemAmbient = {
    load, start, stop, toggle, setVolume, setMaster, stopAll, fadeOutAll,
    list: () => sounds.slice(), activeIds: () => [...nodes.keys()], isActive: id => nodes.has(id),
    volume: volumeOf, masterVolume: () => state.master, contextState: () => (ctx ? ctx.state : 'none'),
    onChange: fn => { listeners.add(fn); return () => listeners.delete(fn); }
  };
})();
