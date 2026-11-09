/* Noor — offline prayer-time engine and Salah settings store.
   No network is used. Times come from solar-position maths (the same formulation used by PrayTimes.org),
   so they work anywhere, change with the seasons and follow daylight-saving rules through the device's
   time-zone database. Default: Srinagar (Kashmir, India), Karachi method (Fajr 18°, Isha 18°), Hanafi Asr.
   Calculated times are an aid: local mosque timetables are the authority and can differ by a few minutes. */
(function (root) {
  'use strict';
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var sin = function (d) { return Math.sin(d * D2R); }, cos = function (d) { return Math.cos(d * D2R); }, tan = function (d) { return Math.tan(d * D2R); };
  var asin = function (x) { return Math.asin(x) * R2D; }, acos = function (x) { return Math.acos(x) * R2D; };
  var atan2 = function (y, x) { return Math.atan2(y, x) * R2D; }, arccot = function (x) { return Math.atan(1 / x) * R2D; };
  var fix = function (a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

  var METHODS = {
    karachi: { name: 'University of Islamic Sciences, Karachi', fajr: 18, isha: 18 },
    mwl: { name: 'Muslim World League', fajr: 18, isha: 17 },
    isna: { name: 'ISNA (North America)', fajr: 15, isha: 15 },
    egypt: { name: 'Egyptian General Authority', fajr: 19.5, isha: 17.5 },
    makkah: { name: 'Umm al-Qura, Makkah', fajr: 18.5, ishaMinutes: 90 }
  };
  var PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var LABELS = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  var CITIES = [
    { id: 'srinagar', name: 'Srinagar, Kashmir', lat: 34.0837, lng: 74.7973, tz: 'Asia/Kolkata' },
    { id: 'anantnag', name: 'Anantnag, Kashmir', lat: 33.7311, lng: 75.1487, tz: 'Asia/Kolkata' },
    { id: 'baramulla', name: 'Baramulla, Kashmir', lat: 34.1980, lng: 74.3636, tz: 'Asia/Kolkata' },
    { id: 'kupwara', name: 'Kupwara, Kashmir', lat: 34.5262, lng: 74.2546, tz: 'Asia/Kolkata' },
    { id: 'sopore', name: 'Sopore, Kashmir', lat: 34.2989, lng: 74.4673, tz: 'Asia/Kolkata' },
    { id: 'jammu', name: 'Jammu', lat: 32.7266, lng: 74.8570, tz: 'Asia/Kolkata' },
    { id: 'leh', name: 'Leh, Ladakh', lat: 34.1526, lng: 77.5771, tz: 'Asia/Kolkata' },
    { id: 'delhi', name: 'New Delhi', lat: 28.6139, lng: 77.2090, tz: 'Asia/Kolkata' },
    { id: 'mumbai', name: 'Mumbai', lat: 19.0760, lng: 72.8777, tz: 'Asia/Kolkata' },
    { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, tz: 'Asia/Kolkata' },
    { id: 'hyderabad', name: 'Hyderabad', lat: 17.3850, lng: 78.4867, tz: 'Asia/Kolkata' },
    { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, tz: 'Asia/Kolkata' },
    { id: 'lucknow', name: 'Lucknow', lat: 26.8467, lng: 80.9462, tz: 'Asia/Kolkata' },
    { id: 'makkah', name: 'Makkah', lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh' },
    { id: 'madinah', name: 'Madinah', lat: 24.4672, lng: 39.6111, tz: 'Asia/Riyadh' },
    { id: 'dubai', name: 'Dubai', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
    { id: 'karachi', name: 'Karachi', lat: 24.8607, lng: 67.0011, tz: 'Asia/Karachi' },
    { id: 'lahore', name: 'Lahore', lat: 31.5204, lng: 74.3587, tz: 'Asia/Karachi' },
    { id: 'dhaka', name: 'Dhaka', lat: 23.8103, lng: 90.4125, tz: 'Asia/Dhaka' },
    { id: 'istanbul', name: 'Istanbul', lat: 41.0082, lng: 28.9784, tz: 'Europe/Istanbul' },
    { id: 'london', name: 'London', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
    { id: 'newyork', name: 'New York', lat: 40.7128, lng: -74.0060, tz: 'America/New_York' },
    { id: 'toronto', name: 'Toronto', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto' }
  ];

  /* ---------- astronomy ---------- */
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPosition(jd) {
    var D = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
    var e = 23.439 - 0.00000036 * D;
    var RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA < -12 ? q / 15 - RA + 24 : (q / 15 - RA > 12 ? q / 15 - RA - 24 : q / 15 - RA) };
  }

  /** Raw calculated times as decimal hours in the location's local time (NaN where the sun never reaches an angle). */
  function computeHours(y, m, d, lat, lng, tzHours, methodId, asr) {
    var M = METHODS[methodId] || METHODS.karachi, factor = asr === 'standard' ? 1 : 2;
    var jd = julian(y, m, d) - lng / (15 * 24);
    var midDay = function (t) { return fix(12 - sunPosition(jd + t).eqt, 24); };
    var angleTime = function (angle, t, ccw) {
      var decl = sunPosition(jd + t).decl;
      var v = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return midDay(t) + (ccw ? -v : v);
    };
    var asrTime = function (t) {
      var decl = sunPosition(jd + t).decl;
      return midDay(t) + acos((-sin(-arccot(factor + tan(Math.abs(lat - decl)))) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    };
    var t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
    for (var it = 0; it < 2; it++) {              // refine with the sun's position at the first estimate
      var p = {};
      Object.keys(t).forEach(function (k) { p[k] = t[k] / 24; });
      t = {
        fajr: angleTime(M.fajr, p.fajr, true),
        sunrise: angleTime(0.833, p.sunrise, true),
        dhuhr: midDay(p.dhuhr),
        asr: asrTime(p.asr),
        sunset: angleTime(0.833, p.sunset, false),
        isha: M.ishaMinutes ? 18 : angleTime(M.isha, p.isha, false)
      };
    }
    var shift = tzHours - lng / 15;
    Object.keys(t).forEach(function (k) { t[k] += shift; });
    if (M.ishaMinutes) t.isha = t.sunset + M.ishaMinutes / 60;
    // High latitudes: if an angle is never reached, or the twilight would be longer than half the night, use the middle of the night.
    var night = fix(t.sunrise - t.sunset, 24), half = night / 2;
    if (isNaN(t.fajr) || fix(t.sunrise - t.fajr, 24) > half) t.fajr = t.sunrise - half;
    if (!M.ishaMinutes && (isNaN(t.isha) || fix(t.isha - t.sunset, 24) > half)) t.isha = t.sunset + half;
    return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.sunset, isha: t.isha };
  }
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function hoursToHHMM(h) {
    var mins = Math.round(fix(h, 24) * 60) % 1440;     // nearest minute
    return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60);
  }
  function tzOffsetHours(tz, y, m, d) {
    try {
      var utc = Date.UTC(y, m - 1, d, 12);
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(utc));
      var g = function (type) { return Number(parts.filter(function (p) { return p.type === type; })[0].value); };
      return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - utc) / 3600000;
    } catch (e) { return -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60; }
  }
  function calculate(y, m, d, loc, methodId, asr) {
    var h = computeHours(y, m, d, loc.lat, loc.lng, tzOffsetHours(loc.tz, y, m, d), methodId, asr), out = {};
    Object.keys(h).forEach(function (k) { out[k] = hoursToHHMM(h[k]); });
    return out;
  }
  var toMin = function (v) { return /^\d{2}:\d{2}$/.test(v || '') ? Number(v.slice(0, 2)) * 60 + Number(v.slice(3)) : null; };
  var fromMin = function (n) { n = ((n % 1440) + 1440) % 1440; return pad(Math.floor(n / 60)) + ':' + pad(n % 60); };

  var api = { METHODS: METHODS, CITIES: CITIES, PRAYERS: PRAYERS, LABELS: LABELS, calculate: calculate, computeHours: computeHours, tzOffsetHours: tzOffsetHours, toMin: toMin, fromMin: fromMin };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  /* ---------- settings store (browser only) ---------- */
  var KEY = 'noorSalahV1', MANUAL_KEY = 'noorPrayerScheduleV1';
  var DEFAULT_JAMAAT = { fajr: 20, dhuhr: 15, asr: 15, maghrib: 5, isha: 15 };
  function defaults() {
    var j = {}; PRAYERS.forEach(function (p) { j[p] = { mode: 'offset', offset: DEFAULT_JAMAAT[p], fixed: '' }; });
    var adj = {}; PRAYERS.forEach(function (p) { adj[p] = 0; }); adj.sunrise = 0;
    return { loc: { id: 'srinagar', name: 'Srinagar, Kashmir', lat: 34.0837, lng: 74.7973, tz: 'Asia/Kolkata', source: 'default' }, method: 'karachi', asr: 'hanafi', adj: adj, mode: 'calculated', jamaat: j };
  }
  var manual = function () { try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}'); } catch (e) { return {}; } };
  var settings;
  (function load() {
    var d = defaults(), raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (raw && typeof raw === 'object') {
      settings = Object.assign(d, raw);
      settings.adj = Object.assign(defaults().adj, raw.adj || {});
      settings.jamaat = Object.assign(defaults().jamaat, raw.jamaat || {});
      settings.loc = Object.assign(defaults().loc, raw.loc || {});
    } else {
      settings = d;
      // A person who already typed their own prayer times keeps them: start in "my own times" mode.
      var m = manual();
      if (PRAYERS.some(function (p) { return toMin(m[p]) !== null; })) settings.mode = 'manual';
      try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
    }
  })();
  var emit = function () { window.dispatchEvent(new CustomEvent('noor:schedule', { detail: null })); };
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {} emit(); }
  var ymd = function (date) { return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }; };

  /** Effective times for a date (a JS Date in device time), "HH:mm" 24-hour internally. */
  function timesFor(date) {
    var p = ymd(date || new Date()), calc = calculate(p.y, p.m, p.d, settings.loc, settings.method, settings.asr), out = {}, man = manual();
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k) {
      if (settings.mode === 'manual' && toMin(man[k]) !== null) out[k] = man[k];
      else out[k] = fromMin(toMin(calc[k]) + (settings.mode === 'calculated' ? (settings.adj[k] || 0) : 0));
    });
    return out;
  }
  function calcFor(date) { var p = ymd(date || new Date()); return calculate(p.y, p.m, p.d, settings.loc, settings.method, settings.asr); }
  function jamaatFor(date) {
    var t = timesFor(date), out = {};
    PRAYERS.forEach(function (k) {
      var j = settings.jamaat[k] || {};
      out[k] = j.mode === 'fixed' && toMin(j.fixed) !== null ? j.fixed : fromMin(toMin(t[k]) + (Number(j.offset) || 0));
    });
    return out;
  }
  api.get = function () { return settings; };
  api.set = function (patch) { Object.assign(settings, patch); persist(); };
  api.setAdj = function (k, v) { settings.adj[k] = Math.max(-60, Math.min(60, Math.round(v))); persist(); };
  api.resetAdj = function () { Object.keys(settings.adj).forEach(function (k) { settings.adj[k] = 0; }); persist(); };
  api.setJamaat = function (k, patch) { settings.jamaat[k] = Object.assign({}, settings.jamaat[k], patch); persist(); };
  api.resetJamaat = function () { settings.jamaat = defaults().jamaat; persist(); };
  api.setLocation = function (loc) { settings.loc = Object.assign({}, loc); persist(); };
  api.timesFor = timesFor; api.calcFor = calcFor; api.jamaatFor = jamaatFor; api.defaults = defaults; api.KEY = KEY;
  root.NoorSalah = api;
})(typeof window !== 'undefined' ? window : globalThis);
