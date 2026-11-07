import 'package:adhan/adhan.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'store.dart';
import 'util.dart';

const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const prayerLabels = {
  'fajr': 'Fajr', 'sunrise': 'Sunrise', 'dhuhr': 'Dhuhr',
  'asr': 'Asr', 'maghrib': 'Maghrib', 'isha': 'Isha',
};

class MethodInfo {
  final String id, label, note;
  final CalculationMethod method;
  const MethodInfo(this.id, this.label, this.note, this.method);
}

const calcMethods = <MethodInfo>[
  MethodInfo('karachi', 'University of Islamic Sciences, Karachi', 'Fajr 18° · Isha 18° — common in South Asia', CalculationMethod.karachi),
  MethodInfo('mwl', 'Muslim World League', 'Fajr 18° · Isha 17°', CalculationMethod.muslim_world_league),
  MethodInfo('egyptian', 'Egyptian General Authority', 'Fajr 19.5° · Isha 17.5°', CalculationMethod.egyptian),
  MethodInfo('umm_al_qura', 'Umm al-Qura, Makkah', 'Fajr 18.5° · Isha 90 min after Maghrib', CalculationMethod.umm_al_qura),
  MethodInfo('north_america', 'ISNA (North America)', 'Fajr 15° · Isha 15°', CalculationMethod.north_america),
  MethodInfo('dubai', 'Dubai', 'Fajr 18.2° · Isha 18.2°', CalculationMethod.dubai),
  MethodInfo('qatar', 'Qatar', 'Fajr 18° · Isha 90 min after Maghrib', CalculationMethod.qatar),
  MethodInfo('kuwait', 'Kuwait', 'Fajr 18° · Isha 17.5°', CalculationMethod.kuwait),
  MethodInfo('singapore', 'Singapore (MUIS)', 'Fajr 20° · Isha 18°', CalculationMethod.singapore),
  MethodInfo('turkey', 'Turkey (Diyanet)', 'Fajr 18° · Isha 17°', CalculationMethod.turkey),
  MethodInfo('tehran', 'Tehran (Geophysics)', 'Fajr 17.7° · Isha 14°', CalculationMethod.tehran),
  MethodInfo('moonsighting', 'Moonsighting Committee', 'Seasonal adjustments', CalculationMethod.moonsighting_committee),
];

MethodInfo methodInfo(String id) =>
    calcMethods.firstWhere((m) => m.id == id, orElse: () => calcMethods.first);

const highLatitudeOptions = {
  'middle': 'Middle of the night',
  'seventh': 'Seventh of the night',
  'twilight': 'Twilight angle',
};

/// Everything that changes prayer times, as a plain value (testable, no store access).
class PrayerConfig {
  final String method, madhab, highLat;
  final Map<String, int> adjust;
  const PrayerConfig(this.method, this.madhab, this.highLat, this.adjust);

  factory PrayerConfig.fromStore(NoorStore s) =>
      PrayerConfig(s.method, s.madhab, s.highLat, Map<String, int>.from(s.adjust));

  String get signature =>
      '$method|$madhab|$highLat|${kPrayerKeys5.map((k) => '${adjust[k] ?? 0}').join(',')}';
}

class PrayerEntry {
  final String key;
  final DateTime time;
  const PrayerEntry(this.key, this.time);
  String get name => prayerLabels[key] ?? key;
  bool get isSunrise => key == 'sunrise';
}

class PrayerService {
  /// Computes the six timings for the local calendar day of [date]. The configured
  /// method, madhab (Asr), high-latitude rule and minute adjustments are all applied.
  static List<PrayerEntry> computeDay(double lat, double lon, DateTime date, PrayerConfig cfg) {
    final params = methodInfo(cfg.method).method.getParameters();
    params.madhab = cfg.madhab == 'shafi' ? Madhab.shafi : Madhab.hanafi;
    switch (cfg.highLat) {
      case 'seventh':
        params.highLatitudeRule = HighLatitudeRule.seventh_of_the_night;
        break;
      case 'twilight':
        params.highLatitudeRule = HighLatitudeRule.twilight_angle;
        break;
      default:
        params.highLatitudeRule = HighLatitudeRule.middle_of_the_night;
    }
    params.adjustments.fajr = cfg.adjust['fajr'] ?? 0;
    params.adjustments.dhuhr = cfg.adjust['dhuhr'] ?? 0;
    params.adjustments.asr = cfg.adjust['asr'] ?? 0;
    params.adjustments.maghrib = cfg.adjust['maghrib'] ?? 0;
    params.adjustments.isha = cfg.adjust['isha'] ?? 0;
    final pt = PrayerTimes(Coordinates(lat, lon), DateComponents(date.year, date.month, date.day), params);
    return [
      PrayerEntry('fajr', pt.fajr.toLocal()),
      PrayerEntry('sunrise', pt.sunrise.toLocal()),
      PrayerEntry('dhuhr', pt.dhuhr.toLocal()),
      PrayerEntry('asr', pt.asr.toLocal()),
      PrayerEntry('maghrib', pt.maghrib.toLocal()),
      PrayerEntry('isha', pt.isha.toLocal()),
    ];
  }

  static Future<Position> locate() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Location services are turned off. Turn them on, or enter coordinates manually.');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw Exception('Location permission was not granted. Enter coordinates manually instead.');
    }
    return Geolocator.getCurrentPosition().timeout(const Duration(seconds: 30));
  }
}

/// Where "now" sits in the prayer day.
class PrayerState {
  final PrayerEntry? current; // obligatory prayer whose time is running (null after sunrise)
  final PrayerEntry next; // next obligatory prayer — rolls to tomorrow's Fajr after Isha
  final DateTime? segmentStart; // previous timing (any kind), for the progress ring
  final List<PrayerEntry> today;
  const PrayerState(this.current, this.next, this.segmentStart, this.today);

  Duration remaining(DateTime now) => next.time.difference(now);

  double progress(DateTime now) {
    final s = segmentStart;
    if (s == null) return 0;
    final total = next.time.difference(s).inSeconds;
    if (total <= 0) return 0;
    return (now.difference(s).inSeconds / total).clamp(0.0, 1.0);
  }
}

/// Pure resolver: yesterday/today/tomorrow timings → current & next prayer for [now].
PrayerState? resolvePrayerState(
    DateTime now, List<PrayerEntry> yesterday, List<PrayerEntry> today, List<PrayerEntry> tomorrow) {
  final all = <PrayerEntry>[...yesterday, ...today, ...tomorrow]..sort((a, b) => a.time.compareTo(b.time));
  PrayerEntry? lastAny;
  PrayerEntry? next;
  for (final e in all) {
    if (!e.time.isAfter(now)) {
      lastAny = e;
    } else if (next == null && !e.isSunrise) {
      next = e;
    }
  }
  if (next == null) return null;
  final current = (lastAny != null && !lastAny.isSunrise) ? lastAny : null;
  return PrayerState(current, next, lastAny?.time, today);
}

/// Caches three days of timings; recomputed only when location, settings or the date change.
class PrayerController {
  static final PrayerController instance = PrayerController._();
  PrayerController._();

  String? _key;
  List<PrayerEntry> _y = [], _t = [], _tm = [];
  String? lastError;

  PrayerState? stateAt(DateTime now) {
    final s = NoorStore.instance;
    final lat = s.lat, lon = s.lon;
    if (lat == null || lon == null) return null;
    final cfg = PrayerConfig.fromStore(s);
    final key = '${cfg.signature}|$lat,$lon|${dateKey(now)}';
    if (key != _key) {
      try {
        _y = PrayerService.computeDay(lat, lon, dayOffset(now, -1), cfg);
        _t = PrayerService.computeDay(lat, lon, dayOffset(now, 0), cfg);
        _tm = PrayerService.computeDay(lat, lon, dayOffset(now, 1), cfg);
        lastError = null;
      } catch (e) {
        lastError = 'Could not calculate prayer times for this location ($e).';
        debugPrint(lastError);
        _key = null;
        return null;
      }
      _key = key;
    }
    return resolvePrayerState(now, _y, _t, _tm);
  }
}
