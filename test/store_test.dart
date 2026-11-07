import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/data/dhikr_data.dart';
import 'package:noor/core/data/reflections.dart';
import 'package:noor/core/data/salah_guide.dart';
import 'package:noor/core/models.dart';
import 'package:noor/core/store.dart';
import 'package:noor/core/util.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final store = NoorStore.instance;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await store.load();
    await store.clearAll();
  });

  String today() => dateKey(DateTime.now());

  group('dhikr sessions — quantity only after the session ends', () {
    test('count is not recorded anywhere until the session ends', () {
      store.selectPreset('subhanallah');
      store.startSession(store.selectedPreset);
      for (var i = 0; i < 32; i++) {
        expect(store.tap(), TapResult.counted);
      }
      expect(store.hasActive, isTrue);
      expect(store.countOn(today()), 0, reason: 'no completed quantity while counting');
      expect(store.sessions, isEmpty);
      expect(store.tap(), TapResult.sessionDone);
      final rec = store.endSession()!;
      expect(rec.count, 33);
      expect(rec.targetMet, isTrue);
      expect(store.countOn(today()), 33);
      expect(store.sessionsOn(today()), 1);
      expect(store.hasActive, isFalse);
    });

    test('post-prayer set chains 33 → 33 → 34', () {
      store.selectPreset('post_prayer');
      store.startSession(store.selectedPreset);
      var results = <TapResult>[];
      for (var i = 0; i < 100; i++) {
        results.add(store.tap());
      }
      expect(results[32], TapResult.stepDone);
      expect(results[65], TapResult.stepDone);
      expect(results[99], TapResult.sessionDone);
      expect(results.where((r) => r == TapResult.stepDone).length, 2);
      final rec = store.endSession()!;
      expect(rec.count, 100);
      expect(rec.target, 100);
    });

    test('ending early records what was counted; zero taps records nothing', () {
      store.startSession(store.selectedPreset);
      for (var i = 0; i < 5; i++) {
        store.tap();
      }
      final rec = store.endSession()!;
      expect(rec.count, 5);
      expect(rec.targetMet, isFalse);

      store.startSession(store.selectedPreset);
      expect(store.endSession(), isNull);
      expect(store.sessions.length, 1);
    });

    test('target override applies to single dhikr', () {
      store.setTarget('istighfar', 7);
      store.selectPreset('istighfar');
      store.startSession(store.selectedPreset);
      for (var i = 0; i < 6; i++) {
        store.tap();
      }
      expect(store.tap(), TapResult.sessionDone);
    });

    test('preset cannot change mid-session; discard drops the count', () {
      store.selectPreset('istighfar');
      store.startSession(store.selectedPreset);
      store.tap();
      store.selectPreset('tahlil');
      expect(store.selectedPresetId, 'istighfar');
      store.discardSession();
      expect(store.hasActive, isFalse);
      expect(store.sessions, isEmpty);
    });
  });

  group('custom dhikr', () {
    test('create, use, edit, delete', () {
      final c = CustomDhikr(id: store.newId(), name: 'Rabbi yassir', target: 21);
      store.saveCustom(c);
      expect(store.presetById(c.id).name, 'Rabbi yassir');
      expect(store.presetById(c.id).custom, isTrue);
      expect(store.targetsFor(store.presetById(c.id)), [21]);
      store.saveCustom(CustomDhikr(id: c.id, name: 'Rabbi yassir', arabic: 'رَبِّ يَسِّرْ', target: 40));
      expect(store.customs.length, 1);
      expect(store.presetById(c.id).arabic, 'رَبِّ يَسِّرْ');
      store.selectPreset(c.id);
      store.deleteCustom(c.id);
      expect(store.customs, isEmpty);
      expect(store.selectedPresetId, dhikrPresets.first.id);
    });
  });

  group('persistence', () {
    test('finished sessions and the in-progress session survive a restart', () async {
      store.selectPreset('subhanallah');
      store.startSession(store.selectedPreset);
      for (var i = 0; i < 33; i++) {
        store.tap();
      }
      store.endSession();
      store.startSession(store.selectedPreset);
      for (var i = 0; i < 3; i++) {
        store.tap();
      }
      store.update(() => store.method = 'mwl');
      store.update(() => store.madhab = 'shafi');
      await store.flush();

      // simulate a cold start
      store.sessions = [];
      store.active = null;
      store.method = 'karachi';
      store.madhab = 'hanafi';
      await store.load();

      expect(store.sessions.length, 1);
      expect(store.sessions.first.count, 33);
      expect(store.active, isNotNull);
      expect(store.active!.total, 3);
      expect(store.method, 'mwl');
      expect(store.madhab, 'shafi');
    });
  });

  group('routines and streaks', () {
    test('both routines complete the day', () {
      store.toggleRoutine('morning');
      expect(store.goalDays, isEmpty);
      store.toggleRoutine('evening');
      expect(store.goalDays, contains(today()));
      expect(store.streaks.current, 1);
      store.toggleRoutine('evening');
      expect(store.goalDays, isEmpty);
    });
  });

  group('backup and V3 import', () {
    const v3 = '''
{"counts":{"SubhanAllah":33},"sessions":[{"date":"2026-11-01","dhikr":"SubhanAllah","count":33,"target":33,"at":"2026-11-01T10:00:00.000Z"}],
 "days":{"2026-11-01":{"counts":33,"sessions":1,"goalComplete":true}},
 "completed":{"2026-11-01":{"morning":true,"evening":true}},"streak":1,"best":1,"selected":"subhanallah","count":0,"target":33}
''';

    test('V3 export is merged, and importing twice does not duplicate', () {
      expect(store.importJson(v3), isNull);
      expect(store.sessions.length, 1);
      expect(store.sessions.first.name, 'SubhanAllah');
      expect(store.sessions.first.count, 33);
      expect(store.routineDone('2026-11-01', 'morning'), isTrue);
      expect(store.goalDays, contains('2026-11-01'));
      expect(store.importJson(v3), isNull);
      expect(store.sessions.length, 1);
      expect(store.lastImportAdded, 0);
    });

    test('rejects garbage', () {
      expect(store.importJson('not json'), isNotNull);
      expect(store.importJson('{"hello": 1}'), isNotNull);
      expect(store.importJson('[1,2]'), isNotNull);
    });

    test('V5 backup round-trips', () {
      store.startSession(store.selectedPreset);
      for (var i = 0; i < 4; i++) {
        store.tap();
      }
      store.endSession();
      store.toggleRoutine('morning');
      store.saveCustom(CustomDhikr(id: 'c1', name: 'Mine', target: 9));
      final backup = store.exportJson();
      store.clearAll();
      expect(store.sessions, isEmpty);
      expect(store.importJson(backup), isNull);
      expect(store.sessions.length, 1);
      expect(store.sessions.first.count, 4);
      expect(store.routineDone(today(), 'morning'), isTrue);
      expect(store.customs.single.name, 'Mine');
    });
  });

  group('content integrity', () {
    test('presets: unique ids, Arabic present, positive targets', () {
      expect(dhikrPresets.map((p) => p.id).toSet().length, dhikrPresets.length);
      expect(dhikrPresets.length, greaterThanOrEqualTo(9));
      for (final p in dhikrPresets) {
        expect(p.steps.every((s) => s.arabic.isNotEmpty && s.target > 0), isTrue, reason: p.id);
      }
      expect(findBuiltInPreset('post_prayer')!.isSet, isTrue);
      for (final id in const ['istighfar', 'subhanallah', 'alhamdulillah', 'allahuakbar', 'hawqala']) {
        expect(findBuiltInPreset(id), isNotNull, reason: 'V3 preset $id must survive');
      }
    });

    test('every dhikr gets a Quranic reflection', () {
      for (final p in dhikrPresets) {
        final r = reflectionFor(p.id, 7);
        expect(r.arabic.isNotEmpty && r.translation.isNotEmpty, isTrue);
        expect(r.reference, startsWith('Quran '));
      }
      expect(reflections.map((r) => r.reference).toSet().length, reflections.length, reason: 'no duplicate verses');
    });

    test('V3 Salah guide is complete', () {
      expect(salahGuide.length, 12);
      expect(salahGuide.first.latin, 'Allāhu akbar');
    });
  });
}
