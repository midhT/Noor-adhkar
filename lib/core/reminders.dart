import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;
import 'prayer.dart';
import 'store.dart';
import 'util.dart';

class PlannedReminder {
  final int id;
  final String title, body, kind; // kind: prayer | lead | jamaat
  final DateTime when;
  const PlannedReminder(this.id, this.title, this.body, this.kind, this.when);
}

const int kReminderBaseId = 10000;
const int kReminderDays = 14;
const int kReminderSlots = 20; // per day: 0-4 prayer, 5-9 lead, 10-14 jamaat
const int kFocusNotificationId = 9001;

/// Pure planner. [days] holds the six timings for each consecutive day starting at
/// [startDate]. Only future times are planned. Same inputs always give the same ids,
/// so a reschedule replaces rather than duplicates.
List<PlannedReminder> planReminders({
  required DateTime now,
  required DateTime startDate,
  required List<List<PrayerEntry>> days,
  required Map<String, bool> enabled,
  required int leadMinutes,
  required Map<String, String> jamaat,
  required bool jamaatRemind,
  bool use24h = false,
}) {
  final out = <PlannedReminder>[];
  for (var d = 0; d < days.length; d++) {
    final date = dayOffset(startDate, d);
    final byKey = {for (final e in days[d]) e.key: e.time};
    for (var i = 0; i < kPrayerKeys5.length; i++) {
      final key = kPrayerKeys5[i];
      final t = byKey[key];
      if (t == null || enabled[key] == false) continue;
      final name = prayerLabels[key]!;
      final base = kReminderBaseId + d * kReminderSlots;
      if (t.isAfter(now)) {
        out.add(PlannedReminder(base + i, 'Time for $name', 'It is time for $name · ${fmtTime(t, use24h: use24h)}', 'prayer', t));
      }
      if (leadMinutes > 0) {
        final lt = t.subtract(Duration(minutes: leadMinutes));
        if (lt.isAfter(now)) {
          out.add(PlannedReminder(base + 5 + i, '$name in $leadMinutes minutes',
              '$name is at ${fmtTime(t, use24h: use24h)}', 'lead', lt));
        }
      }
      if (jamaatRemind) {
        final c = parseClock(jamaat[key]);
        if (c != null) {
          final jt = DateTime(date.year, date.month, date.day, c.$1, c.$2);
          if (jt.isAfter(now)) {
            out.add(PlannedReminder(base + 10 + i, '$name Jamaat',
                'Jamaat is at ${fmtTime(jt, use24h: use24h)}', 'jamaat', jt));
          }
        }
      }
    }
  }
  return out;
}

class ReminderStatus {
  final int count;
  final bool exact;
  final String message;
  const ReminderStatus(this.count, this.exact, this.message);
}

class NoorReminders {
  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;
  static final ValueNotifier<ReminderStatus> status =
      ValueNotifier(const ReminderStatus(0, false, 'Reminders are off.'));

  static const _prayerChannel = AndroidNotificationDetails(
    'noor_prayer_v5', 'Prayer reminders',
    channelDescription: 'Salah, lead-time and Jamaat reminders',
    importance: Importance.high, priority: Priority.high,
    icon: 'ic_stat_noor', category: AndroidNotificationCategory.reminder,
  );
  static const _focusChannel = AndroidNotificationDetails(
    'noor_focus_v5', 'Focus sessions',
    channelDescription: 'Tells you when a Focus Studio session ends',
    importance: Importance.defaultImportance, priority: Priority.defaultPriority,
    icon: 'ic_stat_noor',
  );

  static AndroidFlutterLocalNotificationsPlugin? get _android =>
      _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

  static Future<void> initialize() async {
    if (_ready) return;
    tzdata.initializeTimeZones();
    const settings = InitializationSettings(android: AndroidInitializationSettings('ic_stat_noor'));
    await _plugin.initialize(settings);
    _ready = true;
  }

  static Future<bool> notificationsAllowed() async {
    try {
      return await _android?.areNotificationsEnabled() ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestNotificationPermission() async {
    try {
      return await _android?.requestNotificationsPermission() ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> exactAlarmsAllowed() async {
    try {
      return await _android?.canScheduleExactNotifications() ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Opens the system "Alarms & reminders" screen on Android 12+.
  static Future<void> requestExactAlarms() async {
    try {
      await _android?.requestExactAlarmsPermission();
    } catch (_) {}
  }

  static Future<void> cancelPrayerReminders() async {
    // Current id range plus the V4 ranges, so upgrading never leaves stray alarms.
    for (var i = 0; i < kReminderDays * kReminderSlots; i++) {
      await _plugin.cancel(kReminderBaseId + i);
    }
    for (var i = 0; i < 35; i++) {
      await _plugin.cancel(1000 + i);
      await _plugin.cancel(2000 + i);
    }
  }

  static Future<void> _schedule(PlannedReminder r, bool exact, NotificationDetails details) {
    return _plugin.zonedSchedule(
      r.id, r.title, r.body, tz.TZDateTime.from(r.when, tz.local), details,
      androidScheduleMode: exact ? AndroidScheduleMode.exactAllowWhileIdle : AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  /// Rebuilds the whole rolling schedule from current settings. Safe to call any time:
  /// app start, resume, and after every location / method / madhab / reminder change.
  static Future<ReminderStatus> sync() async {
    final s = NoorStore.instance;
    ReminderStatus done(ReminderStatus r) {
      status.value = r;
      return r;
    }

    try {
      await initialize();
      await cancelPrayerReminders();
      if (!s.remindersOn) return done(const ReminderStatus(0, false, 'Reminders are off.'));
      if (s.lat == null || s.lon == null) {
        return done(const ReminderStatus(0, false, 'Set your location to schedule reminders.'));
      }
      if (!await notificationsAllowed()) {
        return done(const ReminderStatus(0, false, 'Notifications are blocked for Noor in system settings.'));
      }
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day);
      final cfg = PrayerConfig.fromStore(s);
      final days = <List<PrayerEntry>>[
        for (var d = 0; d < kReminderDays; d++) PrayerService.computeDay(s.lat!, s.lon!, dayOffset(start, d), cfg)
      ];
      final plan = planReminders(
        now: now, startDate: start, days: days, enabled: s.remindPrayer,
        leadMinutes: s.leadMinutes, jamaat: s.jamaat, jamaatRemind: s.jamaatRemind, use24h: s.use24h,
      );
      final exact = await exactAlarmsAllowed();
      const details = NotificationDetails(android: _prayerChannel);
      for (final r in plan) {
        await _schedule(r, exact, details);
      }
      final until = plan.isEmpty ? '' : ' through ${prettyDate(plan.last.when)}';
      return done(ReminderStatus(
        plan.length, exact,
        '${plan.length} reminders scheduled$until.${exact ? '' : ' Exact alarms are not allowed, so alerts may arrive a few minutes late.'}',
      ));
    } catch (e) {
      debugPrint('Noor reminders sync failed: $e');
      return done(ReminderStatus(0, false, 'Could not schedule reminders: $e'));
    }
  }

  static Future<void> showTest() async {
    await initialize();
    await _plugin.show(9000, 'Noor test reminder', 'Prayer reminders can reach you on this device.',
        const NotificationDetails(android: _prayerChannel));
  }

  static Future<void> scheduleFocusEnd(DateTime when, int minutes) async {
    try {
      await initialize();
      if (!when.isAfter(DateTime.now()) || !await notificationsAllowed()) return;
      await _schedule(
          PlannedReminder(kFocusNotificationId, 'Focus session complete',
              'Your $minutes-minute session has ended. Take a quiet moment.', 'focus', when),
          await exactAlarmsAllowed(),
          const NotificationDetails(android: _focusChannel));
    } catch (e) {
      debugPrint('Noor focus notification failed: $e');
    }
  }

  static Future<void> cancelFocusEnd() async {
    try {
      await initialize();
      await _plugin.cancel(kFocusNotificationId);
    } catch (_) {}
  }
}
