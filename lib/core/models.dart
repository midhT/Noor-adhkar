import 'data/dhikr_data.dart';

class CustomDhikr {
  final String id, name, arabic, meaning;
  final int target;
  const CustomDhikr({required this.id, required this.name, this.arabic = '', this.meaning = '', required this.target});

  DhikrPreset toPreset() => DhikrPreset(
        id, 'Custom', 'Your personal remembrance',
        [DhikrStep(arabic.isEmpty ? 'ذِكْر' : arabic, name, meaning.isEmpty ? 'Your personal remembrance' : meaning, target)],
        custom: true,
      );

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'arabic': arabic, 'meaning': meaning, 'target': target};

  static CustomDhikr? fromJson(Object? j) {
    if (j is! Map) return null;
    final id = j['id'], name = j['name'];
    if (id is! String || name is! String || name.trim().isEmpty) return null;
    return CustomDhikr(
      id: id, name: name,
      arabic: j['arabic'] is String ? j['arabic'] as String : '',
      meaning: j['meaning'] is String ? j['meaning'] as String : '',
      target: j['target'] is num ? (j['target'] as num).toInt().clamp(1, 100000) : 100,
    );
  }
}

/// A finished dhikr session. Quantity is only ever shown from these records.
class SessionRecord {
  final String id, dhikrId, name, reflectionRef;
  final int count, target, seconds;
  final DateTime at;
  final String note;
  const SessionRecord({
    required this.id, required this.dhikrId, required this.name, required this.count,
    required this.target, required this.at, this.seconds = 0, this.note = '', this.reflectionRef = '',
  });

  bool get targetMet => count >= target;

  SessionRecord withNote(String n) => SessionRecord(
      id: id, dhikrId: dhikrId, name: name, count: count, target: target, at: at,
      seconds: seconds, note: n, reflectionRef: reflectionRef);

  Map<String, dynamic> toJson() => {
        'id': id, 'dhikrId': dhikrId, 'name': name, 'count': count, 'target': target,
        'at': at.toIso8601String(), 'seconds': seconds, 'note': note, 'reflectionRef': reflectionRef,
      };

  static SessionRecord? fromJson(Object? j) {
    if (j is! Map) return null;
    final at = DateTime.tryParse('${j['at']}');
    final count = j['count'];
    if (at == null || count is! num) return null;
    return SessionRecord(
      id: j['id'] is String ? j['id'] as String : 's${at.microsecondsSinceEpoch}',
      dhikrId: j['dhikrId'] is String ? j['dhikrId'] as String : '',
      name: j['name'] is String ? j['name'] as String : (j['dhikr'] is String ? j['dhikr'] as String : 'Dhikr'),
      count: count.toInt(),
      target: j['target'] is num ? (j['target'] as num).toInt() : count.toInt(),
      at: at.toLocal(),
      seconds: j['seconds'] is num ? (j['seconds'] as num).toInt() : 0,
      note: j['note'] is String ? j['note'] as String : '',
      reflectionRef: j['reflectionRef'] is String ? j['reflectionRef'] as String : '',
    );
  }
}

/// The unfinished session. Its count is persisted but never displayed while counting.
class ActiveSession {
  final String presetId;
  final List<int> targets; // per-step targets snapshot
  int step;
  int stepCount;
  int total;
  final int startedMs;
  ActiveSession({
    required this.presetId, required this.targets, this.step = 0, this.stepCount = 0,
    this.total = 0, required this.startedMs,
  });

  int get currentTarget => targets[step];
  int get totalTarget => targets.fold(0, (a, b) => a + b);

  Map<String, dynamic> toJson() => {
        'presetId': presetId, 'targets': targets, 'step': step, 'stepCount': stepCount,
        'total': total, 'startedMs': startedMs,
      };

  static ActiveSession? fromJson(Object? j) {
    if (j is! Map || j['presetId'] is! String || j['targets'] is! List) return null;
    final t = (j['targets'] as List).whereType<num>().map((e) => e.toInt()).toList();
    if (t.isEmpty) return null;
    final step = (j['step'] is num ? (j['step'] as num).toInt() : 0).clamp(0, t.length - 1);
    return ActiveSession(
      presetId: j['presetId'] as String, targets: t, step: step,
      stepCount: j['stepCount'] is num ? (j['stepCount'] as num).toInt() : 0,
      total: j['total'] is num ? (j['total'] as num).toInt() : 0,
      startedMs: j['startedMs'] is num ? (j['startedMs'] as num).toInt() : DateTime.now().millisecondsSinceEpoch,
    );
  }
}

class FocusRecord {
  final DateTime at;
  final int plannedMinutes, actualSeconds;
  final String purpose;
  final bool completed;
  const FocusRecord({required this.at, required this.plannedMinutes, required this.actualSeconds, required this.purpose, required this.completed});

  Map<String, dynamic> toJson() => {
        'at': at.toIso8601String(), 'planned': plannedMinutes, 'seconds': actualSeconds,
        'purpose': purpose, 'completed': completed,
      };

  static FocusRecord? fromJson(Object? j) {
    if (j is! Map) return null;
    final at = DateTime.tryParse('${j['at']}');
    if (at == null) return null;
    return FocusRecord(
      at: at.toLocal(),
      plannedMinutes: j['planned'] is num ? (j['planned'] as num).toInt() : 0,
      actualSeconds: j['seconds'] is num ? (j['seconds'] as num).toInt() : 0,
      purpose: j['purpose'] is String ? j['purpose'] as String : '',
      completed: j['completed'] == true,
    );
  }
}
