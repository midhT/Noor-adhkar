/* Pure Quran memorisation scheduling and small text helpers (no DOM, no storage).
   Unit-tested in tests/test_quran_memory.js.
   A "deck" is { "<surah>:<ayah>": item }. Items are spaced-repetition (Leitner style): each successful
   recall moves an ayah to the next box and lengthens the gap before it is due again; a failed recall
   returns it to box 0 and it is due again the next day. Dates are local YYYY-MM-DD strings. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NaseemQuranMemory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Days until the next review after reaching box N (index = box). Box 0 = new / forgotten.
  const BOX_DAYS = [0, 1, 3, 7, 14, 30, 60];
  const MAX_BOX = BOX_DAYS.length - 1;
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  function localISO(date) {
    const d = date instanceof Date ? date : new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
  function dayNum(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86400000);
  }
  function addDays(iso, n) {
    const t = new Date((dayNum(iso) + n) * 86400000);
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
  }
  const keyOf = (surah, ayah) => `${Number(surah)}:${Number(ayah)}`;
  const valid = (surah, ayah) => Number.isInteger(Number(surah)) && Number(surah) >= 1 && Number(surah) <= 114 && Number.isInteger(Number(ayah)) && Number(ayah) >= 1 && Number(ayah) <= 286;

  function add(deck, surah, ayah, today) {
    if (!valid(surah, ayah)) return deck;
    const k = keyOf(surah, ayah);
    if (deck[k]) return deck;
    deck[k] = { s: Number(surah), a: Number(ayah), box: 0, due: today, added: today, last: null, reps: 0, lapses: 0 };
    return deck;
  }
  function addMany(deck, surah, count, today) {
    for (let a = 1; a <= Number(count); a++) add(deck, surah, a, today);
    return deck;
  }
  function remove(deck, surah, ayah) { delete deck[keyOf(surah, ayah)]; return deck; }
  function removeSurah(deck, surah) {
    for (const k of Object.keys(deck)) if (deck[k].s === Number(surah)) delete deck[k];
    return deck;
  }
  const has = (deck, surah, ayah) => Object.prototype.hasOwnProperty.call(deck, keyOf(surah, ayah));

  // Record a recall attempt. Returns the updated item (the deck is mutated).
  function review(deck, surah, ayah, remembered, today) {
    const item = deck[keyOf(surah, ayah)];
    if (!item) return null;
    item.reps += 1;
    item.last = today;
    if (remembered) {
      item.box = Math.min(item.box + 1, MAX_BOX);
      item.due = addDays(today, BOX_DAYS[item.box]);
    } else {
      item.lapses += 1;
      item.box = 0;
      item.due = addDays(today, 1);
    }
    return item;
  }
  const isDue = (item, today) => ISO.test(item.due) && dayNum(item.due) <= dayNum(today);
  // Due items ordered by surah then ayah, so a review follows the Qur'an's own order.
  function dueItems(deck, today) {
    return Object.values(deck).filter(i => isDue(i, today)).sort((x, y) => x.s - y.s || x.a - y.a);
  }
  function stats(deck, today) {
    const items = Object.values(deck);
    const surahs = {};
    for (const i of items) {
      const s = surahs[i.s] || (surahs[i.s] = { surah: i.s, total: 0, due: 0, strong: 0 });
      s.total++; if (isDue(i, today)) s.due++; if (i.box >= 3) s.strong++;
    }
    return {
      total: items.length,
      due: items.filter(i => isDue(i, today)).length,
      strong: items.filter(i => i.box >= 3).length,
      surahs: Object.values(surahs).sort((a, b) => a.surah - b.surah)
    };
  }
  // Drop anything malformed read back from storage.
  function sanitize(raw, today) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== 'object' || !valid(v.s, v.a) || k !== keyOf(v.s, v.a)) continue;
      out[k] = {
        s: Number(v.s), a: Number(v.a),
        box: Math.max(0, Math.min(MAX_BOX, Math.floor(Number(v.box)) || 0)),
        due: ISO.test(String(v.due)) ? v.due : today,
        added: ISO.test(String(v.added)) ? v.added : today,
        last: ISO.test(String(v.last)) ? v.last : null,
        reps: Math.max(0, Math.floor(Number(v.reps)) || 0),
        lapses: Math.max(0, Math.floor(Number(v.lapses)) || 0)
      };
    }
    return out;
  }

  // ---- text helpers (presentation only: the Qur'anic text itself is never altered) ----
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const toArabicDigits = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);
  // Letters only: strip harakat, Qur'anic marks, dagger alif and tatweel; unify alef wasla.
  const skeleton = w => String(w).replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/ٱ/g, 'ا');
  const BISMILLAH = ['بسم', 'الله', 'الرحمن', 'الرحيم'];
  // The text service prefixes the Bismillah to ayah 1 of every surah except Al-Fatihah (where it IS ayah 1)
  // and At-Tawbah (which has none). Split it off for display only when the first four words match exactly.
  function splitBismillah(surah, text) {
    const s = Number(surah), t = String(text || '');
    if (s === 1 || s === 9) return { bismillah: '', rest: t };
    const words = t.trim().split(/\s+/);
    if (words.length > 4 && BISMILLAH.every((w, i) => skeleton(words[i]) === w)) {
      return { bismillah: words.slice(0, 4).join(' '), rest: words.slice(4).join(' ') };
    }
    return { bismillah: '', rest: t };
  }

  return { toArabicDigits, splitBismillah, BOX_DAYS, MAX_BOX, localISO, addDays, keyOf, add, addMany, remove, removeSurah, has, review, isDue, dueItems, stats, sanitize };
});
