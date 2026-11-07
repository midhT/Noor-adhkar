import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/streaks.dart';
import 'package:noor/core/util.dart';

void main() {
  group('computeStreaks', () {
    final today = DateTime(2026, 11, 6);
    String k(int daysAgo) => dateKey(dayOffset(today, -daysAgo));

    test('no completed days', () {
      final r = computeStreaks({}, today);
      expect(r.current, 0);
      expect(r.best, 0);
    });

    test('three consecutive days ending today', () {
      final r = computeStreaks({k(0), k(1), k(2)}, today);
      expect(r.current, 3);
      expect(r.best, 3);
    });

    test('streak stays alive when only yesterday is complete', () {
      final r = computeStreaks({k(1), k(2)}, today);
      expect(r.current, 2);
    });

    test('streak is broken after a missed day, best is kept', () {
      final r = computeStreaks({k(5), k(4), k(3), k(0)}, today);
      expect(r.current, 1);
      expect(r.best, 3);
    });

    test('two days ago only is not a current streak', () {
      final r = computeStreaks({k(2)}, today);
      expect(r.current, 0);
      expect(r.best, 1);
    });

    test('runs across a daylight-saving change stay consecutive', () {
      final t = DateTime(2026, 3, 9);
      final days = {'2026-03-07', '2026-03-08', '2026-03-09'};
      expect(computeStreaks(days, t).current, 3);
    });
  });

  group('formatting', () {
    test('fmtCountdown', () {
      expect(fmtCountdown(const Duration(hours: 1, minutes: 2, seconds: 3)), '1:02:03');
      expect(fmtCountdown(const Duration(seconds: 75)), '01:15');
      expect(fmtCountdown(const Duration(seconds: -5)), '00:00');
    });

    test('fmtTime 12h and 24h', () {
      expect(fmtTime(DateTime(2026, 1, 1, 0, 5), use24h: false), '12:05 AM');
      expect(fmtTime(DateTime(2026, 1, 1, 12, 0), use24h: false), '12:00 PM');
      expect(fmtTime(DateTime(2026, 1, 1, 13, 30), use24h: false), '1:30 PM');
      expect(fmtTime(DateTime(2026, 1, 1, 13, 30), use24h: true), '13:30');
    });

    test('parseClock', () {
      expect(parseClock('5:07'), (5, 7));
      expect(parseClock('23:59'), (23, 59));
      expect(parseClock('24:00'), isNull);
      expect(parseClock('12:60'), isNull);
      expect(parseClock('abc'), isNull);
      expect(parseClock(null), isNull);
    });

    test('dayOfYear is zero-based and DST-safe', () {
      expect(dayOfYear(DateTime(2026, 1, 1)), 0);
      expect(dayOfYear(DateTime(2026, 3, 15)), 73);
      expect(dayOfYear(DateTime(2026, 12, 31)), 364);
    });
  });
}
