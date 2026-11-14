// Run after `npx cap add android`. Copies Noor's native Android code (widgets, plugin, MainActivity),
// and adds the manifest permissions/receivers. Safe to run more than once.
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const androidMain = join(root, 'android', 'app', 'src', 'main');
const manifestPath = join(androidMain, 'AndroidManifest.xml');
const gradlePath = join(root, 'android', 'app', 'build.gradle');
const packageInfo = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const sourceIndexPath = join(root, 'www', 'index.html');
const sourceIndex = readFileSync(sourceIndexPath, 'utf8');
const buildMatch = sourceIndex.match(/<meta\s+name=["']naseem-version-code["']\s+content=["'](\d+)["'][^>]*>/i);
if (!buildMatch) throw new Error('www/index.html must declare the naseem-version-code meta tag.');
const versionCode = Number(buildMatch[1]);
if (!Number.isSafeInteger(versionCode) || versionCode <= 0) throw new Error('Invalid Naseem Android version code.');
// The public versionName remains 4.1.0; increase this meta value for each new installable APK.
// 40100-40105 are prior 4.1.0 builds; 40106 is the next in-place update candidate.
if (existsSync(gradlePath)) {
  let gradle = readFileSync(gradlePath, 'utf8');
  if (/versionCode\s+\d+/.test(gradle)) gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  else gradle = gradle.replace(/defaultConfig\s*\{/, match => `${match}\n        versionCode ${versionCode}`);
  if (/versionName\s+['\"][^'\"]+['\"]/.test(gradle)) gradle = gradle.replace(/versionName\s+['\"][^'\"]+['\"]/, `versionName "${packageInfo.version}"`);
  else gradle = gradle.replace(/versionCode\s+\d+/, match => `${match}\n        versionName "${packageInfo.version}"`);
  writeFileSync(gradlePath, gradle);
}
const bundledIndexPath = join(androidMain, 'assets', 'public', 'index.html');
if (existsSync(bundledIndexPath)) writeFileSync(bundledIndexPath, sourceIndex);
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
