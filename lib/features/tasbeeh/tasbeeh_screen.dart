import 'package:flutter/material.dart';
import '../../core/storage.dart';
import '../../core/theme.dart';
import '../../core/widgets_service.dart';

class TasbeehScreen extends StatefulWidget {
  const TasbeehScreen({super.key});
  @override State<TasbeehScreen> createState() => _TasbeehScreenState();
}
class _TasbeehScreenState extends State<TasbeehScreen> {
  int count = 0;
  String dhikr = 'سُبْحَانَ اللَّهِ';
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async { count = await NoorStorage.getCount(); dhikr = await NoorStorage.getDhikr(); if (mounted) setState(() {}); }
  Future<void> _set(int n) async {
    setState(() => count = n);
    await NoorStorage.setCount(n);
    await NoorWidgets.updateTasbeeh(n, dhikr);
  }
  Future<void> _choose() async {
    final c = TextEditingController(text: dhikr);
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Custom dhikr'), content: TextField(controller: c, textDirection: TextDirection.rtl),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('CANCEL')),
        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('SAVE'))]));
    if (ok == true && c.text.trim().isNotEmpty) { dhikr = c.text.trim(); await NoorStorage.setDhikr(dhikr); await NoorWidgets.updateTasbeeh(count, dhikr); if (mounted) setState(() {}); }
  }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(22), children: [
    const Text('Dhikr', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w500)),
    const Text('A moment of remembrance', style: TextStyle(color: NoorTheme.muted)),
    const SizedBox(height: 35),
    Center(child: Text(dhikr, textDirection: TextDirection.rtl,
      style: const TextStyle(fontSize: 28, height: 1.8), textAlign: TextAlign.center)),
    const SizedBox(height: 24),
    Center(child: Text('$count', style: const TextStyle(fontSize: 76, fontWeight: FontWeight.w200, letterSpacing: 2))),
    const Center(child: Text('COUNT', style: TextStyle(color: NoorTheme.muted, letterSpacing: 3, fontSize: 10))),
    const SizedBox(height: 35),
    Center(child: GestureDetector(
      onTap: () => _set(count + 1),
      child: Container(width: 210, height: 210,
        decoration: BoxDecoration(shape: BoxShape.circle, color: NoorTheme.surface,
          border: Border.all(color: NoorTheme.line, width: 2),
          boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 25, spreadRadius: 3)]),
        child: const Center(child: Icon(Icons.touch_app_outlined, size: 42, color: NoorTheme.white))))),
    const SizedBox(height: 26),
    Row(children: [
      Expanded(child: OutlinedButton.icon(onPressed: _choose, icon: const Icon(Icons.edit_outlined), label: const Text('CHANGE DHIKR'))),
      const SizedBox(width: 10),
      Expanded(child: OutlinedButton.icon(onPressed: () => _set(0), icon: const Icon(Icons.refresh), label: const Text('RESET'))),
    ]),
  ]);
}
