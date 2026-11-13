/* Pure Qibla direction and great-circle distance calculations. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NaseemQibla = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KAABA = Object.freeze({ lat: 21.422487, lng: 39.826206 });
  const rad = degrees => degrees * Math.PI / 180;
  const deg = radians => radians * 180 / Math.PI;
  const normalize = value => (value % 360 + 360) % 360;
  function validPoint(lat, lng) {
    return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
  }
  function bearing(lat, lng) {
    if (!validPoint(lat, lng)) throw new RangeError('Latitude or longitude is invalid.');
    const p1 = rad(Number(lat)), p2 = rad(KAABA.lat), deltaLng = rad(KAABA.lng - Number(lng));
    const y = Math.sin(deltaLng) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(deltaLng);
    return normalize(deg(Math.atan2(y, x)));
  }
  function distanceKm(lat, lng) {
    if (!validPoint(lat, lng)) throw new RangeError('Latitude or longitude is invalid.');
    const R = 6371;
    const deltaLat = rad(KAABA.lat - Number(lat));
    const deltaLng = rad(KAABA.lng - Number(lng));
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(Number(lat))) * Math.cos(rad(KAABA.lat)) * Math.sin(deltaLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function cardinal(angle) {
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(normalize(angle) / 45) % 8];
  }
  return { KAABA, bearing, distanceKm, cardinal, normalize, validPoint };
});
