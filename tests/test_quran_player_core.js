'use strict';
const assert = require('assert');
const c = require('../www/quran-player-core.js');
const T0 = 1_000_000;

// sleep timer
assert.strictEqual(c.sleepStart('off', T0), null);
assert.strictEqual(c.sleepStart('nonsense', T0), null);
const t15 = c.sleepStart('15', T0);
assert.deepStrictEqual(t15, { id: '15', kind: 'time', endsAt: T0 + 15 * 60000 });
assert.strictEqual(c.sleepRemainingMs(t15, T0 + 60000), 14 * 60000);
assert.strictEqual(c.sleepRemainingMs(t15, T0 + 99 * 60000), 0);
assert.strictEqual(c.sleepLabel(t15, T0), '15:00');
assert.strictEqual(c.sleepLabel(c.sleepStart('60', T0), T0), '1:00:00');
assert.strictEqual(c.sleepLabel(null, T0), 'Sleep');
assert.strictEqual(c.sleepShouldFire(t15, 'tick', T0 + 14 * 60000), false);
assert.strictEqual(c.sleepShouldFire(t15, 'tick', T0 + 15 * 60000), true);
assert.strictEqual(c.sleepShouldFire(t15, 'ayah-end', T0 + 99 * 60000), false, 'a time timer ignores ayah ends');
const ay = c.sleepStart('ayah', T0), su = c.sleepStart('surah', T0);
assert.strictEqual(c.sleepShouldFire(ay, 'ayah-end', T0), true);
assert.strictEqual(c.sleepShouldFire(ay, 'surah-end', T0), false);
assert.strictEqual(c.sleepShouldFire(ay, 'tick', T0 + 1e9), false);
assert.strictEqual(c.sleepShouldFire(su, 'surah-end', T0), true);
assert.strictEqual(c.sleepShouldFire(su, 'ayah-end', T0), false);
assert.strictEqual(c.sleepShouldFire(null, 'tick', T0), false);
assert.strictEqual(c.SLEEP_OPTIONS.length, 9);

// repeat
assert.deepStrictEqual(['off', 'ayah', 'surah', 'off'], ['off', c.nextRepeat('off'), c.nextRepeat(c.nextRepeat('off')), c.nextRepeat('surah')]);
assert.strictEqual(c.afterAyahEnd({ repeat: 'ayah', playMode: 'surah', index: 3, length: 7 }), 'replay');
assert.strictEqual(c.afterAyahEnd({ repeat: 'ayah', playMode: 'single', index: 0, length: 1 }), 'replay');
assert.strictEqual(c.afterAyahEnd({ repeat: 'off', playMode: 'single', index: 0, length: 1 }), 'finish');
assert.strictEqual(c.afterAyahEnd({ repeat: 'off', playMode: 'surah', index: 2, length: 7 }), 'next');
assert.strictEqual(c.afterAyahEnd({ repeat: 'off', playMode: 'surah', index: 6, length: 7 }), 'nextSurah');
assert.strictEqual(c.afterAyahEnd({ repeat: 'surah', playMode: 'surah', index: 6, length: 7 }), 'restart');
assert.strictEqual(c.afterAyahEnd({ repeat: 'surah', playMode: 'surah', index: 1, length: 7 }), 'next');

// time + wave
assert.strictEqual(c.remainingText(125, 5), '-2:00');
assert.strictEqual(c.remainingText(NaN, 5), '-0:00');
assert.strictEqual(c.remainingText(10, 99), '-0:00');
const wp = c.wavePath(300, 20, 3, 26);
assert(wp.startsWith('M0 10') && wp.includes('L300 ') && !/NaN/.test(wp));

// ambient manifest: only well-formed, safe entries
const parsed = c.parseAmbientManifest({ sounds: [
  { id: 'rain', name: 'Rain', file: 'rain.mp3', icon: 'rain', volume: 2 },
  { id: 'birds', name: 'Birds', file: 'ambient/birds.ogg', icon: 'weird', credit: 'CC0' },
  { id: 'bad id', name: 'x', file: 'a.mp3' },
  { id: 'evil', name: 'Evil', file: '../secret.mp3' },
  { id: 'abs', name: 'Abs', file: '/etc/passwd.mp3' },
  { id: 'exe', name: 'Exe', file: 'x.exe' },
  { id: 'rain', name: 'Dup', file: 'dup.mp3' },
  null, 'str'
] });
assert.deepStrictEqual(parsed.sounds.map(s => s.id), ['rain', 'birds']);
assert.strictEqual(parsed.sounds[0].volume, 1);
assert.strictEqual(parsed.sounds[0].file, 'ambient/rain.mp3');
assert.strictEqual(parsed.sounds[1].file, 'ambient/birds.ogg');
assert.strictEqual(parsed.sounds[1].icon, 'night');
assert.deepStrictEqual(c.parseAmbientManifest(null).sounds, []);
assert.deepStrictEqual(c.parseAmbientManifest({ sounds: 5 }).sounds, []);
console.log('Quran player core: all assertions passed.');
