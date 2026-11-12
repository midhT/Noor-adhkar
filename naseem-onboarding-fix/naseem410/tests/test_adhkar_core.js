'use strict';
const assert = require('node:assert/strict');
const C = require('../www/adhkar-core.js');
const D = require('../www/adhkar-data.js');
const both = { morning: true, evening: true };
const items = [{ id: 'a', count: 2 }, { id: 'b', count: 1 }];

// ---- date arithmetic (month/year/leap boundaries)
assert.equal(C.addDays('2026-03-01', -1), '2026-02-28');
assert.equal(C.addDays('2028-03-01', -1), '2028-02-29');
assert.equal(C.addDays('2026-12-31', 1), '2027-01-01');
assert.equal(C.addDays('2026-03-29', 1), '2026-03-30'); // DST-change week in many zones
assert.equal(C.localISO(new Date(2026, 10, 9, 23, 59)), '2026-11-09');
assert.equal(C.localISO(new Date(2026, 10, 10, 0, 1)), '2026-11-10');

// ---- streak policy: BOTH sessions required
let s = C.streaks({ '2026-11-10': { morning: true, evening: false } }, '2026-11-10');
assert.deepEqual([s.current, s.best, s.todayDone], [0, 0, false], 'morning only is not a streak day');
s = C.streaks({ '2026-11-10': { morning: false, evening: true } }, '2026-11-10');
assert.equal(s.current, 0, 'evening only is not a streak day');
s = C.streaks({ '2026-11-10': both }, '2026-11-10');
assert.deepEqual([s.current, s.best, s.todayDone], [1, 1, true]);

// ---- consecutive, alive-through-today, missed day
const run = { '2026-11-07': both, '2026-11-08': both, '2026-11-09': both };
assert.equal(C.streaks(run, '2026-11-09').current, 3);
assert.equal(C.streaks(run, '2026-11-10').current, 3, 'yesterday done, today not yet: streak still alive');
assert.equal(C.streaks(run, '2026-11-11').current, 0, 'a fully missed day ends the streak');
assert.equal(C.streaks(run, '2026-11-11').best, 3, 'best is kept');
const gap = { '2026-11-01': both, '2026-11-02': both, '2026-11-03': both, '2026-11-05': both, '2026-11-06': both };
s = C.streaks(gap, '2026-11-06'); assert.deepEqual([s.current, s.best], [2, 3]);
// partial yesterday breaks the run
s = C.streaks({ '2026-11-08': both, '2026-11-09': { morning: true }, '2026-11-10': both }, '2026-11-10'); assert.equal(s.current, 1);
// month + year rollover
s = C.streaks({ '2026-12-30': both, '2026-12-31': both, '2027-01-01': both }, '2027-01-01'); assert.equal(s.current, 3);
// clock moved: future-dated records are ignored, never inflate the streak
s = C.streaks({ '2026-11-10': both, '2026-11-11': both, '2026-11-12': both }, '2026-11-10'); assert.deepEqual([s.current, s.best], [1, 1]);
// garbage keys tolerated
assert.equal(C.streaks({ 'nope': both, '2026-11-10': both }, '2026-11-10').current, 1);
assert.equal(C.streaks(null, '2026-11-10').current, 0);

// ---- counting
let r = C.tap(items, C.emptySession(), 'a', 'T1');
assert.deepEqual([r.changed, r.completedNow, r.session.progress.a], [true, false, 1]);
r = C.tap(items, r.session, 'a', 'T2'); assert.equal(r.session.progress.a, 2);
r = C.tap(items, r.session, 'a', 'T3'); assert.equal(r.changed, false, 'item never exceeds its prescribed count');
assert.equal(r.session.progress.a, 2);
assert.equal(C.tap(items, r.session, 'zzz').changed, false, 'unknown item ignored');
r = C.tap(items, r.session, 'b', 'DONE'); assert.deepEqual([r.completedNow, r.session.completedAt], [true, 'DONE']);
// re-tapping / reopening a finished session changes nothing and never re-completes
const again = C.tap(items, r.session, 'b', 'LATER'); assert.deepEqual([again.changed, again.completedNow, again.session.completedAt], [false, false, 'DONE']);
// undo locked after completion
assert.equal(C.undo(r.session).changed, false);
// undo while in progress, in LIFO order, and it never goes negative
let u = C.tap(items, C.emptySession(), 'a'); u = C.tap(items, u.session, 'b');
let back = C.undo(u.session); assert.equal(back.changed, true); assert.equal(back.session.progress.b, undefined);
back = C.undo(back.session); assert.equal(back.session.progress.a, undefined);
assert.equal(C.undo(back.session).changed, false);
// does not mutate its input
const before = JSON.stringify(u.session); C.tap(items, u.session, 'a'); C.undo(u.session); assert.equal(JSON.stringify(u.session), before);
// completing needs EVERY item
let part = C.emptySession(); for (let i = 0; i < 2; i++) part = C.tap(items, part, 'a').session; assert.equal(C.isComplete(items, part), false);
// progress numbers
assert.deepEqual(C.progressOf(items, part), { done: 2, total: 3, items: 1, itemTotal: 2 });

// ---- seed data sanity
for (const w of ['morning', 'evening']) {
  const list = D.items(w); assert.ok(list.length >= 5);
  const ids = new Set(list.map(i => i.id)); assert.equal(ids.size, list.length, 'unique ids');
  for (const i of list) { assert.ok(i.arabic && i.title && i.source, i.id); assert.ok(Number.isInteger(i.count) && i.count >= 1, i.id); assert.equal(i.verified, false, 'unverified until reviewed: ' + i.id); }
}
console.log('Adhkar core: all assertions passed.');
