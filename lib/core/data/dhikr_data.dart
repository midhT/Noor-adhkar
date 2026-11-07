/// One counted phrase inside a dhikr. A preset may chain several steps (e.g. 33/33/34).
class DhikrStep {
  final String arabic, name, meaning;
  final int target;
  const DhikrStep(this.arabic, this.name, this.meaning, this.target);
}

class DhikrPreset {
  final String id, category, note;
  final List<DhikrStep> steps;
  final bool custom;
  const DhikrPreset(this.id, this.category, this.note, this.steps, {this.custom = false});

  bool get isSet => steps.length > 1;
  DhikrStep get first => steps.first;
  String get name => isSet ? setName : first.name;
  String get arabic => first.arabic;
  String get meaning => isSet ? steps.map((s) => s.name).join(' · ') : first.meaning;
  int get totalTarget => steps.fold(0, (a, s) => a + s.target);
  String get setName => id == 'post_prayer' ? 'Post-prayer tasbeeh' : steps.map((s) => s.name).join(' + ');
}

/// V3 presets keep their original ids so imported V3 history maps cleanly.
const dhikrPresets = <DhikrPreset>[
  DhikrPreset('istighfar', 'Forgiveness', 'Personal target',
      [DhikrStep('أَسْتَغْفِرُ اللّٰهَ', 'Astaghfirullah', 'I seek forgiveness from Allah', 100)]),
  DhikrPreset('subhanallah', 'Tasbeeh', 'Commonly counted 33 times in a post-prayer set',
      [DhikrStep('سُبْحَانَ اللّٰهِ', 'SubhanAllah', 'Glory be to Allah', 33)]),
  DhikrPreset('alhamdulillah', 'Gratitude', 'Commonly counted 33 times in a post-prayer set',
      [DhikrStep('الْحَمْدُ لِلّٰهِ', 'Alhamdulillah', 'All praise belongs to Allah', 33)]),
  DhikrPreset('allahuakbar', 'Greatness', 'Commonly counted 34 times in a post-prayer set',
      [DhikrStep('اللّٰهُ أَكْبَرُ', 'Allahu Akbar', 'Allah is the Greatest', 34)]),
  DhikrPreset('hawqala', 'Reliance', 'Choose a personal target', [
    DhikrStep('لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', 'La hawla wa la quwwata illa billah',
        'There is no power nor strength except through Allah', 100)
  ]),
  DhikrPreset('post_prayer', 'Set', 'SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 — as commonly taught after Salah', [
    DhikrStep('سُبْحَانَ اللّٰهِ', 'SubhanAllah', 'Glory be to Allah', 33),
    DhikrStep('الْحَمْدُ لِلّٰهِ', 'Alhamdulillah', 'All praise belongs to Allah', 33),
    DhikrStep('اللّٰهُ أَكْبَرُ', 'Allahu Akbar', 'Allah is the Greatest', 34),
  ]),
  DhikrPreset('salawat', 'Salawat', 'Personal target',
      [DhikrStep('اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', 'Allahumma salli ala Muhammad', 'O Allah, send blessings upon Muhammad', 100)]),
  DhikrPreset('tahlil', 'Tawhid', 'Personal target',
      [DhikrStep('لَا إِلَٰهَ إِلَّا اللَّهُ', 'La ilaha illallah', 'There is no deity but Allah', 100)]),
  DhikrPreset('tasbih_hamd', 'Tasbeeh', 'Personal target',
      [DhikrStep('سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 'SubhanAllahi wa bihamdihi', 'Glory and praise be to Allah', 100)]),
  DhikrPreset('hasbunallah', 'Reliance', 'Personal target',
      [DhikrStep('حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Hasbunallahu wa niʿmal-wakil',
          'Allah is sufficient for us, and He is the best disposer of affairs', 100)]),
];

DhikrPreset? findBuiltInPreset(String id) {
  for (final p in dhikrPresets) {
    if (p.id == id) return p;
  }
  return null;
}
