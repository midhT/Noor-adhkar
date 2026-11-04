import 'package:flutter/material.dart';
import '../../core/storage.dart';
import '../../core/notifications.dart';
import '../../core/theme.dart';
import '../../core/prayer_service.dart';
import '../duas/duas_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override State<SettingsScreen> createState() => _SettingsScreenState();
}
class _SettingsScreenState extends State<SettingsScreen> {
  String method = 'Karachi';
  String asr = 'Hanafi';
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    method = await NoorStorage.getSetting('method') ?? 'Karachi';
    asr = await NoorStorage.getSetting('asr') ?? 'Hanafi';
    if (mounted) setState(() {});
  }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    const Text('Settings', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w500)),
    const Text('Make Noor yours', style: TextStyle(color: NoorTheme.muted)),
    const SizedBox(height: 20),
    Card(child: Column(children: [
      ListTile(title: const Text('Calculation method'), subtitle: const Text('Prayer-time convention'),
        trailing: DropdownButton<String>(value: method, items: const [
          DropdownMenuItem(value: 'Karachi', child: Text('Karachi')),
          DropdownMenuItem(value: 'MuslimWorldLeague', child: Text('MWL')),
          DropdownMenuItem(value: 'Egyptian', child: Text('Egyptian')),
          DropdownMenuItem(value: 'UmmAlQura', child: Text('Umm al-Qura')),
        ], onChanged: (v) async { if (v != null) { method = v; await NoorStorage.saveSetting('method', v); setState(() {}); } })),
      const Divider(height: 1),
      ListTile(title: const Text('Asr calculation'), subtitle: const Text('Juristic convention'),
        trailing: DropdownButton<String>(value: asr, items: const [
          DropdownMenuItem(value: 'Hanafi', child: Text('Hanafi')),
          DropdownMenuItem(value: 'Shafi', child: Text('Shafi‘i')),
        ], onChanged: (v) async { if (v != null) { asr = v; await NoorStorage.saveSetting('asr', v); setState(() {}); } })),
    ])),
    Card(child: Column(children: [
      ListTile(leading: const Icon(Icons.notifications_outlined), title: const Text('Enable notifications'),
        subtitle: const Text('Allow prayer reminders'),
        onTap: () async { final granted = await NoorNotifications.requestPermission();
          if (granted) {
            final lat = double.tryParse(await NoorStorage.getSetting('latitude') ?? '');
            final lon = double.tryParse(await NoorStorage.getSetting('longitude') ?? '');
            if (lat != null && lon != null) {
              final count = await NoorNotifications.schedulePrayerReminders(
                latitude: lat, longitude: lon);
              if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Scheduled $count upcoming prayer/Jamaat reminders.')));
              return;
            }
          }
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(granted ? 'Set your location in Salah first.' : 'Permission not granted'))); }),
      const Divider(height: 1),
      ListTile(leading: const Icon(Icons.menu_book_outlined), title: const Text('Duas library'),
        trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DuasScreen()))),
      const Divider(height: 1),
      const ListTile(leading: Icon(Icons.offline_bolt_outlined), title: Text('Offline-first'),
        subtitle: Text('Your counter and Jamaat times are stored on this device.')),
    ])),
    const SizedBox(height: 12),
    const Text('NOOR 4.0  •  BLACK / WHITE EDITION', textAlign: TextAlign.center,
      style: TextStyle(color: NoorTheme.muted, fontSize: 10, letterSpacing: 1.5)),
  ]);
}
