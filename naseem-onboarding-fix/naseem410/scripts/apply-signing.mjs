// Configure the release signing key from CI environment variables only.
// Never commit the keystore or passwords. The workflow writes the keystore to RUNNER_TEMP.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function applySigning(gradle, { storeFile, storePassword, keyAlias, keyPassword }) {
  for (const [name, value] of Object.entries({ storeFile, storePassword, keyAlias, keyPassword })) {
    if (!value || !String(value).trim()) throw new Error(`Missing release signing value: ${name}`);
  }
  if (!/^android\s*\{/m.test(gradle)) throw new Error('android { } block not found in app/build.gradle');
  if (gradle.includes('signingConfigs.naseemRelease')) return gradle;
  const q = value => `'${String(value).replace(/\\/g, '/').replace(/'/g, "\\'")}'`;
  const signing = `\n    signingConfigs {\n        naseemRelease {\n            storeFile file(${q(storeFile)})\n            storePassword ${q(storePassword)}\n            keyAlias ${q(keyAlias)}\n            keyPassword ${q(keyPassword)}\n        }\n    }\n`;
  let out = gradle;
  if (!out.includes('signingConfigs.naseemRelease')) {
    out = out.replace(/^android\s*\{/m, match => match + signing);
  }
  if (/buildTypes\s*\{/.test(out)) {
    if (/release\s*\{/.test(out)) {
      out = out.replace(/(release\s*\{)/, '$1\n            signingConfig signingConfigs.naseemRelease');
    } else {
      out = out.replace(/buildTypes\s*\{/, match => `${match}\n        release { signingConfig signingConfigs.naseemRelease }`);
    }
  } else {
    out = out.replace(/^android\s*\{/m, match => `${match}\n    buildTypes { release { signingConfig signingConfigs.naseemRelease } }`);
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const gradlePath = join(root, 'android', 'app', 'build.gradle');
  const storeFile = process.env.NASEEM_KEYSTORE;
  const cfg = {
    storeFile,
    storePassword: process.env.NASEEM_STORE_PASSWORD,
    keyAlias: process.env.NASEEM_KEY_ALIAS,
    keyPassword: process.env.NASEEM_KEY_PASSWORD
  };
  if (!existsSync(gradlePath)) throw new Error('android/app/build.gradle not found. Run `npx cap add android` first.');
  if (!storeFile || !existsSync(storeFile)) throw new Error('Release keystore missing. Configure NASEEM_KEYSTORE in the CI environment.');
  const before = readFileSync(gradlePath, 'utf8');
  const after = applySigning(before, cfg);
  writeFileSync(gradlePath, after);
  console.log('Release signing configured from protected CI secrets.');
}
