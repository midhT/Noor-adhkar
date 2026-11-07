import 'package:flutter/services.dart';
import 'store.dart';

String two(int n) => n.toString().padLeft(2, '0');

/// Local calendar day key, `yyyy-MM-dd`.
String dateKey(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${two(d.month)}-${two(d.day)}';

DateTime parseDateKey(String k) {
  final p = k.split('-');
  return DateTime(int.parse(p[0]), int.parse(p[1]), int.parse(p[2]));
}

DateTime dayOffset(DateTime d, int days) => DateTime(d.year, d.month, d.day + days);

/// `H:MM:SS` when an hour or more remains, otherwise `MM:SS`.
String fmtCountdown(Duration d) {
  final s = d.inSeconds < 0 ? 0 : d.inSeconds;
  final h = s ~/ 3600, m = (s % 3600) ~/ 60, sec = s % 60;
  return h > 0 ? '$h:${two(m)}:${two(sec)}' : '${two(m)}:${two(sec)}';
}

/// Wall-clock time for display. 12-hour unless [use24h].
String fmtTime(DateTime t, {bool? use24h}) {
  final is24 = use24h ?? NoorStore.instance.use24h;
  if (is24) return '${two(t.hour)}:${two(t.minute)}';
  final h = t.hour % 12 == 0 ? 12 : t.hour % 12;
  return '$h:${two(t.minute)} ${t.hour >= 12 ? 'PM' : 'AM'}';
}

String fmtClockString(String hhmm, {bool? use24h}) {
  final p = parseClock(hhmm);
  if (p == null) return hhmm;
  return fmtTime(DateTime(2000, 1, 1, p.$1, p.$2), use24h: use24h);
}

/// Parses `H:mm` / `HH:mm`; returns null when invalid.
(int, int)? parseClock(String? value) {
  if (value == null) return null;
  final m = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(value.trim());
  if (m == null) return null;
  final h = int.parse(m.group(1)!), mi = int.parse(m.group(2)!);
  if (h > 23 || mi > 59) return null;
  return (h, mi);
}

const _weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
String weekdayName(DateTime d) => _weekdays[d.weekday - 1];
String weekdayShort(DateTime d) => _weekdays[d.weekday - 1].substring(0, 2);
String prettyDate(DateTime d) => '${weekdayName(d)}, ${_months[d.month - 1]} ${d.day}';

/// Zero-based day of the year. Uses UTC so a daylight-saving change cannot shift the result by one.
int dayOfYear(DateTime d) => DateTime.utc(d.year, d.month, d.day).difference(DateTime.utc(d.year, 1, 1)).inDays;

String fmtMinutes(int totalMinutes) {
  if (totalMinutes < 60) return '$totalMinutes min';
  final h = totalMinutes ~/ 60, m = totalMinutes % 60;
  return m == 0 ? '$h h' : '$h h $m min';
}

void tapHaptic({bool strong = false}) {
  if (!NoorStore.instance.haptics) return;
  if (strong) {
    HapticFeedback.heavyImpact();
  } else {
    HapticFeedback.selectionClick();
  }
}
