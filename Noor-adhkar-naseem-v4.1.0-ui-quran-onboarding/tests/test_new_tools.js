'use strict';
const assert = require('node:assert/strict');
const Zakat = require('../www/zakat-core.js');
const Qibla = require('../www/qibla-core.js');

const full = Zakat.calculate({ cash: 100000, debts: 10000, nisab: 50000, haul: true });
assert.equal(full.assets, 100000);
assert.equal(full.net, 90000);
assert.equal(full.meetsNisab, true);
assert.equal(full.eligible, true);
assert.equal(full.due, 2250);

const below = Zakat.calculate({ cash: 20000, debts: 1000, nisab: 50000, haul: true });
assert.equal(below.net, 19000);
assert.equal(below.due, 0);
const noHaul = Zakat.calculate({ cash: 100000, nisab: 50000, haul: false });
assert.equal(noHaul.meetsNisab, true);
assert.equal(noHaul.due, 0);
const excessDebt = Zakat.calculate({ cash: 100, debts: 500, nisab: 1, haul: true });
assert.equal(excessDebt.net, 0);
assert.equal(excessDebt.due, 0);

const srinagarBearing = Qibla.bearing(34.0837, 74.7973);
assert.ok(srinagarBearing > 240 && srinagarBearing < 270, `Unexpected Srinagar bearing: ${srinagarBearing}`);
assert.equal(Qibla.cardinal(srinagarBearing), 'W');
assert.ok(Qibla.distanceKm(34.0837, 74.7973) > 3000 && Qibla.distanceKm(34.0837, 74.7973) < 4000);
assert.throws(() => Qibla.bearing(91, 0), RangeError);
console.log('New tools: all 16 assertions passed.');
