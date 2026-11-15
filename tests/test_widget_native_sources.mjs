// Static checks for the native widget sources. Gradle/Android SDK are not needed, but this is NOT a substitute
// for compiling: it only proves that every resource the Java refers to exists and the manifest wiring is complete.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = existsSync(join(process.cwd(), 'package.json')) ? process.cwd() : join(process.cwd(), '..');
const native = join(root, 'android-native');
const read = f => readFileSync(f, 'utf8');
const javaFiles = readdirSync(join(native, 'java')).filter(f => f.endsWith('.java'));
const layouts = Object.fromEntries(readdirSync(join(native, 'res/layout')).map(f => [f.replace('.xml', ''), read(join(native, 'res/layout', f))]));
const allLayouts = Object.values(layouts).join('\n');
const idsOf = xml => new Set([...xml.matchAll(/@\+id\/(\w+)/g)].map(m => m[1]));
const allIds = idsOf(allLayouts);
const drawables = new Set(readdirSync(join(native, 'res/drawable')).concat(readdirSync(join(native, 'res/drawable-nodpi'))).map(f => f.replace(/\.\w+$/, '')));
const strings = new Set([...read(join(native, 'res/values/noor_widgets.xml')).matchAll(/name="(\w+)"/g)].map(m => m[1]));

// 1. Every R.* reference in the Java sources resolves to a real resource.
for (const file of javaFiles) {
  const src = read(join(native, 'java', file));
  for (const [, kind, name] of src.matchAll(/\bR\.(id|layout|drawable|string)\.(\w+)/g)) {
    if (kind === 'id') assert.ok(allIds.has(name), `${file}: R.id.${name} is not defined in any layout`);
    if (kind === 'layout') assert.ok(layouts[name], `${file}: R.layout.${name} is missing`);
    if (kind === 'drawable') assert.ok(drawables.has(name), `${file}: R.drawable.${name} is missing`);
    if (kind === 'string') assert.ok(strings.has(name), `${file}: R.string.${name} is missing`);
  }
  assert.equal((src.match(/\{/g) || []).length, (src.match(/\}/g) || []).length, `${file}: unbalanced braces`);
  assert.equal((src.match(/\(/g) || []).length, (src.match(/\)/g) || []).length, `${file}: unbalanced parentheses`);
}

// 2. Provider metadata: layouts, previews and strings exist; configure activity class exists.
for (const f of readdirSync(join(native, 'res/xml')).filter(f => f.endsWith('_widget_info.xml'))) {
  const xml = read(join(native, 'res/xml', f));
  const layout = xml.match(/@layout\/(\w+)/)[1];
  assert.ok(layouts[layout], `${f}: initialLayout ${layout} missing`);
  const preview = xml.match(/@drawable\/(\w+)/)[1];
  assert.ok(drawables.has(preview), `${f}: previewImage ${preview} missing`);
  assert.ok(strings.has(xml.match(/@string\/(\w+)/)[1]), `${f}: description string missing`);
  const configure = xml.match(/android:configure="([\w.]+)"/);
  if (configure) assert.ok(existsSync(join(native, 'java', configure[1].split('.').pop() + '.java')), `${f}: configure activity class missing`);
}
assert.match(read(join(native, 'res/xml/custom_widget_info.xml')), /reconfigurable/);

// 3. The small Prayer layout carries every shared view the provider binds (five-prayer row is wide-only).
const small = idsOf(layouts.widget_prayer_small);
for (const id of ['pw_root', 'pw_bg', 'pw_content', 'pw_kicker', 'pw_title', 'pw_timer', 'pw_time', 'pw_hint', 'pw_bar']) assert.ok(small.has(id), `widget_prayer_small is missing ${id}`);

// 4. Every id a provider binds exists in the layout it inflates.
const bindings = { PrayerWidgetProvider: 'widget_prayer', CountdownWidgetProvider: 'widget_countdown', TasbeehWidgetProvider: 'widget_tasbeeh', HijriWidgetProvider: 'widget_hijri', ReflectionWidgetProvider: 'widget_reflection', CustomWidgetProvider: 'widget_custom' };
for (const [cls, layout] of Object.entries(bindings)) {
  const ids = idsOf(layouts[layout]);
  for (const [, id] of read(join(native, 'java', cls + '.java')).matchAll(/\bR\.id\.(\w+)/g)) assert.ok(ids.has(id), `${cls}: R.id.${id} is not in ${layout}.xml`);
}

// 5. Manifest wiring after the patch script runs.
const work = mkdtempSync(join(tmpdir(), 'naseem-widget-src-'));
try {
  for (const file of ['package.json', 'capacitor.config.json', 'scripts/patch-android.mjs', 'www/index.html']) {
    mkdirSync(join(work, file.split('/').slice(0, -1).join('/')), { recursive: true });
    cpSync(join(root, file), join(work, file));
  }
  cpSync(native, join(work, 'android-native'), { recursive: true });
  const main = join(work, 'android/app/src/main');
  mkdirSync(join(main, 'java'), { recursive: true });
  writeFileSync(join(main, 'AndroidManifest.xml'), '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity android:name=".MainActivity" /></application></manifest>');
  writeFileSync(join(work, 'android/app/build.gradle'), 'android { defaultConfig { versionCode 1 } }');
  for (let run = 0; run < 2; run++) { // twice: the patch must be idempotent
    const r = spawnSync(process.execPath, ['scripts/patch-android.mjs'], { cwd: work, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr || r.stdout);
  }
  const manifest = read(join(main, 'AndroidManifest.xml'));
  for (const cls of Object.keys(bindings)) assert.equal(manifest.split(`android:name=".${cls}"`).length - 1, 1, `${cls} must be registered exactly once`);
  assert.equal(manifest.split('android:name=".CustomWidgetConfigActivity"').length - 1, 1);
  assert.match(manifest, /APPWIDGET_CONFIGURE/);
  for (const a of ['BOOT_COMPLETED', 'TIME_SET', 'TIMEZONE_CHANGED', 'PRAYER_REFRESH']) assert.match(manifest, new RegExp(a));
  for (const f of javaFiles) assert.ok(existsSync(join(main, 'java/com/noor/adhkar', f)), `${f} was not copied`);
} finally { rmSync(work, { recursive: true, force: true }); }

// 6. The web bridge exposes every method the plugin implements.
const plugin = read(join(native, 'java/NoorWidgetsPlugin.java'));
const bridge = read(join(root, 'www/native.js'));
for (const [, m] of plugin.matchAll(/@PluginMethod\s+public void (\w+)\(/g)) assert.ok(bridge.includes(`NoorWidgets.${m}(`), `www/native.js does not call NoorWidgets.${m}`);
console.log('Native widget sources: resource, manifest, idempotent-patch and bridge checks passed.');
