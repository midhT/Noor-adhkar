import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/prayer.dart';
import 'package:noor/core/reminders.dart';

List<PrayerEntry> _day(DateTime d) => [
      PrayerEntry('fajr', DateTime(d.year, d.month, d.day, 5, 0)),
      PrayerEntry('sunrise', DateTime(d.year, d.month, d.day, 6, 15)),
      PrayerEntry('dhuhr', DateTime(d.year, d.month, d.day, 12, 30)),
      PrayerEntry('asr', DateTime(d.year, d.month, d.day, 15, 45)),
      PrayerEntry('maghrib', DateTime(d.year, d.month, d.day, 18, 20)),
      PrayerEntry('isha', DateTime(d.year, d.month, d.day, 19, 45)),
    ];

const _all = {'fajr': true, 'dhuhr': true, 'asr': true, 'maghrib': true, 'isha': true};

List<PlannedReminder> _plan({
  Map<String, bool> enabled = _all,
  int lead = 0,
  Map<String, String> jamaat = const {},
  bool jamaatOn = true,
}) {
  final start = DateTime(2026, 11, 6);
  return planReminders(
    now: DateTime(2026, 11, 6, 10, 0),
    startDate: start,
    days: [_day(start), _day(DateTime(2026, 11, 7))],
    enabled: enabled, leadMinutes: lead, jamaat: jamaat, jamaatRemind: jamaatOn,
  );
}

void main() {
  test('only future prayers are planned; sunrise is never a reminder', () {
    final p = _plan();
    // day 0: dhuhr, asr, maghrib, isha (fajr already passed) + day 1: five prayers
    expect(p.length, 9);
    expect(p.every((r) => r.when.isAfter(DateTime(2026, 11, 6, 10, 0))), isTrue);
    expect(p.any((r) => r.title.contains('Sunrise')), isFalse);
  });

  test('lead-time reminders fire before the prayer', () {
    final p = _plan(lead: 10);
    final leads = p.where((r) => r.kind == 'lead').toList();
    expect(leads.length, 9);
    final dhuhrLead = leads.firstWhere((r) => r.title.startsWith('Dhuhr'));
    expect(dhuhrLead.when, DateTime(2026, 11, 6, 12, 20));
  });

  test('a lead time that has already passed is skipped', () {
    final p = _plan(lead: 30);
    // Dhuhr at 12:30 → 12:00 still future; nothing with fajr today (05:00 passed)
    expect(p.where((r) => r.kind == 'lead' && r.when.day == 6).length, 4);
  });

  test('muted prayers are skipped', () {
    final p = _plan(enabled: {..._all, 'isha': false});
    expect(p.any((r) => r.title.contains('Isha')), isFalse);
  });

  test('jamaat reminders use the saved clock time and can be switched off', () {
    final on = _plan(jamaat: {'asr': '16:00', 'isha': 'oops'});
    final j = on.where((r) => r.kind == 'jamaat').toList();
    expect(j.length, 2); // asr today and tomorrow; invalid isha ignored
    expect(j.first.when, DateTime(2026, 11, 6, 16, 0));
    final off = _plan(jamaat: {'asr': '16:00'}, jamaatOn: false);
    expect(off.any((r) => r.kind == 'jamaat'), isFalse);
  });

  test('ids are unique and stable, so rescheduling replaces instead of duplicating', () {
    final a = _plan(lead: 10, jamaat: {'asr': '16:00'});
    final b = _plan(lead: 10, jamaat: {'asr': '16:00'});
    expect(a.map((r) => r.id).toSet().length, a.length);
    expect(a.map((r) => r.id).toList(), b.map((r) => r.id).toList());
    expect(a.every((r) => r.id >= kReminderBaseId && r.id < kReminderBaseId + kReminderDays * kReminderSlots), isTrue);
  });
}
