// Run after `npx @capacitor/assets generate --android`. Adds the monochrome layer so Android 13+ "themed icons"
// can tint Noor's crescent to the wallpaper colours. Safe to run more than once; skips quietly if the generated
// adaptive-icon files are not where expected (the normal adaptive icon still works).
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const res = join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
const src = join(process.cwd(), 'android-native', 'icon', 'ic_launcher_monochrome.png');
if (!existsSync(src) || !existsSync(res)) { console.warn('patch-icons: nothing to do'); process.exit(0); }
mkdirSync(join(res, 'drawable-nodpi'), { recursive: true });
cpSync(src, join(res, 'drawable-nodpi', 'ic_launcher_monochrome.png'));
let patched = 0;
for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const f = join(res, 'mipmap-anydpi-v26', name);
  if (!existsSync(f)) continue;
  let xml = readFileSync(f, 'utf8');
  if (xml.includes('<monochrome') || !xml.includes('</adaptive-icon>')) continue;
  xml = xml.replace('</adaptive-icon>', '    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />\n</adaptive-icon>');
  writeFileSync(f, xml); patched++;
}
console.log(`patch-icons: monochrome layer added to ${patched} launcher file(s)`);
