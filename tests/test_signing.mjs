import assert from 'node:assert/strict';
import { applySigning } from '../scripts/apply-signing.mjs';
const cfg = { storeFile: '/runner/temp/naseem-release.keystore', storePassword: 'pw', keyAlias: 'naseem', keyPassword: 'pw' };
const cap = `apply plugin: 'com.android.application'
android {
    namespace = "com.noor.adhkar"
    defaultConfig { applicationId "com.noor.adhkar"; versionCode 40009; versionName "4.0.9" }
    buildTypes { release { minifyEnabled false } }
}`;
const out = applySigning(cap, cfg);
assert.match(out, /signingConfigs\s*\{\s*naseemRelease\s*\{/);
assert.match(out, /storeFile file\('\/runner\/temp\/naseem-release\.keystore'\)/);
assert.match(out, /release\s*\{\s*signingConfig signingConfigs\.naseemRelease\s*minifyEnabled false/);
assert.doesNotMatch(out, /debug\s*\{\s*signingConfig/);
assert.equal(applySigning(out, cfg), out, 'idempotent');
assert.throws(() => applySigning(cap, { ...cfg, keyPassword: '' }), /Missing release signing value/);
assert.throws(() => applySigning('nothing here', cfg), /android/);
const bare = applySigning('android { defaultConfig {} }', cfg);
assert.match(bare, /buildTypes\s*\{\s*release\s*\{\s*signingConfig signingConfigs\.naseemRelease/);
console.log('Release signing tests passed.');
