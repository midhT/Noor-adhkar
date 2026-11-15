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
// 40100-40106 are prior 4.1.0 builds; 40107 is the next in-place update candidate (widget redesign).
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

// Home-screen widgets. Each entry is added only when its receiver is not already in the manifest.
const widgetReceivers = [
  { cls: 'PrayerWidgetProvider', label: 'noor_prayer_widget_label', info: 'prayer_widget_info',
    // Shared refresh/boot/time-change entry point for the Prayer, Salah Countdown and Custom widgets.
    extraActions: ['android.intent.action.BOOT_COMPLETED', 'android.intent.action.TIME_SET', 'android.intent.action.TIMEZONE_CHANGED', 'android.intent.action.DATE_CHANGED', 'com.noor.adhkar.PRAYER_REFRESH'] },
  { cls: 'CountdownWidgetProvider', label: 'noor_countdown_widget_label', info: 'countdown_widget_info' },
  { cls: 'TasbeehWidgetProvider', label: 'noor_tasbeeh_widget_label', info: 'tasbeeh_widget_info' },
  { cls: 'HijriWidgetProvider', label: 'noor_hijri_widget_label', info: 'hijri_widget_info' },
  { cls: 'ReflectionWidgetProvider', label: 'noor_reflection_widget_label', info: 'reflection_widget_info' },
  { cls: 'CustomWidgetProvider', label: 'noor_custom_widget_label', info: 'custom_widget_info' }
];
for (const w of widgetReceivers) {
  if (manifest.includes(`.${w.cls}"`)) continue;
  const actions = ['android.appwidget.action.APPWIDGET_UPDATE', ...(w.extraActions || [])]
    .map(a => `<action android:name="${a}" />`).join('');
  const receiver = `
        <receiver android:name=".${w.cls}" android:exported="true" android:label="@string/${w.label}">
            <intent-filter>${actions}</intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/${w.info}" />
        </receiver>
`;
  manifest = manifest.replace('</application>', `${receiver}    </application>`);
}
// Per-instance settings screen for the Custom widget (launchers open it when the widget is added or reconfigured).
if (!manifest.includes('.CustomWidgetConfigActivity')) {
  const configure = `
        <activity android:name=".CustomWidgetConfigActivity" android:exported="true" android:label="@string/noor_custom_widget_label" android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_CONFIGURE" /></intent-filter>
        </activity>
`;
  manifest = manifest.replace('</application>', `${configure}    </application>`);
}

writeFileSync(manifestPath, manifest);
console.log('Noor native Android files and manifest entries are in place for', pkg);
