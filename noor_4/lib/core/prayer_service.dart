import 'package:adhan/adhan.dart';
import 'package:geolocator/geolocator.dart';
import 'storage.dart';

class PrayerService {
  static Future<Position> locate() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Location services are disabled. Enter coordinates manually in Settings.');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw Exception('Location permission not granted. Enter coordinates manually in Settings.');
    }
    return Geolocator.getCurrentPosition();
  }

  static Future<CalculationMethod> selectedMethod() async {
    final value = await NoorStorage.getSetting('method') ?? 'Karachi';
    switch (value) {
      case 'MuslimWorldLeague': return CalculationMethod.muslim_world_league;
      case 'Egyptian': return CalculationMethod.egyptian;
      case 'UmmAlQura': return CalculationMethod.umm_al_qura;
      case 'NorthAmerica': return CalculationMethod.north_america;
      default: return CalculationMethod.karachi;
    }
  }

  static Future<Madhab> selectedMadhab() async {
    final value = await NoorStorage.getSetting('asr') ?? 'Hanafi';
    return value == 'Shafi' ? Madhab.shafi : Madhab.hanafi;
  }

  static Future<PrayerTimes> calculateForDate({
    required double latitude,
    required double longitude,
    DateTime? date,
  }) async {
    final method = await selectedMethod();
    final madhab = await selectedMadhab();
    final params = method.getParameters()..madhab = madhab;
    return PrayerTimes(
      Coordinates(latitude, longitude),
      DateComponents.from(date ?? DateTime.now()),
      params,
    );
  }

  static PrayerTimes calculate({
    required double latitude,
    required double longitude,
    CalculationMethod method = CalculationMethod.karachi,
    Madhab madhab = Madhab.hanafi,
    DateTime? date,
  }) {
    final params = method.getParameters()..madhab = madhab;
    return PrayerTimes(
      Coordinates(latitude, longitude),
      DateComponents.from(date ?? DateTime.now()),
      params,
    );
  }
}
