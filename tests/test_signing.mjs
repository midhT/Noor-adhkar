import assert from 'node:assert/strict';
import { applySigning } from '../scripts/apply-signing.mjs';
const cfg = { storeFile: '/work/signing/naseem.keystore', storePassword: 'pw', keyAlias: 'naseem', keyPassword: 'pw' };
// Shape of the Capacitor app/build.gradle template
const cap = `apply plugin: 'com.android.application'

android {
    namespace = "com.noor.adhkar"
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.noor.adhkar"
        versionCode 40004
        versionName "4.0.4"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    flatDir { dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs' }
}
`;
const out = applySigning(cap, cfg);
assert.match(out, /signingConfigs\s*\{\s*naseem\s*\{/);
assert.match(out, /storeFile file\('\/work\/signing\/naseem\.keystore'\)/);
assert.match(out, /buildTypes\s*\{\s*debug\s*\{\s*signingConfig signingConfigs\.naseem/);
assert.match(out, /release\s*\{\s*signingConfig signingConfigs\.naseem\s*minifyEnabled false/);
assert.equal((out.match(/signingConfigs\.naseem/g) || []).length, 2, 'debug + release only');
assert.ok(out.indexOf('signingConfigs {') < out.indexOf('buildTypes {'), 'signingConfigs declared before it is used');
assert.ok(out.indexOf('signingConfigs {') > out.indexOf('android {'), 'inside android block');
assert.equal(applySigning(out, cfg), out, 'idempotent');
// existing content untouched
for (const keep of ['versionCode 40004', 'namespace = "com.noor.adhkar"', "proguard-rules.pro", 'flatDir']) assert.ok(out.includes(keep), keep);
// braces balance
const bal = s => [...s].reduce((n, c) => n + (c === '{') - (c === '}'), 0);
assert.equal(bal(out), 0);
// template without buildTypes
const bare = applySigning("android {\n    namespace 'x'\n}\n", cfg); assert.match(bare, /buildTypes\s*\{[\s\S]*debug[\s\S]*release/); assert.equal(bal(bare), 0);
// Windows path / quotes are escaped
assert.match(applySigning("android {\n}\n", { ...cfg, storeFile: "C:\\k\\it's.keystore" }), /C:\/k\/it\\'s\.keystore/);
assert.throws(() => applySigning('nothing here', cfg), /android/);
console.log('Signing patch: all assertions passed.');
