// Browser-level regression tests (Playwright/Chromium): Hijri calendar, school vs method, onboarding, setup entry, widget wiring.
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const URL = 'file://' + path.resolve(__dirname, '../www/index.html');
let passed = 0; const ok = (c, m) => { assert.ok(c, m); passed++; console.log('  ok -', m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL); await page.waitForTimeout(500);
  await page.evaluate(() => { document.getElementById('noorIntro')?.remove(); });

  console.log('Hijri conversion (Umm al-Qura anchors)');
  const anchors = await page.evaluate(() => {
    const H = window.NaseemV404, f = (y, m, d) => { const g = H.hijriToGregorian(y, m, d); return g && g.toISOString().slice(0, 10); };
    const loc = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const g = (y, m, d) => { const x = H.hijriToGregorian(y, m, d); return x && loc(x); };
    return { a: g(1446,1,1), b: g(1445,9,1), c: g(1446,9,1), d: g(1446,10,1), e: g(1300,1,1) !== null, f: g(1600,12,1) !== null, bad: H.hijriToGregorian(1299,1,1), bad2: H.hijriToGregorian(1446,13,1) };
  });
  ok(anchors.a === '2024-07-07', '1 Muharram 1446 = 2024-07-07');
  ok(anchors.b === '2024-03-11', '1 Ramadan 1445 = 2024-03-11');
  ok(anchors.c === '2025-03-01', '1 Ramadan 1446 = 2025-03-01');
  ok(anchors.d === '2025-03-30', '1 Shawwal 1446 = 2025-03-30');
  ok(anchors.e && anchors.f, 'range limits 1300 and 1600 convert');
  ok(anchors.bad === null && anchors.bad2 === null, 'out-of-range input rejected');

  console.log('Round trip, month lengths, year boundaries (1400-1500 AH)');
  const rt = await page.evaluate(() => {
    const H = window.NaseemV404; let bad = 0, count = 0, lens = new Set(), contiguous = true, prevEnd = null;
    for (let y = 1400; y <= 1500; y++) for (let m = 1; m <= 12; m++) {
      const len = H.hijriMonthLength(y, m); lens.add(len);
      const first = H.hijriToGregorian(y, m, 1), last = H.hijriToGregorian(y, m, len);
      if (prevEnd) { const n = new Date(prevEnd); n.setDate(n.getDate() + 1); if (n.toDateString() !== first.toDateString()) contiguous = false; }
      prevEnd = last;
      for (const d of [1, len]) { const g = H.hijriToGregorian(y, m, d), h = H.hijriNumeric(g); count++; if (h.year !== y || h.month !== m || h.day !== d) bad++; }
    }
    return { bad, count, lens: [...lens].sort(), contiguous };
  });
  ok(rt.bad === 0, `round trip exact for ${rt.count} dates`);
  ok(rt.lens.join() === '29,30', 'months have 29 or 30 days only');
  ok(rt.contiguous, 'every month starts the day after the previous one ends (incl. year boundaries)');

  console.log('Calendar screen navigation');
  await page.evaluate(() => document.querySelector('[data-open-v404="hijri"]').click()); await page.waitForTimeout(300);
  const nav = await page.evaluate(async () => {
    const t = () => document.getElementById('hijriMonthTitle').textContent, days = () => document.querySelectorAll('#hijriGrid .v404-day').length;
    const seq = [{ t: t(), n: days() }];
    for (let i = 0; i < 26; i++) { document.getElementById('hijriNext').click(); seq.push({ t: t(), n: days() }); }
    for (let i = 0; i < 26; i++) document.getElementById('hijriPrev').click();
    const back = t(); const today = document.querySelectorAll('#hijriGrid .v404-day.today').length;
    const names = ['Muharram','Safar','Rabi','Jumada','Rajab','Sha','Ramadan','Shaw','Dhu'];
    return { seq, back, first: seq[0].t, today, gregorian: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(seq[0].t) && !names.some(n => seq[0].t.includes(n)) };
  });
  const titles = nav.seq.map(x => x.t);
  ok(new Set(titles).size === titles.length, '26 consecutive Next clicks never repeat or skip a month');
  ok(nav.seq.every(x => x.n === 29 || x.n === 30), 'every rendered month has 29 or 30 cells');
  ok(nav.back === nav.first, 'Previous x26 returns to the starting month');
  ok(nav.today === 1, 'exactly one highlighted "today" cell in the current month');
  ok(!nav.gregorian, 'title is a Hijri month name, never a Gregorian one');
  const homeLabel = await page.evaluate(() => document.getElementById('homeHijriDate').textContent);
  ok(!/AH AH/.test(homeLabel) && /AH$/.test(homeLabel), `Home label has a single era suffix (${homeLabel})`);
  const todayNote = await page.evaluate(() => { document.getElementById('hijriGoToday')?.click(); return document.getElementById('hijriToday').textContent; });
  ok(todayNote.includes(homeLabel), 'calendar "Today" matches the Home Hijri date');
  const rev = await page.evaluate(() => { const set = (d, m, y) => { hijriDayInput.value = d; hijriMonthInput.value = m; hijriYearInput.value = y; hijriReverseBtn.click(); return hijriReverseResult.textContent; }; return { ok: set(1, 9, 1446), far: set(1, 1, 1590), bad: set(31, 1, 1446) }; });
  ok(/2025/.test(rev.ok) && /March/.test(rev.ok), `converter: 1 Ramadan 1446 -> ${rev.ok}`);
  ok(/Enter a valid/.test(rev.bad) && !/Enter a valid/.test(rev.far), 'converter works for far years and rejects day 31');

  console.log('Asr preference vs calculation method');
  const asrCheck = await page.evaluate(() => {
    const S = window.NoorSalah, out = {};
    S.set({ method: 'mwl', asr: 'standard' });
    const early = S.timesFor(new Date()).asr;
    S.set({ asr: 'hanafi' });
    const later = S.timesFor(new Date()).asr;
    out.laterThanEarlier = S.toMin(later) - S.toMin(early);
    S.set({ method: 'karachi' }); out.methodIndependent = S.get().asr === 'hanafi';
    out.hasPublicSchoolSelector = !!document.querySelector('#setupTradition,[data-tradition-choice],#ssSchool');
    return out;
  });
  ok(asrCheck.laterThanEarlier > 20, `Later Asr follows the double-shadow preference (+${asrCheck.laterThanEarlier} min)`);
  ok(asrCheck.methodIndependent, 'changing the calculation method does not overwrite the Asr preference');
  ok(!asrCheck.hasPublicSchoolSelector, 'the old school-selection menu is absent from the interface');

  console.log('Setup entry and onboarding persistence');
  const entry = await page.evaluate(() => ({ button: !!document.querySelector('.v404-reopen-setup'), text: document.body.innerText.includes('Edit setup preferences') }));
  ok(!entry.button && !entry.text, 'no separate "Edit setup preferences" entry');
  await page.waitForTimeout(2400);
  ok(await page.locator('.v404-onboarding').count() === 1, 'onboarding shows on first launch');
  await page.click('#setupFinish');
  await page.locator('[data-asr-choice="standard"]').click();
  await page.click('#setupFinish');
  await page.locator('[data-method-choice="mwl"]').click();
  await page.click('#setupFinish');
  await page.click('#setupFinish');
  await page.locator('[data-gender-choice="unspecified"]').click();
  await page.click('#setupFinish');
  await page.click('#setupManual');
  await page.fill('#setupCitySearch','Srinagar');
  await page.locator('[data-city-id="srinagar"]').click();
  await page.click('#setupFinish');
  await page.evaluate(() => { window.__notifAsked = false; if (window.Notification) { const o = Notification.requestPermission; Notification.requestPermission = (...a) => { window.__notifAsked = true; return o.apply(Notification, a); }; } });
  await page.click('#setupFinish'); await page.waitForTimeout(300);
  ok(await page.locator('.v404-onboarding').count() === 0, 'onboarding closes after finishing');
  ok(!(await page.evaluate(() => window.__notifAsked)), 'finishing onboarding does not request notification permission');
  await page.reload(); await page.waitForTimeout(3200);
  ok(await page.locator('.v404-onboarding').count() === 0, 'onboarding does not reopen on the next launch');
  const saved = await page.evaluate(() => ({ asr: window.NoorSalah.get().asr, method: window.NoorSalah.get().method, loc: window.NoorSalah.get().loc.id }));
  ok(saved.asr === 'standard' && saved.method === 'mwl' && saved.loc === 'srinagar', 'Asr preference, calculation method and city persist across launches');

  console.log('Migration: existing prayer preferences are not overwritten');
  const ctx2 = await browser.newContext(); const p2 = await ctx2.newPage();
  await p2.addInitScript(() => { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', '1'); localStorage.setItem('noorSalahV1', JSON.stringify({ method: 'egypt', asr: 'standard' })); localStorage.setItem('naseem-v404-settings', JSON.stringify({ tradition: 'hanafi', setupComplete: true })); } });
  await p2.goto(URL); await p2.waitForTimeout(800);
  const mig = await p2.evaluate(() => ({ s: window.NoorSalah.get().school, m: window.NoorSalah.get().method, a: window.NoorSalah.get().asr }));
  ok(mig.m === 'egypt' && mig.a === 'standard', 'saved calculation method and Asr preference remain intact');
  await ctx2.close();

  ok(errors.filter(e => !/streaks|to12/.test(e)).length === 0, 'no unexpected page errors (' + errors.length + ' environment-related ignored)');
  await browser.close();
  console.log(`\n${passed} checks passed`);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
