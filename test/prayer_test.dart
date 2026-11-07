import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/prayer.dart';

const _noAdjust = {'fajr': 0, 'dhuhr': 0, 'asr': 0, 'maghrib': 0, 'isha': 0};

PrayerConfig _cfg({String method = 'karachi', String madhab = 'hanafi', Map<String, int> adjust = _noAdjust}) =>
    PrayerConfig(method, madhab, 'middle', adjust);

Map<String, DateTime> _times(PrayerConfig c) => {
      for (final e in PrayerService.computeDay(21.4225, 39.8262, DateTime(2026, 11, 6), c)) e.key: e.time
    };

List<PrayerEntry> _syntheticDay(DateTime d) => [
      PrayerEntry('fajr', DateTime(d.year, d.month, d.day, 5, 0)),
      PrayerEntry('sunrise', DateTime(d.year, d.month, d.day, 6, 15)),
      PrayerEntry('dhuhr', DateTime(d.year, d.month, d.day, 12, 30)),
      PrayerEntry('asr', DateTime(d.year, d.month, d.day, 15, 45)),
      PrayerEntry('maghrib', DateTime(d.year, d.month, d.day, 18, 20)),
      PrayerEntry('isha', DateTime(d.year, d.month, d.day, 19, 45)),
    ];

PrayerState? _at(DateTime now) => resolvePrayerState(
      now,
      _syntheticDay(DateTime(2026, 11, 5)),
      _syntheticDay(DateTime(2026, 11, 6)),
      _syntheticDay(DateTime(2026, 11, 7)),
    );

void main() {
  group('calculation honours settings', () {
    test('six timings are in chronological order', () {
      final t = _times(_cfg());
      final order = [t['fajr']!, t['sunrise']!, t['dhuhr']!, t['asr']!, t['maghrib']!, t['isha']!];
      for (var i = 1; i < order.length; i++) {
        expect(order[i].isAfter(order[i - 1]), isTrue, reason: 'timing $i should follow ${i - 1}');
      }
    });

    test('Hanafi Asr is later than Shafi‘i Asr; other prayers are unchanged', () {
      final h = _times(_cfg(madhab: 'hanafi')), s = _times(_cfg(madhab: 'shafi'));
      expect(h['asr']!.isAfter(s['asr']!), isTrue);
      expect(h['dhuhr'], s['dhuhr']);
      expect(h['maghrib'], s['maghrib']);
      expect(h['fajr'], s['fajr']);
    });

    test('calculation method changes Fajr/Isha', () {
      final karachi = _times(_cfg(method: 'karachi'));
      final mwl = _times(_cfg(method: 'mwl'));
      final egypt = _times(_cfg(method: 'egyptian'));
      expect(karachi['isha']!.isAfter(mwl['isha']!), isTrue, reason: 'Isha 18° is later than 17°');
      expect(egypt['fajr']!.isBefore(karachi['fajr']!), isTrue, reason: 'Fajr 19.5° is earlier than 18°');
    });

    test('minute adjustments shift exactly that prayer', () {
      final base = _times(_cfg());
      final adj = _times(_cfg(adjust: {..._noAdjust, 'dhuhr': 10, 'isha': -5}));
      expect(adj['dhuhr']!.difference(base['dhuhr']!).inMinutes, 10);
      expect(adj['isha']!.difference(base['isha']!).inMinutes, -5);
      expect(adj['fajr'], base['fajr']);
    });

    test('config signature changes whenever a setting changes', () {
      final a = _cfg().signature;
      expect(_cfg(method: 'mwl').signature, isNot(a));
      expect(_cfg(madhab: 'shafi').signature, isNot(a));
      expect(_cfg(adjust: {..._noAdjust, 'asr': 1}).signature, isNot(a));
    });
  });

  group('resolvePrayerState', () {
    test('between Isha and next Fajr: next is tomorrow Fajr', () {
      final now = DateTime(2026, 11, 6, 22, 0);
      final s = _at(now)!;
      expect(s.next.key, 'fajr');
      expect(s.next.time, DateTime(2026, 11, 7, 5, 0));
      expect(s.current!.key, 'isha');
      expect(s.remaining(now), const Duration(hours: 7));
    });

    test('before Fajr: next is today Fajr, current is last night’s Isha', () {
      final s = _at(DateTime(2026, 11, 6, 3, 0))!;
      expect(s.next.key, 'fajr');
      expect(s.next.time.day, 6);
      expect(s.current!.key, 'isha');
      expect(s.current!.time.day, 5);
    });

    test('Fajr window: current Fajr, next Dhuhr (sunrise is never "next")', () {
      final s = _at(DateTime(2026, 11, 6, 5, 30))!;
      expect(s.current!.key, 'fajr');
      expect(s.next.key, 'dhuhr');
    });

    test('after sunrise: no current prayer, next Dhuhr', () {
      final s = _at(DateTime(2026, 11, 6, 9, 0))!;
      expect(s.current, isNull);
      expect(s.next.key, 'dhuhr');
    });

    test('exactly at a prayer time that prayer becomes current', () {
      final s = _at(DateTime(2026, 11, 6, 12, 30))!;
      expect(s.current!.key, 'dhuhr');
      expect(s.next.key, 'asr');
    });

    test('progress stays within 0..1 and rises through a segment', () {
      final a = DateTime(2026, 11, 6, 13, 0), b = DateTime(2026, 11, 6, 15, 0);
      final pa = _at(a)!.progress(a), pb = _at(b)!.progress(b);
      expect(pa, inInclusiveRange(0.0, 1.0));
      expect(pb, greaterThan(pa));
    });
  });
}
