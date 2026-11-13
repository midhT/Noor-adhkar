// Unit tests for www/quran-memory-core.js (spaced-repetition scheduling + text helpers).
const assert = require('assert');
const M = require('../www/quran-memory-core.js');
let n = 0; const ok = (name, fn) => { fn(); n++; };

ok('dates add across month and year boundaries', () => {
  assert.strictEqual(M.addDays('2026-11-30', 1), '2026-12-01');
  assert.strictEqual(M.addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(M.addDays('2028-02-28', 1), '2028-02-29');
  assert.strictEqual(M.addDays('2026-11-13', 60), '2027-01-12');
});
ok('adding ayahs creates new items due today, never duplicates', () => {
  const d = {}; M.add(d, 2, 255, '2026-11-13'); M.add(d, 2, 255, '2026-11-13');
  assert.strictEqual(Object.keys(d).length, 1);
  assert.deepStrictEqual(d['2:255'], { s: 2, a: 255, box: 0, due: '2026-11-13', added: '2026-11-13', last: null, reps: 0, lapses: 0 });
});
ok('invalid surah/ayah are rejected', () => {
  const d = {}; M.add(d, 0, 1, 'x'); M.add(d, 115, 1, 'x'); M.add(d, 2, 0, 'x'); M.add(d, 2, 1.5, 'x'); M.add(d, 'a', 1, 'x');
  assert.strictEqual(Object.keys(d).length, 0);
});
ok('addMany adds a whole surah', () => {
  const d = {}; M.addMany(d, 112, 4, '2026-11-13');
  assert.deepStrictEqual(Object.keys(d).sort(), ['112:1', '112:2', '112:3', '112:4']);
});
ok('remembering climbs the boxes with growing gaps (1,3,7,14,30,60) and caps', () => {
  const d = {}; M.add(d, 1, 1, '2026-01-01');
  let day = '2026-01-01', gaps = [];
  for (let i = 0; i < 8; i++) { const it = M.review(d, 1, 1, true, day); gaps.push(M.BOX_DAYS[it.box]); assert.strictEqual(it.due, M.addDays(day, M.BOX_DAYS[it.box])); day = it.due; }
  assert.deepStrictEqual(gaps, [1, 3, 7, 14, 30, 60, 60, 60]);
  assert.strictEqual(d['1:1'].box, M.MAX_BOX);
});
ok('forgetting drops to box 0, counts a lapse and is due tomorrow', () => {
  const d = {}; M.add(d, 1, 1, '2026-01-01'); M.review(d, 1, 1, true, '2026-01-01'); M.review(d, 1, 1, true, '2026-01-02');
  const it = M.review(d, 1, 1, false, '2026-01-05');
  assert.strictEqual(it.box, 0); assert.strictEqual(it.lapses, 1); assert.strictEqual(it.due, '2026-01-06'); assert.strictEqual(it.reps, 3);
});
ok('due list is date-aware and ordered by surah then ayah', () => {
  const d = {}; M.add(d, 3, 2, '2026-11-13'); M.add(d, 2, 10, '2026-11-13'); M.add(d, 2, 3, '2026-11-13');
  M.review(d, 2, 10, true, '2026-11-13');                       // due again in 1 day
  assert.deepStrictEqual(M.dueItems(d, '2026-11-13').map(i => `${i.s}:${i.a}`), ['2:3', '3:2']);
  assert.deepStrictEqual(M.dueItems(d, '2026-11-14').map(i => `${i.s}:${i.a}`), ['2:3', '2:10', '3:2']);
});
ok('stats count totals, due and well-known per surah', () => {
  const d = {}; M.addMany(d, 1, 3, '2026-11-01'); M.add(d, 2, 1, '2026-11-01');
  for (let i = 0; i < 3; i++) M.review(d, 1, 1, true, '2026-11-01');
  const st = M.stats(d, '2026-11-13');
  assert.strictEqual(st.total, 4); assert.strictEqual(st.due, 4); assert.strictEqual(st.strong, 1);
  assert.deepStrictEqual(st.surahs.map(s => [s.surah, s.total]), [[1, 3], [2, 1]]);
});
ok('remove and removeSurah', () => {
  const d = {}; M.addMany(d, 5, 3, 't'); M.add(d, 6, 1, 't'); M.remove(d, 5, 2); assert.ok(!M.has(d, 5, 2));
  M.removeSurah(d, 5); assert.deepStrictEqual(Object.keys(d), ['6:1']);
});
ok('sanitize drops corrupt entries and clamps values', () => {
  const t = '2026-11-13';
  const out = M.sanitize({ '2:255': { s: 2, a: 255, box: 99, due: 'nonsense', reps: -4 }, '9:9': { s: 2, a: 1 }, '999:1': { s: 999, a: 1 }, bad: 5, '1:1': null }, t);
  assert.deepStrictEqual(Object.keys(out), ['2:255']);
  assert.strictEqual(out['2:255'].box, M.MAX_BOX); assert.strictEqual(out['2:255'].due, t); assert.strictEqual(out['2:255'].reps, 0);
  assert.deepStrictEqual(M.sanitize(null, t), {}); assert.deepStrictEqual(M.sanitize('x', t), {});
});
ok('local date key', () => { assert.strictEqual(M.localISO(new Date(2026, 10, 3)), '2026-11-03'); });
ok('Arabic-Indic digits for ayah markers', () => { assert.strictEqual(M.toArabicDigits(255), '٢٥٥'); assert.strictEqual(M.toArabicDigits(7), '٧'); });
ok('Bismillah is split off ayah 1 for display only, text preserved exactly', () => {
  const b = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', rest = 'الٓمٓ';
  const r = M.splitBismillah(2, `${b} ${rest}`);
  assert.strictEqual(r.bismillah, b); assert.strictEqual(r.rest, rest); assert.strictEqual(`${r.bismillah} ${r.rest}`, `${b} ${rest}`);
});
ok('Al-Fatihah (ayah 1 IS the Bismillah) and At-Tawbah (none) are never split', () => {
  const b = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
  assert.strictEqual(M.splitBismillah(1, b).bismillah, ''); assert.strictEqual(M.splitBismillah(1, b).rest, b);
  assert.strictEqual(M.splitBismillah(9, `${b} x`).bismillah, '');
});
ok('text that merely resembles it, or is shorter, is left untouched', () => {
  const t = 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ'; assert.strictEqual(M.splitBismillah(2, t).bismillah, '');
  const b = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'; assert.strictEqual(M.splitBismillah(2, b).bismillah, '');
  assert.strictEqual(M.splitBismillah(2, '').rest, '');
});
console.log(`Quran memory core: all ${n} assertions passed.`);
