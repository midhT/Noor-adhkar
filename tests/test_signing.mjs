import assert from 'node:assert/strict';
import { applySigning } from '../scripts/apply-signing.mjs';

const cfg = {
  storeFile: '/work/signing/naseem.keystore',
  storePassword: 'pw',
  keyAlias: 'naseem',
  keyPassword: 'pw'
};

const cap = `apply plugin: 'com.android.application'

android {
    namespace = "com.noor.adhkar"
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.noor.adhkar"
        versionCode 40007
        versionName "4.0.7"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
`;

const out = applySigning(cap, cfg);

assert.match(out, /signingConfigs\s*\{\s*naseemRelease\s*\{/);
assert.match(out, /storeFile file\('\/work\/signing\/naseem\.keystore'\)/);
assert.match(out, /release\s*\{\s*signingConfig signingConfigs\.naseemRelease/);
assert.equal((out.match(/signingConfig signingConfigs\.naseemRelease/g) || []).length, 1);
assert.ok(out.indexOf('signingConfigs {') < out.indexOf('buildTypes {'));
assert.ok(out.indexOf('signingConfigs {') > out.indexOf('android {'));
assert.equal(applySigning(out, cfg), out, 'idempotent');

for (const keep of [
  'versionCode 40007',
  'namespace = "com.noor.adhkar"',
  "proguard-rules.pro"
]) assert.ok(out.includes(keep), keep);

const bal = s => [...s].reduce((n, c) => n + (c === '{') - (c === '}'), 0);
assert.equal(bal(out), 0);

const bare = applySigning("android {\n    namespace 'x'\n}\n", cfg);
assert.match(bare, /buildTypes\s*\{[\s\S]*release/);
assert.equal(bal(bare), 0);

assert.match(
  applySigning("android {\n}\n", {
    ...cfg,
    storeFile: "C:\\k\\it's.keystore"
  }),
  /C:\/k\/it\\'s\.keystore/
);

assert.throws(() => applySigning('nothing here', cfg), /android/);
assert.throws(() => applySigning(cap, { ...cfg, keyPassword: '' }), /keyPassword/);

console.log('Release signing patch: all assertions passed.');
