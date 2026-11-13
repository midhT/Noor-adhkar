/* Pure Adhkar session + streak logic (no DOM, no storage). Unit-tested in tests/test_adhkar_core.js.
   STREAK POLICY (confirmed by the product owner): a day counts only when BOTH the morning and the evening
   session were genuinely completed. Every screen derives its streak from this one function. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NaseemAdhkarCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const POLICY = 'both';

  // Calendar-day arithmetic on YYYY-MM-DD strings via UTC, so DST and timezone offsets can never shift a day.
  const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
  const addDays = (iso, n) => new Date((dayNum(iso) + n) * 86400000).toISOString().slice(0, 10);
  const localISO = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const dayQualifies = rec => !!(rec && rec.morning && rec.evening);

  /* completed: { 'YYYY-MM-DD': {morning:bool, evening:bool} }. Dates after today are ignored (device clock moved);
     a missed day ends the run; a streak stays alive through today until today is over. */
  function streaks(completed, todayIso) {
    const set = new Set(Object.keys(completed || {}).filter(d => ISO.test(d) && d <= todayIso && dayQualifies(completed[d])));
    const days = [...set].sort();
    let best = 0, run = 0, prev = null;
    for (const d of days) { run = prev !== null && dayNum(d) - dayNum(prev) === 1 ? run + 1 : 1; if (run > best) best = run; prev = d; }
    const start = set.has(todayIso) ? todayIso : (set.has(addDays(todayIso, -1)) ? addDays(todayIso, -1) : null);
    let current = 0;
    if (start) for (let d = start; set.has(d); d = addDays(d, -1)) current++;
    return { current, best, todayDone: set.has(todayIso) };
  }

  const emptySession = () => ({ progress: {}, log: [], completedAt: null });
  const clean = s => ({ progress: { ...((s && s.progress) || {}) }, log: [...((s && s.log) || [])], completedAt: (s && s.completedAt) || null });
  const isComplete = (items, s) => items.length > 0 && items.every(i => ((s.progress || {})[i.id] || 0) >= i.count);

  /* One count on one item. Locked once the session is complete, and an item never exceeds its prescribed count. */
  function tap(items, session, itemId, nowIso) {
    const s = clean(session);
    const item = items.find(i => i.id === itemId);
    if (s.completedAt || !item) return { session: s, changed: false, completedNow: false };
    const cur = s.progress[itemId] || 0;
    if (cur >= item.count) return { session: s, changed: false, completedNow: false };
    s.progress[itemId] = cur + 1; s.log.push(itemId);
    const completedNow = isComplete(items, s);
    if (completedNow) s.completedAt = nowIso || new Date().toISOString();
    return { session: s, changed: true, completedNow };
  }

  /* Undo the most recent count. Not allowed after completion, so a finished session (and its streak day) cannot flap. */
  function undo(session) {
    const s = clean(session);
    if (s.completedAt || !s.log.length) return { session: s, changed: false };
    const id = s.log.pop();
    s.progress[id] = Math.max(0, (s.progress[id] || 0) - 1);
    if (!s.progress[id]) delete s.progress[id];
    return { session: s, changed: true };
  }

  function progressOf(items, session) {
    const p = (session && session.progress) || {};
    let done = 0, total = 0;
    for (const i of items) { total += i.count; done += Math.min(p[i.id] || 0, i.count); }
    return { done, total, items: items.filter(i => (p[i.id] || 0) >= i.count).length, itemTotal: items.length };
  }

  return { POLICY, ISO, dayNum, addDays, localISO, dayQualifies, streaks, emptySession, isComplete, tap, undo, progressOf };
});
