import 'package:flutter/material.dart';
import '../../core/prayer_service.dart';
import '../../core/storage.dart';
import '../../core/theme.dart';

class SalahScreen extends StatefulWidget {
  const SalahScreen({super.key});
  @override State<SalahScreen> createState() => _SalahScreenState();
}
class _SalahScreenState extends State<SalahScreen> {
  double? lat, lon;
  String? error;
  Map<String, DateTime> times = {};
  final names = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  @override void initState() { super.initState(); _init(); }
  Future<void> _init() async {
    lat = double.tryParse(await NoorStorage.getSetting('latitude') ?? '');
    lon = double.tryParse(await NoorStorage.getSetting('longitude') ?? '');
    if (lat != null && lon != null) _calculate();
    if (mounted) setState(() {});
  }
  void _calculate() {
    if (lat == null || lon == null) return;
    final p = PrayerService.calculate(latitude: lat!, longitude: lon!);
    times = {'Fajr':p.fajr, 'Sunrise':p.sunrise, 'Dhuhr':p.dhuhr, 'Asr':p.asr, 'Maghrib':p.maghrib, 'Isha':p.isha};
  }
  Future<void> _auto() async {
    try {
      final pos = await PrayerService.locate();
      lat = pos.latitude; lon = pos.longitude;
      await NoorStorage.saveSetting('latitude', '$lat');
      await NoorStorage.saveSetting('longitude', '$lon');
      error = null; _calculate();
    } catch (e) { error = e.toString(); }
    if (mounted) setState(() {});
  }
  Future<void> _manual() async {
    final a = TextEditingController(text: lat?.toString() ?? '');
    final b = TextEditingController(text: lon?.toString() ?? '');
    final ok = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
      title: const Text('Enter coordinates'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: a, keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true), decoration: const InputDecoration(labelText: 'Latitude')),
        const SizedBox(height: 10),
        TextField(controller: b, keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true), decoration: const InputDecoration(labelText: 'Longitude')),
      ]),
      actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('CANCEL')),
        TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('SAVE'))],
    ));
    if (ok == true) {
      lat = double.tryParse(a.text); lon = double.tryParse(b.text);
      if (lat != null && lon != null && lat! >= -90 && lat! <= 90 && lon! >= -180 && lon! <= 180) {
        await NoorStorage.saveSetting('latitude', '$lat'); await NoorStorage.saveSetting('longitude', '$lon');
        _calculate(); error = null;
      } else { error = 'Please enter valid latitude and longitude.'; }
    }
    if (mounted) setState(() {});
  }
  Future<void> _editJamaat(String prayer) async {
    final existing = await NoorStorage.getJamaat(prayer);
    if (!mounted) return;
    final ctrl = TextEditingController(text: existing ?? '');
    final ok = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
      title: Text('$prayer Jamaat time'),
      content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'e.g. 13:30'), keyboardType: TextInputType.datetime),
      actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('CANCEL')),
        TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('SAVE'))],
    ));
    if (ok == true) await NoorStorage.saveJamaat(prayer, ctrl.text.trim());
    if (mounted) setState(() {});
  }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    const Text('Salah', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w500)),
    const SizedBox(height: 6),
    const Text('Prayer times and your local Jamaat schedule', style: TextStyle(color: NoorTheme.muted)),
    const SizedBox(height: 20),
    Row(children: [
      Expanded(child: OutlinedButton.icon(onPressed: _auto, icon: const Icon(Icons.my_location), label: const Text('USE LOCATION'))),
      const SizedBox(width: 8),
      Expanded(child: OutlinedButton.icon(onPressed: _manual, icon: const Icon(Icons.edit_location_alt_outlined), label: const Text('COORDINATES'))),
    ]),
    if (error != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(error!, style: const TextStyle(color: Colors.orangeAccent))),
    const SizedBox(height: 16),
    if (times.isEmpty) const Card(child: Padding(padding: EdgeInsets.all(20), child: Text('Set your location or enter coordinates to calculate prayer times.'))),
    ...times.entries.map((e) => FutureBuilder<String?>(
      future: NoorStorage.getJamaat(e.key),
      builder: (context, snap) => Card(child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 5),
        title: Text(e.key, style: const TextStyle(fontSize: 17)),
        subtitle: Text(snap.data == null || snap.data!.isEmpty ? 'Jamaat not set' : 'Jamaat · ${snap.data}',
          style: const TextStyle(color: NoorTheme.muted)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(TimeOfDay.fromDateTime(e.value).format(context), style: const TextStyle(fontSize: 17)),
          IconButton(onPressed: () => _editJamaat(e.key), icon: const Icon(Icons.edit_outlined, size: 18)),
        ]),
      )),
    )),
    const SizedBox(height: 12),
    const Text('Calculation method: Karachi (commonly used in South Asia). Asr: Hanafi by default.',
      style: TextStyle(color: NoorTheme.muted, fontSize: 12, height: 1.5)),
  ]);
}
