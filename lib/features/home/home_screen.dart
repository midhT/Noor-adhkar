import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/verses.dart';
import '../../core/prayer_service.dart';
import '../../core/storage.dart';
import '../../core/widgets_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}
class _HomeScreenState extends State<HomeScreen> {
  String place = 'Set your location';
  String nextPrayer = 'Location needed';
  String nextTime = '--:--';
  int count = 0;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    count = await NoorStorage.getCount();
    final savedDhikr = await NoorStorage.getDhikr();
    await NoorWidgets.updateTasbeeh(count, savedDhikr);
    final lat = double.tryParse(await NoorStorage.getSetting('latitude') ?? '');
    final lon = double.tryParse(await NoorStorage.getSetting('longitude') ?? '');
    if (lat != null && lon != null) {
      final p = await PrayerService.calculateForDate(latitude: lat, longitude: lon);
      final now = DateTime.now();
      final list = {'Fajr':p.fajr, 'Sunrise':p.sunrise, 'Dhuhr':p.dhuhr, 'Asr':p.asr, 'Maghrib':p.maghrib, 'Isha':p.isha};
      if (!mounted) return;
      final upcoming = list.entries.firstWhere((e) => e.value.isAfter(now), orElse: () => list.entries.first);
      nextPrayer = upcoming.key; nextTime = TimeOfDay.fromDateTime(upcoming.value).format(context);
      place = 'Saved coordinates';
      await NoorWidgets.updateSalah(nextPrayer, nextTime);
      await NoorWidgets.updateVerseOfDay();
    }
    if (mounted) setState(() {});
  }
  @override Widget build(BuildContext context) {
    final verse = verses[DateTime.now().day % verses.length];
    return ListView(padding: const EdgeInsets.fromLTRB(20, 20, 20, 28), children: [
      Row(children: [
        Container(width: 42, height: 42, decoration: BoxDecoration(
          border: Border.all(color: NoorTheme.line), borderRadius: BorderRadius.circular(14)),
          child: const Center(child: Text('ن', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w300)))),
        const SizedBox(width: 12),
        const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('NOOR', style: TextStyle(letterSpacing: 4, fontSize: 15, fontWeight: FontWeight.w600)),
          Text('A quieter daily rhythm', style: TextStyle(color: NoorTheme.muted, fontSize: 11)),
        ]),
        const Spacer(), IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, color: NoorTheme.muted)),
      ]),
      const SizedBox(height: 28),
      Text(DateTime.now().toLocal().toString().split(' ').first,
        style: const TextStyle(color: NoorTheme.muted, letterSpacing: 1)),
      const SizedBox(height: 8),
      Text('Assalamu Alaikum', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w500)),
      const SizedBox(height: 20),
      Card(child: Padding(padding: const EdgeInsets.all(22), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [const Icon(Icons.location_on_outlined, size: 16, color: NoorTheme.muted), const SizedBox(width: 6), Text(place, style: const TextStyle(color: NoorTheme.muted))]),
        const SizedBox(height: 22),
        const Text('UP NEXT', style: TextStyle(color: NoorTheme.muted, fontSize: 11, letterSpacing: 2)),
        const SizedBox(height: 7),
        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(child: Text(nextPrayer, style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w400))),
          Text(nextTime, style: const TextStyle(fontSize: 22, color: NoorTheme.muted)),
        ]),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: OutlinedButton(
          onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const _SalahHint())),
          child: const Text('VIEW PRAYER TIMES'))),
      ]))),
      const SizedBox(height: 14),
      Row(children: [
        Expanded(child: _quickCard('DHIKR TODAY', '$count', Icons.fingerprint)),
        const SizedBox(width: 12),
        Expanded(child: _quickCard('DAILY VERSE', 'Read', Icons.menu_book_outlined)),
      ]),
      const SizedBox(height: 22),
      const Text('A VERSE TO CARRY', style: TextStyle(color: NoorTheme.muted, fontSize: 11, letterSpacing: 2)),
      const SizedBox(height: 10),
      Card(child: Padding(padding: const EdgeInsets.all(22), child: Column(children: [
        Text(verse.arabic, textAlign: TextAlign.center, textDirection: TextDirection.rtl,
          style: const TextStyle(fontSize: 25, height: 1.9)),
        const SizedBox(height: 14),
        Text(verse.translation, textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 15, height: 1.6, color: NoorTheme.white)),
        const SizedBox(height: 12),
        Text(verse.reference, style: const TextStyle(color: NoorTheme.muted, fontSize: 12)),
      ]))),
    ]);
  }
  Widget _quickCard(String title, String value, IconData icon) => Card(child: Padding(
    padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: NoorTheme.muted), const SizedBox(height: 16),
      Text(value, style: const TextStyle(fontSize: 25)),
      Text(title, style: const TextStyle(color: NoorTheme.muted, fontSize: 10, letterSpacing: 1)),
    ])));
}
class _SalahHint extends StatelessWidget {
  const _SalahHint();
  @override Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Open Salah from the bottom navigation.')));
}
