import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(pkg.version, '4.1.0');
assert.equal(JSON.parse(readFileSync('capacitor.config.json', 'utf8')).appId, 'com.noor.adhkar');
const release = readFileSync('.github/workflows/release.yml', 'utf8');
for (const key of ['NASEEM_KEYSTORE_BASE64', 'NASEEM_STORE_PASSWORD', 'NASEEM_KEY_ALIAS', 'NASEEM_KEY_PASSWORD', 'NASEEM_PUBLIC_REPO_TOKEN']) assert.ok(release.includes(key), key);
assert.match(release, /assembleRelease/);
assert.match(release, /softprops\/action-gh-release/);
assert.match(release, /midhT\/Naseem-public/);
assert.ok(!existsSync('signing/naseem.keystore'), 'legacy embedded keystore removed');
assert.match(readFileSync('.gitignore', 'utf8'), /\*\.keystore/);
assert.match(readFileSync('www/sw.js', 'utf8'), /noor-adhkar-cache-v4113/);
console.log('V4.1.0 release configuration checks passed.');

assert.match(release, /app-release\.apk\.sha256/);
assert.match(release, /APK_SHA256/);
assert.match(release, /checksumUrl/);
