import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'data/dhikr_data.dart';
import 'models.dart';
import 'streaks.dart';
import 'util.dart';

const kPrayerKeys5 = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const kFocusPurposes = ['Adhkar & remembrance', 'Qur’an reading', 'Learning Salah', 'Quiet reflection'];

enum TapResult { counted, stepDone, sessionDone }

/// Single source of truth. Settings + history persist as one JSON blob; the in-progress
/// dhikr session persists separately on every tap so a kill/restart never loses it.
class NoorStore extends ChangeNotifier {
  static final NoorStore instance = NoorStore._();
  NoorStore._();

  static const _kMain = 'noor_v5';
  static const _kActive = 'noor_v5_active';

  SharedPreferences? _prefs;
  bool loaded = false;
  Timer? _debounce;

  // appearance / feedback
  bool lightTheme = false, haptics = true, cosmos = true, use24h = false;

  // prayer
  String method = 'karachi', madhab = 'hanafi', highLat = 'middle';
  Map<String, int> adjust = {for (final k in kPrayerKeys5) k: 0};
  double? lat, lon;
  String placeName = '';

  // reminders
  bool remindersOn = false, jamaatRemind = true;
  Map<String, bool> remindPrayer = {for (final k in kPrayerKeys5) k: true};
  int leadMinutes = 0;
  Map<String, String> jamaat = {};

  // dhikr
  String selectedPresetId = 'istighfar';
  List<CustomDhikr> customs = [];
  Map<String, int> targetOverrides = {};
  ActiveSession? active;

  // history
  Map<String, Map<String, bool>> routines = {};
  List<SessionRecord> sessions = [];
  List<FocusRecord> focusRecords = [];

  // focus
  int focusMinutes = 10;
  String focusPurpose = kFocusPurposes.first;
  String focusState = 'idle'; // idle | running | paused
  int focusEndMs = 0, focusRemainSec = 0, focusPlannedSec = 0;

  // audio
  bool audioOn = false;
  String audioMode = 'pad'; // pad | file
  String audioPath = '', audioName = '';
  double audioVolume = .6;

  // ---------------------------------------------------------------- load / save
  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    _prefs = p;
    final raw = p.getString(_kMain);
    if (raw != null) {
      try {
        final j = jsonDecode(raw);
        if (j is Map) _apply(Map<String, dynamic>.from(j));
      } catch (e) {
        debugPrint('Noor: could not read saved state: $e');
      }
    } else {
      _migrateV4(p);
    }
    final a = p.getString(_kActive);
    if (a != null) {
      try {
        active = ActiveSession.fromJson(jsonDecode(a));
      } catch (_) {
        active = null;
      }
    }
    if (active != null && !_presetExists(active!.presetId)) active = null;
    loaded = true;
  }

  void _migrateV4(SharedPreferences p) {
    final m = p.getString('method');
    const v4 = {
      'Karachi': 'karachi', 'MuslimWorldLeague': 'mwl', 'Egyptian': 'egyptian',
      'UmmAlQura': 'umm_al_qura', 'NorthAmerica': 'north_america',
    };
    if (m != null && v4.containsKey(m)) method = v4[m]!;
    if (p.getString('asr') == 'Shafi') madhab = 'shafi';
    lat = double.tryParse(p.getString('latitude') ?? '');
    lon = double.tryParse(p.getString('longitude') ?? '');
    if (lat != null && lon != null) placeName = 'Saved coordinates';
    for (final k in kPrayerKeys5) {
      final cap = k[0].toUpperCase() + k.substring(1);
      final v = p.getString('jamaat_$cap');
      if (v != null && parseClock(v) != null) jamaat[k] = v.trim();
    }
  }

  static String _s(Map m, String k, String d) => m[k] is String ? m[k] as String : d;
  static bool _b(Map m, String k, bool d) => m[k] is bool ? m[k] as bool : d;
  static int _i(Map m, String k, int d) => m[k] is num ? (m[k] as num).toInt() : d;
  static double? _dn(Map m, String k) => m[k] is num ? (m[k] as num).toDouble() : null;

  void _apply(Map<String, dynamic> j) {
    lightTheme = _b(j, 'lightTheme', false);
    haptics = _b(j, 'haptics', true);
    cosmos = _b(j, 'cosmos', true);
    use24h = _b(j, 'use24h', false);
    method = _s(j, 'method', 'karachi');
    madhab = _s(j, 'madhab', 'hanafi');
    highLat = _s(j, 'highLat', 'middle');
    if (j['adjust'] is Map) {
      for (final k in kPrayerKeys5) {
        adjust[k] = _i(j['adjust'] as Map, k, 0).clamp(-60, 60);
      }
    }
    lat = _dn(j, 'lat');
    lon = _dn(j, 'lon');
    placeName = _s(j, 'placeName', '');
    remindersOn = _b(j, 'remindersOn', false);
    jamaatRemind = _b(j, 'jamaatRemind', true);
    leadMinutes = _i(j, 'leadMinutes', 0);
    if (j['remindPrayer'] is Map) {
      for (final k in kPrayerKeys5) {
        remindPrayer[k] = _b(j['remindPrayer'] as Map, k, true);
      }
    }
    if (j['jamaat'] is Map) {
      jamaat = {
        for (final e in (j['jamaat'] as Map).entries)
          if (e.value is String && parseClock(e.value as String) != null) '${e.key}': e.value as String
      };
    }
    selectedPresetId = _s(j, 'selectedPresetId', 'istighfar');
    customs = (j['customs'] is List)
        ? (j['customs'] as List).map(CustomDhikr.fromJson).whereType<CustomDhikr>().toList()
        : [];
    if (j['targetOverrides'] is Map) {
      targetOverrides = {
        for (final e in (j['targetOverrides'] as Map).entries)
          if (e.value is num) '${e.key}': (e.value as num).toInt()
      };
    }
    routines = {};
    if (j['routines'] is Map) {
      for (final e in (j['routines'] as Map).entries) {
        if (e.value is Map) {
          routines['${e.key}'] = {
            'morning': (e.value as Map)['morning'] == true,
            'evening': (e.value as Map)['evening'] == true,
          };
        }
      }
    }
    sessions = (j['sessions'] is List)
        ? (j['sessions'] as List).map(SessionRecord.fromJson).whereType<SessionRecord>().toList()
        : [];
    focusRecords = (j['focusRecords'] is List)
        ? (j['focusRecords'] as List).map(FocusRecord.fromJson).whereType<FocusRecord>().toList()
        : [];
    focusMinutes = _i(j, 'focusMinutes', 10).clamp(1, 240);
    focusPurpose = _s(j, 'focusPurpose', kFocusPurposes.first);
    focusState = _s(j, 'focusState', 'idle');
    if (focusState != 'running' && focusState != 'paused') focusState = 'idle';
    focusEndMs = _i(j, 'focusEndMs', 0);
    focusRemainSec = _i(j, 'focusRemainSec', 0);
    focusPlannedSec = _i(j, 'focusPlannedSec', focusMinutes * 60);
    audioOn = _b(j, 'audioOn', false);
    audioMode = _s(j, 'audioMode', 'pad') == 'file' ? 'file' : 'pad';
    audioPath = _s(j, 'audioPath', '');
    audioName = _s(j, 'audioName', '');
    audioVolume = (_dn(j, 'audioVolume') ?? .6).clamp(0.0, 1.0);
  }

  Map<String, dynamic> _toMap() => {
        'version': 5,
        'lightTheme': lightTheme, 'haptics': haptics, 'cosmos': cosmos, 'use24h': use24h,
        'method': method, 'madhab': madhab, 'highLat': highLat, 'adjust': adjust,
        'lat': lat, 'lon': lon, 'placeName': placeName,
        'remindersOn': remindersOn, 'jamaatRemind': jamaatRemind, 'leadMinutes': leadMinutes,
        'remindPrayer': remindPrayer, 'jamaat': jamaat,
        'selectedPresetId': selectedPresetId,
        'customs': customs.map((c) => c.toJson()).toList(),
        'targetOverrides': targetOverrides,
        'routines': routines,
        'sessions': sessions.map((s) => s.toJson()).toList(),
        'focusRecords': focusRecords.map((f) => f.toJson()).toList(),
        'focusMinutes': focusMinutes, 'focusPurpose': focusPurpose, 'focusState': focusState,
        'focusEndMs': focusEndMs, 'focusRemainSec': focusRemainSec, 'focusPlannedSec': focusPlannedSec,
        'audioOn': audioOn, 'audioMode': audioMode, 'audioPath': audioPath,
        'audioName': audioName, 'audioVolume': audioVolume,
      };

  Future<void> _writeNow() async {
    final p = _prefs;
    if (p == null) return;
    await p.setString(_kMain, jsonEncode(_toMap()));
  }

  /// Mutate state through this so listeners rebuild and the change is persisted.
  void update(void Function() change) {
    change();
    changed();
  }

  void changed() {
    notifyListeners();
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _writeNow);
  }

  Future<void> flush() async {
    _debounce?.cancel();
    await _writeNow();
  }

  Future<void> _saveActive() async {
    final p = _prefs;
    if (p == null) return;
    if (active == null) {
      await p.remove(_kActive);
    } else {
      await p.setString(_kActive, jsonEncode(active!.toJson()));
    }
  }

  // ---------------------------------------------------------------- dhikr
  bool _presetExists(String id) =>
      findBuiltInPreset(id) != null || customs.any((c) => c.id == id);

  DhikrPreset presetById(String id) {
    final b = findBuiltInPreset(id);
    if (b != null) return b;
    for (final c in customs) {
      if (c.id == id) return c.toPreset();
    }
    return dhikrPresets.first;
  }

  DhikrPreset get selectedPreset => presetById(selectedPresetId);

  List<DhikrPreset> get allPresets => [...customs.map((c) => c.toPreset()), ...dhikrPresets];

  /// Per-step targets the next session would use.
  List<int> targetsFor(DhikrPreset p) {
    if (p.isSet) return p.steps.map((s) => s.target).toList();
    return [targetOverrides[p.id] ?? p.first.target];
  }

  void selectPreset(String id) {
    if (active != null) return; // the preset cannot change mid-session
    update(() => selectedPresetId = id);
  }

  void setTarget(String presetId, int target) =>
      update(() => targetOverrides[presetId] = target.clamp(1, 10000));

  String newId() => 'c${DateTime.now().microsecondsSinceEpoch}';

  void saveCustom(CustomDhikr c) => update(() {
        final i = customs.indexWhere((x) => x.id == c.id);
        if (i >= 0) {
          customs[i] = c;
        } else {
          customs.insert(0, c);
        }
      });

  void deleteCustom(String id) => update(() {
        customs.removeWhere((c) => c.id == id);
        targetOverrides.remove(id);
        if (selectedPresetId == id) selectedPresetId = dhikrPresets.first.id;
      });

  bool get hasActive => active != null;

  void startSession(DhikrPreset p) {
    active = ActiveSession(
        presetId: p.id, targets: targetsFor(p), startedMs: DateTime.now().millisecondsSinceEpoch);
    _saveActive();
    notifyListeners();
  }

  /// Counts one repetition. Does not notify (the counter UI repaints itself) so a
  /// tap never rebuilds the whole app; the in-progress count is saved immediately.
  TapResult tap() {
    final a = active;
    if (a == null) return TapResult.counted;
    a.stepCount++;
    a.total++;
    var result = TapResult.counted;
    if (a.stepCount >= a.currentTarget) {
      if (a.step >= a.targets.length - 1) {
        result = TapResult.sessionDone;
      } else {
        a.step++;
        a.stepCount = 0;
        result = TapResult.stepDone;
      }
    }
    _saveActive();
    return result;
  }

  /// Finishes the session and stores it. Returns null if nothing was counted.
  SessionRecord? endSession({String reflectionRef = ''}) {
    final a = active;
    if (a == null) return null;
    active = null;
    _saveActive();
    if (a.total <= 0) {
      notifyListeners();
      return null;
    }
    final preset = presetById(a.presetId);
    final now = DateTime.now();
    final rec = SessionRecord(
      id: 's${now.microsecondsSinceEpoch}', dhikrId: a.presetId, name: preset.name,
      count: a.total, target: a.totalTarget, at: now,
      seconds: ((now.millisecondsSinceEpoch - a.startedMs) / 1000).round(),
      reflectionRef: reflectionRef,
    );
    sessions.add(rec);
    if (sessions.length > 3000) sessions = sessions.sublist(sessions.length - 3000);
    changed();
    return rec;
  }

  void discardSession() {
    active = null;
    _saveActive();
    notifyListeners();
  }

  void setSessionNote(String id, String note) => update(() {
        final i = sessions.indexWhere((s) => s.id == id);
        if (i >= 0) sessions[i] = sessions[i].withNote(note.trim());
      });

  void deleteSession(String id) => update(() => sessions.removeWhere((s) => s.id == id));

  // ---------------------------------------------------------------- aggregates
  int countOn(String key) =>
      sessions.where((s) => dateKey(s.at) == key).fold(0, (a, s) => a + s.count);
  int sessionsOn(String key) => sessions.where((s) => dateKey(s.at) == key).length;
  int get totalCount => sessions.fold(0, (a, s) => a + s.count);
  int focusMinutesOn(String key) =>
      (focusRecords.where((f) => dateKey(f.at) == key).fold(0, (a, f) => a + f.actualSeconds) / 60).round();
  int get totalFocusMinutes => (focusRecords.fold(0, (a, f) => a + f.actualSeconds) / 60).round();

  List<SessionRecord> sessionsForDay(String key) =>
      sessions.where((s) => dateKey(s.at) == key).toList().reversed.toList();

  // ---------------------------------------------------------------- routines / streaks
  bool routineDone(String key, String which) => routines[key]?[which] == true;

  void toggleRoutine(String which) => update(() {
        final k = dateKey(DateTime.now());
        final m = routines.putIfAbsent(k, () => {'morning': false, 'evening': false});
        m[which] = !(m[which] ?? false);
      });

  Set<String> get goalDays => {
        for (final e in routines.entries)
          if (e.value['morning'] == true && e.value['evening'] == true) e.key
      };

  StreakResult get streaks => computeStreaks(goalDays, DateTime.now());

  // ---------------------------------------------------------------- focus
  void addFocusRecord(FocusRecord r) {
    focusRecords.add(r);
    if (focusRecords.length > 2000) focusRecords = focusRecords.sublist(focusRecords.length - 2000);
  }

  // ---------------------------------------------------------------- backup
  String exportJson() => const JsonEncoder.withIndent('  ').convert({
        'app': 'noor',
        'version': 5,
        'exportedAt': DateTime.now().toIso8601String(),
        'customs': customs.map((c) => c.toJson()).toList(),
        'routines': routines,
        'sessions': sessions.map((s) => s.toJson()).toList(),
        'focusRecords': focusRecords.map((f) => f.toJson()).toList(),
      });

  /// Merges history from a Noor V5 backup or a V3 export. Returns null on success,
  /// otherwise a human-readable error. Settings are intentionally not imported.
  String? importJson(String text) {
    Object? j;
    try {
      j = jsonDecode(text.trim());
    } catch (_) {
      return 'That is not valid JSON.';
    }
    if (j is! Map) return 'Unrecognised backup format.';
    final hasSessions = j['sessions'] is List;
    final hasRoutines = j['routines'] is Map || j['completed'] is Map;
    if (!hasSessions && !hasRoutines && j['focusRecords'] is! List) {
      return 'No Noor sessions or routines found in this text.';
    }
    var added = 0;
    if (hasSessions) {
      final ids = sessions.map((s) => s.id).toSet();
      for (final raw in j['sessions'] as List) {
        final s = SessionRecord.fromJson(raw);
        if (s != null && ids.add(s.id)) {
          sessions.add(s);
          added++;
        }
      }
      sessions.sort((a, b) => a.at.compareTo(b.at));
    }
    final rt = j['routines'] is Map ? j['routines'] as Map : (j['completed'] is Map ? j['completed'] as Map : const {});
    for (final e in rt.entries) {
      if (e.value is Map) {
        final m = routines.putIfAbsent('${e.key}', () => {'morning': false, 'evening': false});
        if ((e.value as Map)['morning'] == true) m['morning'] = true;
        if ((e.value as Map)['evening'] == true) m['evening'] = true;
      }
    }
    if (j['focusRecords'] is List) {
      final keys = focusRecords.map((f) => f.at.toIso8601String()).toSet();
      for (final raw in j['focusRecords'] as List) {
        final f = FocusRecord.fromJson(raw);
        if (f != null && keys.add(f.at.toIso8601String())) focusRecords.add(f);
      }
      focusRecords.sort((a, b) => a.at.compareTo(b.at));
    }
    if (j['customs'] is List) {
      for (final raw in j['customs'] as List) {
        final c = CustomDhikr.fromJson(raw);
        if (c != null && !customs.any((x) => x.id == c.id)) customs.add(c);
      }
    }
    lastImportAdded = added;
    changed();
    return null;
  }

  int lastImportAdded = 0;

  Future<void> clearAll() async {
    _debounce?.cancel();
    final p = _prefs;
    if (p != null) {
      await p.remove(_kMain);
      await p.remove(_kActive);
    }
    lightTheme = false; haptics = true; cosmos = true; use24h = false;
    method = 'karachi'; madhab = 'hanafi'; highLat = 'middle';
    adjust = {for (final k in kPrayerKeys5) k: 0};
    lat = null; lon = null; placeName = '';
    remindersOn = false; jamaatRemind = true; leadMinutes = 0;
    remindPrayer = {for (final k in kPrayerKeys5) k: true};
    jamaat = {};
    selectedPresetId = 'istighfar'; customs = []; targetOverrides = {}; active = null;
    routines = {}; sessions = []; focusRecords = [];
    focusMinutes = 10; focusPurpose = kFocusPurposes.first; focusState = 'idle';
    focusEndMs = 0; focusRemainSec = 0; focusPlannedSec = 0;
    audioOn = false; audioMode = 'pad'; audioPath = ''; audioName = ''; audioVolume = .6;
    notifyListeners();
  }
}
