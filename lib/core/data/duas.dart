class DuaItem {
  final String arabic, meaning, reference;
  const DuaItem(this.arabic, this.meaning, this.reference);
}

// Carried over from V4's Duas screen.
const duas = <DuaItem>[
  DuaItem('رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
      'Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', 'Al-Baqarah 2:201'),
  DuaItem('رَبِّ زِدْنِي عِلْمًا', 'My Lord, increase me in knowledge.', 'Ta-Ha 20:114'),
  DuaItem('اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ',
      'O Allah, I ask You for pardon and well-being.', 'Prophetic supplication; verify wording with a trusted source'),
];
