import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const source = existsSync(join(process.cwd(), 'package.json')) ? process.cwd() : join(process.cwd(), '..');
const root = mkdtempSync(join(tmpdir(), 'naseem-android-patch-'));
try {
  for (const file of ['package.json','capacitor.config.json','scripts/patch-android.mjs']) {
    mkdirSync(join(root, file.split('/').slice(0,-1).join('/')), {recursive:true});
    cpSync(join(source,file),join(root,file));
  }
  cpSync(join(source,'android-native'),join(root,'android-native'),{recursive:true});
  const main = join(root,'android/app/src/main');
  mkdirSync(join(main,'java'),{recursive:true});
  mkdirSync(join(root,'android/app'),{recursive:true});
  writeFileSync(join(main,'AndroidManifest.xml'),'<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity android:name=".MainActivity" /></application></manifest>');
  writeFileSync(join(root,'android/app/build.gradle'),'android { defaultConfig { versionCode 1 } }');
  const result = spawnSync(process.execPath,['scripts/patch-android.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr || result.stdout);
  const manifest=readFileSync(join(main,'AndroidManifest.xml'),'utf8');
  assert.match(manifest,/PrayerWidgetProvider/);
  assert.match(manifest,/TasbeehWidgetProvider/);
  assert.match(manifest,/POST_NOTIFICATIONS/);
  assert.ok(existsSync(join(main,'java/com/noor/adhkar/MainActivity.java')));
  assert.ok(existsSync(join(main,'java/com/noor/adhkar/NoorWidgetsPlugin.java')));
  assert.ok(existsSync(join(main,'res/layout/widget_prayer.xml')));
  assert.ok(existsSync(join(main,'res/xml/tasbeeh_widget_info.xml')));
  assert.match(readFileSync(join(root,'android/app/build.gradle'),'utf8'),/versionCode 40005/);
  console.log('Android native integration patch: all assertions passed.');
} finally { rmSync(root,{recursive:true,force:true}); }
