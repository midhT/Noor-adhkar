import '../util.dart';

class Reflection {
  final String arabic, translation, reference, theme;
  const Reflection(this.arabic, this.translation, this.reference, this.theme);
}

// Qur'anic reflections shown after a dhikr session (the Quran tab was removed in V5).
// The first 15 are the V4 verses; the rest are added for dhikr themes.
// All Arabic text and translations must be reviewed against a mushaf before public release.
const reflections = <Reflection>[
  Reflection('أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'Verily, in the remembrance of Allah do hearts find rest.', 'Quran 13:28', 'remembrance'),
  Reflection('يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا', 'O you who believe, remember Allah with much remembrance.', 'Quran 33:41', 'remembrance'),
  Reflection('فَاذْكُرُونِي أَذْكُرْكُمْ', 'So remember Me; I will remember you.', 'Quran 2:152', 'remembrance'),
  Reflection('وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ', 'He is with you wherever you are.', 'Quran 57:4', 'remembrance'),
  Reflection('فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا', 'And I said: Seek forgiveness of your Lord; indeed, He is ever a Forgiver.', 'Quran 71:10', 'forgiveness'),
  Reflection('وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا', 'Whoever does wrong or wrongs himself, then seeks forgiveness of Allah, will find Allah Forgiving and Merciful.', 'Quran 4:110', 'forgiveness'),
  Reflection('لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ', 'Do not despair of the mercy of Allah.', 'Quran 39:53', 'forgiveness'),
  Reflection('لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', 'If you are grateful, I will surely increase you.', 'Quran 14:7', 'gratitude'),
  Reflection('وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا', 'And if you should count the favors of Allah, you could not enumerate them.', 'Quran 16:18', 'gratitude'),
  Reflection('وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', 'And whoever relies upon Allah, then He is sufficient for him.', 'Quran 65:3', 'trust'),
  Reflection('حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Allah is sufficient for us, and He is the best disposer of affairs.', 'Quran 3:173', 'trust'),
  Reflection('إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ', 'Indeed, Allah loves those who rely upon Him.', 'Quran 3:159', 'trust'),
  Reflection('وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', 'My success is only through Allah.', 'Quran 11:88', 'trust'),
  Reflection('أَلَيْسَ اللَّهُ بِكَافٍ عَبْدَهُ', 'Is Allah not sufficient for His servant?', 'Quran 39:36', 'trust'),
  Reflection('وَاللَّهُ خَيْرُ الْمَاكِرِينَ', 'And Allah is the best of planners.', 'Quran 3:54', 'trust'),
  Reflection('فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', 'For indeed, with hardship comes ease.', 'Quran 94:5', 'patience'),
  Reflection('إِنَّ مَعَ الْعُسْرِ يُسْرًا', 'Indeed, with hardship comes ease.', 'Quran 94:6', 'patience'),
  Reflection('لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', 'Allah does not burden a soul beyond what it can bear.', 'Quran 2:286', 'patience'),
  Reflection('إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', 'Indeed, Allah is with the patient.', 'Quran 2:153', 'patience'),
  Reflection('لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', 'Do not grieve; indeed Allah is with us.', 'Quran 9:40', 'patience'),
  Reflection('وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ', 'Do not despair of relief from Allah.', 'Quran 12:87', 'patience'),
  Reflection('وَقُلْ رَبِّ زِدْنِي عِلْمًا', 'And say: My Lord, increase me in knowledge.', 'Quran 20:114', 'general'),
  Reflection('وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا مَتَاعُ الْغُرُورِ', 'The life of this world is only the enjoyment of delusion.', 'Quran 3:185', 'general'),
];

/// Theme used to pick a reflection for a given dhikr preset.
String reflectionThemeFor(String presetId) {
  switch (presetId) {
    case 'istighfar':
      return 'forgiveness';
    case 'alhamdulillah':
      return 'gratitude';
    case 'hawqala':
    case 'hasbunallah':
      return 'trust';
    default:
      return 'remembrance';
  }
}

/// Deterministic pick: themed pool plus a little general variety, rotated by [seed].
Reflection reflectionFor(String presetId, int seed) {
  final theme = reflectionThemeFor(presetId);
  final pool = reflections.where((r) => r.theme == theme || r.theme == 'general').toList();
  return pool[seed.abs() % pool.length];
}

Reflection reflectionOfTheDay(DateTime day) => reflections[dayOfYear(day) % reflections.length];
