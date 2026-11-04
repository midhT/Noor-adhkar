import 'package:shared_preferences/shared_preferences.dart';

class NoorStorage {
  static Future<int> getCount() async =>
      (await SharedPreferences.getInstance()).getInt('tasbeeh_count') ?? 0;

  static Future<void> setCount(int value) async =>
      (await SharedPreferences.getInstance()).setInt('tasbeeh_count', value);

  static Future<String> getDhikr() async =>
      (await SharedPreferences.getInstance()).getString('tasbeeh_dhikr') ?? 'سُبْحَانَ اللَّهِ';

  static Future<void> setDhikr(String value) async =>
      (await SharedPreferences.getInstance()).setString('tasbeeh_dhikr', value);

  static Future<void> saveJamaat(String prayer, String time) async =>
      (await SharedPreferences.getInstance()).setString('jamaat_$prayer', time);

  static Future<String?> getJamaat(String prayer) async =>
      (await SharedPreferences.getInstance()).getString('jamaat_$prayer');

  static Future<void> saveSetting(String key, String value) async =>
      (await SharedPreferences.getInstance()).setString(key, value);

  static Future<String?> getSetting(String key) async =>
      (await SharedPreferences.getInstance()).getString(key);
}
