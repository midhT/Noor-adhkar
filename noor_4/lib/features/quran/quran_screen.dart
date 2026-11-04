import 'package:flutter/material.dart';
import '../../core/verses.dart';
import '../../core/theme.dart';

class QuranScreen extends StatelessWidget {
  const QuranScreen({super.key});
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    const Text('Quran', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w500)),
    const Text('A collection of verses for reflection', style: TextStyle(color: NoorTheme.muted)),
    const SizedBox(height: 18),
    ...verses.map((v) => Card(margin: const EdgeInsets.only(bottom: 12), child: Padding(
      padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(v.arabic, textDirection: TextDirection.rtl, textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 23, height: 1.9)),
        const SizedBox(height: 12),
        Text(v.translation, textAlign: TextAlign.center, style: const TextStyle(height: 1.5)),
        const SizedBox(height: 10),
        Text(v.reference, textAlign: TextAlign.center, style: const TextStyle(color: NoorTheme.muted, fontSize: 12)),
      ])))),
  ]);
}
