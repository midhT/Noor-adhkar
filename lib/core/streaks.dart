import 'util.dart';

class StreakResult {
  final int current, best;
  const StreakResult(this.current, this.best);
}

int _dayDiff(DateTime a, DateTime b) =>
    DateTime.utc(b.year, b.month, b.day).difference(DateTime.utc(a.year, a.month, a.day)).inDays;

/// Streaks from the set of "goal complete" day keys (V3 rule: both routines done).
/// The current streak is still alive if today is not yet complete but yesterday was.
StreakResult computeStreaks(Set<String> goalDays, DateTime today) {
  if (goalDays.isEmpty) return const StreakResult(0, 0);
  final days = goalDays.map(parseDateKey).toList()..sort();
  var best = 0, run = 0;
  DateTime? prev;
  for (final d in days) {
    run = (prev != null && _dayDiff(prev, d) == 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  final t = DateTime(today.year, today.month, today.day);
  var cursor = goalDays.contains(dateKey(t)) ? t : dayOffset(t, -1);
  var current = 0;
  while (goalDays.contains(dateKey(cursor))) {
    current++;
    cursor = dayOffset(cursor, -1);
  }
  if (current > best) best = current;
  return StreakResult(current, best);
}

const streakMilestones = [3, 7, 10, 30, 50, 100];
