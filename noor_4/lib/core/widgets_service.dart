import 'package:home_widget/home_widget.dart';
import 'verses.dart';

class NoorWidgets {
  static const tasbeehProvider = 'TasbeehWidgetProvider';
  static const salahProvider = 'SalahWidgetProvider';
  static const verseProvider = 'VerseWidgetProvider';

  static Future<void> updateTasbeeh(int count, String dhikr) async {
    await HomeWidget.saveWidgetData<int>('tasbeeh_count', count);
    await HomeWidget.saveWidgetData<String>('tasbeeh_dhikr', dhikr);
    await HomeWidget.updateWidget(
      androidName: tasbeehProvider,
      qualifiedAndroidName: 'com.midhat.noor.$tasbeehProvider',
    );
  }

  static Future<void> updateSalah(String prayer, String time) async {
    await HomeWidget.saveWidgetData<String>('next_prayer', prayer);
    await HomeWidget.saveWidgetData<String>('next_prayer_time', time);
    await HomeWidget.updateWidget(
      androidName: salahProvider,
      qualifiedAndroidName: 'com.midhat.noor.$salahProvider',
    );
  }

  static Future<void> updateVerseOfDay() async {
    final verse = verses[DateTime.now().day % verses.length];
    await HomeWidget.saveWidgetData<String>('verse_arabic', verse.arabic);
    await HomeWidget.saveWidgetData<String>('verse_translation', verse.translation);
    await HomeWidget.saveWidgetData<String>('verse_reference', verse.reference);
    await HomeWidget.updateWidget(
      androidName: verseProvider,
      qualifiedAndroidName: 'com.midhat.noor.$verseProvider',
    );
  }

  static Future<void> updateAll({
    required int count, required String dhikr,
    required String prayer, required String time,
  }) async {
    await updateTasbeeh(count, dhikr);
    await updateSalah(prayer, time);
    await updateVerseOfDay();
  }
}
