import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;
import 'prayer_service.dart';
import 'storage.dart';

class NoorNotifications {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static const int _prayerBase = 1000;
  static const int _jamaatBase = 2000;

  static Future<void> initialize() async {
    tzdata.initializeTimeZones();
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _plugin.initialize(settings);
  }

  static Future<bool> requestPermission() async {
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    return await android?.requestNotificationsPermission() ?? false;
  }

  static Future<void> cancelAllPrayerReminders() async {
    for (var i = 0; i < 7 * 5; i++) {
      await _plugin.cancel(_prayerBase + i);
      await _plugin.cancel(_jamaatBase + i);
    }
  }

  /// Schedules the next seven days because prayer times shift each day.
  /// The app uses inexact alarms to avoid requiring special exact-alarm access.
  static Future<int> schedulePrayerReminders({
    required double latitude,
    required double longitude,
    bool includeJamaat = true,
  }) async {
    await cancelAllPrayerReminders();
    var scheduledCount = 0;
    final now = DateTime.now();

    for (var day = 0; day < 7; day++) {
      final date = DateTime(now.year, now.month, now.day + day);
      final prayerTimes = await PrayerService.calculateForDate(
        latitude: latitude, longitude: longitude, date: date);
      final prayerMap = <String, DateTime>{
        'Fajr': prayerTimes.fajr,
        'Dhuhr': prayerTimes.dhuhr,
        'Asr': prayerTimes.asr,
        'Maghrib': prayerTimes.maghrib,
        'Isha': prayerTimes.isha,
      };

      for (var i = 0; i < prayerMap.length; i++) {
        final entry = prayerMap.entries.elementAt(i);
        final prayerTime = entry.value;
        if (prayerTime.isAfter(now)) {
          await _scheduleAt(
            id: _prayerBase + day * 5 + i,
            title: 'Time for ${entry.key}',
            body: 'It is time for ${entry.key}.',
            dateTime: prayerTime,
          );
          scheduledCount++;
        }

        if (includeJamaat) {
          final jamaat = await NoorStorage.getJamaat(entry.key);
          final parsed = _parseClock(jamaat);
          if (parsed != null) {
            final jamaatTime = DateTime(date.year, date.month, date.day,
                parsed.$1, parsed.$2);
            if (jamaatTime.isAfter(now)) {
              await _scheduleAt(
                id: _jamaatBase + day * 5 + i,
                title: '${entry.key} Jamaat',
                body: 'Your saved mosque Jamaat time is approaching.',
                dateTime: jamaatTime,
              );
              scheduledCount++;
            }
          }
        }
      }
    }
    return scheduledCount;
  }

  static (int, int)? _parseClock(String? value) {
    if (value == null) return null;
    final match = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(value.trim());
    if (match == null) return null;
    final hour = int.tryParse(match.group(1)!);
    final minute = int.tryParse(match.group(2)!);
    if (hour == null || minute == null || hour < 0 || hour > 23 ||
        minute < 0 || minute > 59) {
      return null;
    }
    return (hour, minute);
  }

  static Future<void> _scheduleAt({
    required int id, required String title, required String body,
    required DateTime dateTime,
  }) async {
    final when = tz.TZDateTime.from(dateTime, tz.local);
    await _plugin.zonedSchedule(
      id, title, body, when,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'noor_prayer_reminders', 'Prayer reminders',
          channelDescription: 'Daily Salah and saved Jamaat reminders',
          importance: Importance.high, priority: Priority.high,
          playSound: true, enableVibration: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }
}
