// Run after `npx cap add android`. Copies Noor's native Android code (widgets, plugin, MainActivity),
// and adds the manifest permissions/receivers. Safe to run more than once.
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const androidMain = join(root, 'android', 'app', 'src', 'main');
const manifestPath = join(androidMain, 'AndroidManifest.xml');
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
`;
if (!manifest.includes('.PrayerWidgetProvider')) manifest = manifest.replace('</application>', `${receivers}    </application>`);

writeFileSync(manifestPath, manifest);
console.log('Noor native Android files and manifest entries are in place for', pkg);
