// Run after `npx cap add android`. Copies Noor's native Android code (widgets, plugin, MainActivity),
// and adds the manifest permissions/receivers. Safe to run more than once.
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const androidMain = join(root, 'android', 'app', 'src', 'main');
const manifestPath = join(androidMain, 'AndroidManifest.xml');
const gradlePath = join(root, 'android', 'app', 'build.gradle');
const packageInfo = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const versionParts = String(packageInfo.version || '4.0.1').split('.').map(v => Number.parseInt(v, 10) || 0);
// Keep the public versionName unchanged while incrementing Android's internal
// versionCode for 4.1.0 installable builds: 40100 = first build, 40101 = onboarding hotfix,
// 40102 = Quran reader update, 40103 = final onboarding/Salah/More stabilisation package.
// Always increase this for every installable update; the public version label stays 4.1.0.
const versionCode = versionParts[0] * 10000 + versionParts[1] * 100 + versionParts[2] + 3;
if (existsSync(gradlePath)) {
  let gradle = readFileSync(gradlePath, 'utf8');
  if (/versionCode\s+\d+/.test(gradle)) gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  else gradle = gradle.replace(/defaultConfig\s*\{/, match => `${match}\n        versionCode ${versionCode}`);
  if (/versionName\s+['\"][^'\"]+['\"]/.test(gradle)) gradle = gradle.replace(/versionName\s+['\"][^'\"]+['\"]/, `versionName "${packageInfo.version}"`);
  else gradle = gradle.replace(/versionCode\s+\d+/, match => `${match}\n        versionName "${packageInfo.version}"`);
  writeFileSync(gradlePath, gradle);
}
if (!existsSync(manifestPath)) {
  console.error('android/ platform not found. Run `npx cap add android` first.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, 'capacitor.config.json'), 'utf8')).appId;
const javaDir = join(androidMain, 'java', ...pkg.split('.'));
mkdirSync(javaDir, { recursive: true });
cpSync(join(root, 'android-native', 'java'), javaDir, { recursive: true });
cpSync(join(root, 'android-native', 'res'), join(androidMain, 'res'), { recursive: true });

let manifest = readFileSync(manifestPath, 'utf8');

const permissions = [
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
  // Optional GPS prayer times. Noor works without location; this only lets Android ask.
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-feature android:name="android.hardware.location.gps" android:required="false" />'
];
for (const line of permissions) {
  const name = line.match(/android:name="([^"]+)"/)[1];
  // (the same loop adds <uses-feature>; it is matched by name too)
  if (!manifest.includes(name)) manifest = manifest.replace('</manifest>', `    ${line}\n</manifest>`);
}

const receivers = `
        <receiver android:name=".PrayerWidgetProvider" android:exported="true" android:label="@string/noor_prayer_widget_label">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/prayer_widget_info" />
        </receiver>
        <receiver android:name=".TasbeehWidgetProvider" android:exported="true" android:label="@string/noor_tasbeeh_widget_label">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/tasbeeh_widget_info" />
        </receiver>
        <receiver android:name=".HijriWidgetProvider" android:exported="true" android:label="@string/noor_hijri_widget_label">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/hijri_widget_info" />
        </receiver>
        <receiver android:name=".CustomWidgetProvider" android:exported="true" android:label="@string/noor_custom_widget_label">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/custom_widget_info" />
        </receiver>
`;
if (!manifest.includes('.PrayerWidgetProvider')) manifest = manifest.replace('</application>', `${receivers}    </application>`);
if (!manifest.includes('.HijriWidgetProvider')) manifest = manifest.replace('</application>', `        <receiver android:name=".HijriWidgetProvider" android:exported="true" android:label="@string/noor_hijri_widget_label"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/hijri_widget_info" /></receiver>\n    </application>`);
if (!manifest.includes('.CustomWidgetProvider')) manifest = manifest.replace('</application>', `        <receiver android:name=".CustomWidgetProvider" android:exported="true" android:label="@string/noor_custom_widget_label"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/custom_widget_info" /></receiver>\n    </application>`);

writeFileSync(manifestPath, manifest);
console.log('Noor native Android files and manifest entries are in place for', pkg);
