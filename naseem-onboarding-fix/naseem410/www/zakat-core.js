/* Pure Zakat estimate arithmetic. This is a basic 2.5% calculator, not a full fiqh engine. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NaseemZakat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ASSET_KEYS = ['cash', 'gold', 'silver', 'investments', 'inventory', 'receivable'];
  const amount = value => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  function calculate(input = {}) {
    const assets = ASSET_KEYS.reduce((sum, key) => sum + amount(input[key]), 0);
    const debts = amount(input.debts);
    const net = Math.max(0, assets - debts);
    const nisab = amount(input.nisab);
    const haul = input.haul === true;
    const meetsNisab = nisab > 0 && net >= nisab;
    const eligible = meetsNisab && haul;
    return {
      assets, debts, net, nisab, haul, meetsNisab, eligible,
      rate: 0.025,
      due: eligible ? net * 0.025 : 0
    };
  }
  return { calculate, ASSET_KEYS };
});
