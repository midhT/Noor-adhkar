import 'package:flutter/foundation.dart';
import 'package:home_widget/home_widget.dart';
import 'data/reflections.dart';
import 'prayer.dart';
import 'store.dart';
import 'util.dart';

/// Pushes data to the three Android home-screen widgets. The Salah widget receives the
/// next four days of timings, so its countdown and "next prayer" stay correct without
/// the app being opened. The Tasbeeh widget only ever shows *completed* (ended-session)
/// quantity, matching the in-app rule.
class NoorWidgets {
  static const _pkg = 'com.midhat.noor';
  static const tasbeeh = 'TasbeehWidgetProvider';
  static const salah = 'SalahWidgetProvider';
  static const verse = 'VerseWidgetProvider';

  static Future<void> pushAll() async {
    final s = NoorStore.instance;
    try {
      final now = DateTime.now();
      final today = dateKey(now);
      final sessionsToday = s.sessionsForDay(today);
      await HomeWidget.saveWidgetData<int>('tasbeeh_today', s.countOn(today));
      await HomeWidget.saveWidgetData<int>('tasbeeh_sessions', sessionsToday.length);
      await HomeWidget.saveWidgetData<String>(
          'tasbeeh_last', sessionsToday.isEmpty ? '' : sessionsToday.first.name);
      await HomeWidget.saveWidgetData<bool>('use24h', s.use24h);

      final lat = s.lat, lon = s.lon;
      var schedule = '';
      var place = '';
      if (lat != null && lon != null) {
        final cfg = PrayerConfig.fromStore(s);
        final buf = StringBuffer();
        for (var d = 0; d < 4; d++) {
          for (final e in PrayerService.computeDay(lat, lon, dayOffset(now, d), cfg)) {
            if (e.isSunrise) continue;
            buf.write('${e.name}|${e.time.millisecondsSinceEpoch};');
          }
        }
        schedule = buf.toString();
        place = s.placeName;
      }
      await HomeWidget.saveWidgetData<String>('prayer_schedule', schedule);
      await HomeWidget.saveWidgetData<String>('prayer_place', place);

      // Verse list: the widget picks today's entry itself, so it rolls over daily on its own.
      final verseBuf = StringBuffer();
      for (final r in reflections) {
        verseBuf.write('${r.arabic}\u0001${r.translation}\u0001${r.reference}\u0002');
      }
      await HomeWidget.saveWidgetData<String>('verse_list', verseBuf.toString());

      for (final name in [tasbeeh, salah, verse]) {
        await HomeWidget.updateWidget(androidName: name, qualifiedAndroidName: '$_pkg.$name');
      }
    } catch (e) {
      debugPrint('Noor widget update skipped: $e');
    }
  }
}
