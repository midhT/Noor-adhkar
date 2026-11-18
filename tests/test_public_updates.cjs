const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('www/public-updates.js', 'utf8');
const html = fs.readFileSync('www/index.html', 'utf8');
const m2 = fs.readFileSync('tests/test_m2_ui.py', 'utf8');
assert.match(html, /id="naseemCheckUpdates"/);
assert.match(html, /id="naseemUpdateStatus"/);
assert.match(m2, /add_init_script\("""\(\(\) => \{/);
assert.match(m2, /saved\.setupComplete = true/);
assert.match(m2, /localStorage\.setItem\('naseem-onboarding-complete-v1', '1'\)/);
assert.match(m2, /'Home', 'Dhikr', 'Salah', 'More', 'Zakat', 'Settings'/);
const store = new Map();
const listeners = {};
const document = {
  querySelector: selector => selector === 'meta[name="naseem-version"]' ? ({ content: '4.1.0' }) : selector === 'meta[name="naseem-version-code"]' ? ({ content: '40109' }) : ({ prepend() {} }),
  getElementById: () => null,
  createElement: tag => ({ tagName: tag, className: '', children: [], listeners: {}, append(...nodes) { this.children.push(...nodes); }, addEventListener(name, fn) { this.listeners[name] = fn; }, setAttribute() {}, querySelectorAll: () => [] })
};
const window = { addEventListener(name, fn) { listeners[name] = fn; }, setTimeout() { return 1; }, clearTimeout() {}, open() {} };
const context = {
  document, window, URL, Date, Math, Number, String, JSON, AbortController,
  localStorage: { getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v) },
  setTimeout() {}, fetch: async () => ({ ok: true, json: async () => ({ version: '4.1.0', androidVersionCode: 40112, releaseUrl: 'https://github.com/midhT/Naseem-public/releases/tag/v4.1.0', downloadUrl: 'https://github.com/midhT/Naseem-public/releases/download/v4.1.0/app-release.apk', notesSummary: 'Bug fixes and improvements.' }) })
};
vm.runInNewContext(source, context, { filename: 'public-updates.js' });
(async () => {
  assert.equal(window.NaseemUpdates.currentVersion, '4.1.0');
  assert.equal(window.NaseemUpdates.isNewer('4.1.1', '4.1.0'), true);
  assert.equal(window.NaseemUpdates.isNewer('4.1.0', '4.1.0'), false);
  assert.equal(window.NaseemUpdates.isNewer('4.0.8', '4.1.0'), false);
  assert.equal(window.NaseemUpdates.currentBuild, 40109);
  assert.match(source, /cache: 'no-store'/);
  assert.match(source, /api\.github\.com\/repos\/midhT\/Naseem-public\/contents\/release\.json/);
  assert.equal(window.NaseemUpdates.isUpdateAvailable({ version: '4.1.0', androidVersionCode: 40112 }), true);
  assert.equal(window.NaseemUpdates.isUpdateAvailable({ version: '4.1.0', androidVersionCode: 40109 }), false);
  const result = await window.NaseemUpdates.check(true);
  assert.equal(result.ok, true);
  assert.equal(result.updateAvailable, true);
  assert.equal(result.version, '4.1.0');
  assert.equal(result.androidVersionCode, 40112);
  const state = JSON.parse(store.get('naseem-public-update-state-v1'));
  assert.equal(state.latest, '4.1.0');
  assert.equal(state.latestBuild, 40112);
  assert.equal(state.notifiedBuild, '4.1.0+40112');
  console.log('Public update checker tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
