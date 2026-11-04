import 'package:flutter/material.dart';
import '../../core/theme.dart';

class DuasScreen extends StatelessWidget {
  const DuasScreen({super.key});
  static const items = [
    ('رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
     'Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', 'Al-Baqarah 2:201'),
    ('رَبِّ زِدْنِي عِلْمًا', 'My Lord, increase me in knowledge.', 'Ta-Ha 20:114'),
    ('اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ',
     'O Allah, I ask You for pardon and well-being.', 'Prophetic supplication; verify wording with a trusted source'),
  ];
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Duas')),
    body: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('Supplications', style: TextStyle(fontSize: 30)),
      const SizedBox(height: 15),
      ...items.map((d) => Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
        Text(d.$1, textDirection: TextDirection.rtl, textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 22, height: 1.8)),
        const SizedBox(height: 12), Text(d.$2, textAlign: TextAlign.center,
          style: const TextStyle(height: 1.5)),
        const SizedBox(height: 8), Text(d.$3, style: const TextStyle(color: NoorTheme.muted, fontSize: 11)),
      ])))),
    ]),
  );
}
