// Makes every build (debug and release) use the SAME signing key, so a new APK installs over the old one
// (Android refuses an update whose signing key differs). Run after `npx cap add android`, before the Gradle build.
// Idempotent and safe to run more than once. Key: signing/naseem.keystore (alias "naseem").
// NOTE: this is a personal-app, sideload key whose password is in the repo, so it is NOT secret. Before publishing to
// a store, create a private key, keep it out of the repo (CI secrets) and set NASEEM_KEYSTORE / NASEEM_STORE_PASSWORD /
// NASEEM_KEY_ALIAS / NASEEM_KEY_PASSWORD instead. Never lose the key you ship with: updates require the same key.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function applySigning(gradle, { storeFile, storePassword, keyAlias, keyPassword }) {
  if (gradle.includes('signingConfigs.naseem')) return gradle; // already applied
  const q = v => `'${String(v).replace(/\\/g, '/').replace(/'/g, "\\'")}'`;
  const block = `\n    signingConfigs {\n        naseem {\n            storeFile file(${q(storeFile)})\n            storePassword ${q(storePassword)}\n            keyAlias ${q(keyAlias)}\n            keyPassword ${q(keyPassword)}\n        }\n    }\n`;
  if (!/^android\s*\{/m.test(gradle)) throw new Error('android { } block not found in app/build.gradle');
  let out = gradle.replace(/^android\s*\{/m, m => m + block);
  if (/buildTypes\s*\{/.test(out)) {
    out = out.replace(/buildTypes\s*\{/, m => `${m}\n        debug {\n            signingConfig signingConfigs.naseem\n        }`);
    out = out.replace(/(\n\s*)release\s*\{/, (m, ws) => `${m}${ws}    signingConfig signingConfigs.naseem`);
  } else {
    out = out.replace(/^android\s*\{/m, m => `${m}\n    buildTypes {\n        debug { signingConfig signingConfigs.naseem }\n        release { signingConfig signingConfigs.naseem }\n    }`);
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const gradlePath = join(root, 'android', 'app', 'build.gradle');
  const storeFile = resolve(process.env.NASEEM_KEYSTORE || join(root, 'signing', 'naseem.keystore'));
  if (!existsSync(gradlePath)) { console.error('android/app/build.gradle not found. Run `npx cap add android` first.'); process.exit(1); }
  if (!existsSync(storeFile)) { console.error(`Keystore not found: ${storeFile}`); process.exit(1); }
  const cfg = {
    storeFile,
    storePassword: process.env.NASEEM_STORE_PASSWORD || 'naseem-update',
    keyAlias: process.env.NASEEM_KEY_ALIAS || 'naseem',
    keyPassword: process.env.NASEEM_KEY_PASSWORD || 'naseem-update'
  };
  const before = readFileSync(gradlePath, 'utf8');
  const after = applySigning(before, cfg);
  writeFileSync(gradlePath, after);
  console.log(before === after ? 'Signing already configured.' : `Signing configured: ${cfg.storeFile} (alias ${cfg.keyAlias}).`);
}
