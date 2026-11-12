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
  assert.match(manifest,/HijriWidgetProvider/);
  assert.match(manifest,/CustomWidgetProvider/);
  assert.match(manifest,/POST_NOTIFICATIONS/);
  assert.ok(existsSync(join(main,'java/com/noor/adhkar/MainActivity.java')));
  assert.ok(existsSync(join(main,'java/com/noor/adhkar/NoorWidgetsPlugin.java')));
  const activity=readFileSync(join(main,'java/com/noor/adhkar/MainActivity.java'),'utf8');
  assert.match(activity,/getRegistrations\(\)/);
  assert.match(readFileSync(join(main,'java/com/noor/adhkar/NoorWidgetsPlugin.java'),'utf8'),/setWidgetStyle/);
  assert.match(activity,/noor-adhkar-cache-/);
  assert.match(activity,/window\.location\.reload\(\)/);
  assert.doesNotMatch(activity,/localStorage\.clear/);
  assert.ok(existsSync(join(main,'res/layout/widget_prayer.xml')));
  assert.ok(existsSync(join(main,'res/xml/tasbeeh_widget_info.xml')));
  assert.ok(existsSync(join(main,'res/layout/widget_hijri.xml')));
  assert.ok(existsSync(join(main,'res/xml/hijri_widget_info.xml')));
  assert.ok(existsSync(join(main,'res/layout/widget_custom.xml')));
  assert.ok(existsSync(join(main,'res/xml/custom_widget_info.xml')));
  assert.ok(existsSync(join(main,'res/drawable-nodpi/widget_preview_custom.png')));
  assert.ok(existsSync(join(main,'res/drawable-nodpi/widget_preview_prayer.png')));
  assert.match(readFileSync(join(main,'res/xml/prayer_widget_info.xml'),'utf8'),/previewImage/);
  assert.match(readFileSync(join(root,'android/app/build.gradle'),'utf8'),/versionCode 40101/);
  console.log('Android native integration patch: all assertions passed.');
} finally { rmSync(root,{recursive:true,force:true}); }
