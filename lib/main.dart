import 'dart:async';
import 'package:adhan/adhan.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const navy = Color(0xFF09131F);
const panel = Color(0xFF132235);
const gold = Color(0xFFD6B36A);
const muted = Color(0xFF9BAABD);

extension FirstOrNullExtension<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    return iterator.moveNext() ? iterator.current : null;
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NoorApp());
}

class NoorApp extends StatelessWidget {
  const NoorApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Noor',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: navy,
      colorScheme: const ColorScheme.dark(
        primary: gold, secondary: gold, surface: panel,
      ),
      useMaterial3: true,
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(backgroundColor: navy, foregroundColor: Colors.white),
    ),
    home: const NoorShell(),
  );
}

class Dhikr {
  Dhikr(this.name, this.arabic, this.meaning, {this.target = 33});
  final String name, arabic, meaning;
  final int target;
}

final presets = <Dhikr>[
  Dhikr('SubhanAllah', 'سُبْحَانَ اللَّهِ', 'Glory be to Allah'),
  Dhikr('Alhamdulillah', 'الْحَمْدُ لِلَّهِ', 'All praise is for Allah'),
  Dhikr('Allahu Akbar', 'اللَّهُ أَكْبَرُ', 'Allah is the Greatest'),
  Dhikr('Astaghfirullah', 'أَسْتَغْفِرُ اللَّهَ', 'I seek forgiveness from Allah'),
  Dhikr('La ilaha illallah', 'لَا إِلَٰهَ إِلَّا اللَّهُ', 'There is no deity but Allah'),
  Dhikr('SubhanAllahi wa bihamdihi', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 'Glory and praise be to Allah'),
  Dhikr('Salawat', 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', 'O Allah, send blessings upon Muhammad'),
  Dhikr('HasbunAllahu', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Allah is sufficient for us'),
  Dhikr('La hawla wa la quwwata', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'There is no power except through Allah'),
  Dhikr('Rabbighfir li', 'رَبِّ اغْفِرْ لِي', 'My Lord, forgive me', target: 10),
];

class NoorShell extends StatefulWidget {
  const NoorShell({super.key});
  @override State<NoorShell> createState() => _NoorShellState();
}
class _NoorShellState extends State<NoorShell> {
  int tab = 0;
  int count = 0, completed = 0, streak = 0;
  String selected = 'SubhanAllah';
  List<String> custom = [];
  late SharedPreferences prefs;
  bool ready = false;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      count = prefs.getInt('count') ?? 0;
      completed = prefs.getInt('completed') ?? 0;
      streak = prefs.getInt('streak') ?? 0;
      selected = prefs.getString('selected') ?? 'SubhanAllah';
      custom = prefs.getStringList('custom') ?? [];
      ready = true;
    });
  }
  Future<void> save() async {
    await prefs.setInt('count', count);
    await prefs.setInt('completed', completed);
    await prefs.setInt('streak', streak);
    await prefs.setString('selected', selected);
    await prefs.setStringList('custom', custom);
  }
  @override Widget build(BuildContext context) {
    final pages = [
      HomePage(count: count, completed: completed, streak: streak, onDhikr: () => setState(() => tab = 1)),
      DhikrPage(selected: selected, count: count, custom: custom,
        onSelect: (v) => setState(() { selected = v; count = 0; save(); }),
        onCount: () { setState(() => count++); save(); },
        onReset: () { setState(() => count = 0); save(); },
        onComplete: () { setState(() { completed++; streak = streak == 0 ? 1 : streak; count = 0; }); save(); }),
      const SalahPage(),
      const FocusPage(),
      JourneyPage(completed: completed, streak: streak),
    ];
    return Scaffold(
      body: SafeArea(child: ready ? pages[tab] : const Center(child: CircularProgressIndicator(color: gold))),
      bottomNavigationBar: NavigationBar(
        backgroundColor: panel, indicatorColor: gold.withValues(alpha: .18),
        selectedIndex: tab, onDestinationSelected: (v) => setState(() => tab = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.fingerprint), label: 'Dhikr'),
          NavigationDestination(icon: Icon(Icons.mosque_outlined), label: 'Salah'),
          NavigationDestination(icon: Icon(Icons.nights_stay_outlined), label: 'Focus'),
          NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), label: 'Journey'),
        ],
      ),
    );
  }
}

Widget heading(String title, String subtitle) => Padding(
  padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(fontSize: 29, fontWeight: FontWeight.w700)),
    const SizedBox(height: 5), Text(subtitle, style: const TextStyle(color: muted)),
  ]),
);
Widget card({required Widget child}) => Container(
  width: double.infinity, padding: const EdgeInsets.all(18),
  decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(22),
    border: Border.all(color: Colors.white.withValues(alpha: .06))),
  child: child,
);

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.count, required this.completed, required this.streak, required this.onDhikr});
  final int count, completed, streak; final VoidCallback onDhikr;
  @override Widget build(BuildContext context) => ListView(children: [
    heading('Assalamu Alaikum', 'Make space for remembrance today.'),
    Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('A quieter heart begins with remembrance.', style: TextStyle(fontSize: 20, height: 1.35)),
      const SizedBox(height: 18), Row(children: [
        _stat('Sessions', '$completed'), _stat('Current count', '$count'), _stat('Streak', '$streak days'),
      ]),
    ]))),
    const SizedBox(height: 14),
    Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Continue your dhikr', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8), const Text('Return to a simple act of remembrance.', style: TextStyle(color: muted)),
      const SizedBox(height: 14), FilledButton.icon(onPressed: onDhikr, icon: const Icon(Icons.arrow_forward), label: const Text('Open Dhikr')),
    ]))),
    const SizedBox(height: 24),
  ]);
}
Widget _stat(String label, String value) => Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  Text(value, style: const TextStyle(color: gold, fontSize: 21, fontWeight: FontWeight.bold)),
  Text(label, style: const TextStyle(color: muted, fontSize: 11)),
]));

class DhikrPage extends StatelessWidget {
  const DhikrPage({super.key, required this.selected, required this.count, required this.custom, required this.onSelect, required this.onCount, required this.onReset, required this.onComplete});
  final String selected; final int count; final List<String> custom;
  final ValueChanged<String> onSelect; final VoidCallback onCount, onReset, onComplete;
  @override Widget build(BuildContext context) {
    final item = presets.where((e) => e.name == selected).firstOrNull ?? Dhikr(selected, selected, 'Personal dhikr');
    final target = item.target;
    final done = count >= target;
    return ListView(padding: const EdgeInsets.only(bottom: 20), children: [
      heading('Dhikr', 'A moment of remembrance, at your pace.'),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: card(child: Column(children: [
        DropdownButtonFormField<String>(
          value: selected, isExpanded: true, decoration: const InputDecoration(labelText: 'Choose dhikr'),
          items: [...presets.map((e) => DropdownMenuItem(value: e.name, child: Text(e.name))), ...custom.map((e) => DropdownMenuItem(value: e, child: Text(e)))],
          onChanged: (v) { if (v != null) onSelect(v); },
        ),
        const SizedBox(height: 28),
        Text(item.arabic, textAlign: TextAlign.center, style: const TextStyle(fontSize: 30, height: 1.8, color: gold)),
        Text(item.meaning, style: const TextStyle(color: muted)),
        const SizedBox(height: 24),
        Text('$count', style: const TextStyle(fontSize: 64, fontWeight: FontWeight.w300)),
        Text('of $target', style: const TextStyle(color: muted)),
        const SizedBox(height: 22),
        GestureDetector(onTap: done ? null : onCount, child: Container(
          width: 150, height: 150, decoration: BoxDecoration(shape: BoxShape.circle, color: gold.withValues(alpha: .12), border: Border.all(color: gold, width: 2)),
          child: const Center(child: Icon(Icons.touch_app, color: gold, size: 48)),
        )),
        const SizedBox(height: 18),
        if (done) ...[
          const Text('Alhamdulillah — session complete.', style: TextStyle(color: gold, fontSize: 17, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('“Surely in the remembrance of Allah do hearts find comfort.” — Quran 13:28', textAlign: TextAlign.center, style: TextStyle(color: muted)),
          const SizedBox(height: 12),
          FilledButton(onPressed: onComplete, child: const Text('Finish session')),
        ] else const Text('Tap the circle to count', style: TextStyle(color: muted)),
        TextButton(onPressed: onReset, child: const Text('Reset session')),
      ]))),
      Padding(padding: const EdgeInsets.all(16), child: OutlinedButton.icon(
        onPressed: () async {
          final c = TextEditingController();
          final name = await showDialog<String>(context: context, builder: (ctx) => AlertDialog(
            title: const Text('Add custom dhikr'), content: TextField(controller: c, autofocus: true, decoration: const InputDecoration(hintText: 'Dhikr name')),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(ctx, c.text.trim()), child: const Text('Add'))],
          ));
          if (name != null && name.isNotEmpty) {
            custom.add(name); onSelect(name);
          }
        }, icon: const Icon(Icons.add), label: const Text('Add custom dhikr'),
      )),
    ]);
  }
}

class SalahPage extends StatefulWidget {
  const SalahPage({super.key});
  @override State<SalahPage> createState() => _SalahPageState();
}
class _SalahPageState extends State<SalahPage> {
  double latitude = 34.0837, longitude = 74.7973;
  CalculationMethod method = CalculationMethod.karachi;
  Madhab madhab = Madhab.hanafi;
  DateTime now = DateTime.now();
  Timer? timer;
  @override void initState() { super.initState(); timer = Timer.periodic(const Duration(seconds: 30), (_) => setState(() => now = DateTime.now())); }
  @override void dispose() { timer?.cancel(); super.dispose(); }
  @override Widget build(BuildContext context) {
    final params = method.getParameters()..madhab = madhab;
    final coords = Coordinates(latitude, longitude);
    final times = PrayerTimes(coords, DateComponents.from(now), params);
    final entries = <Prayer, DateTime>{
      Prayer.fajr: times.fajr, Prayer.sunrise: times.sunrise, Prayer.dhuhr: times.dhuhr,
      Prayer.asr: times.asr, Prayer.maghrib: times.maghrib, Prayer.isha: times.isha,
    };
    final upcoming = entries.entries.where((e) => e.value.isAfter(now)).firstOrNull;
    final next = upcoming ?? entries.entries.first;
    final diff = next.value.difference(now);
    return ListView(children: [
      heading('Salah', 'Prayer schedule · Hanafi'),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('NEXT PRAYER', style: TextStyle(color: muted, letterSpacing: 1.4, fontSize: 11)),
        const SizedBox(height: 8), Text(next.key.name.toUpperCase(), style: const TextStyle(fontSize: 26, color: gold, fontWeight: FontWeight.bold)),
        Text('${next.value.hour.toString().padLeft(2,'0')}:${next.value.minute.toString().padLeft(2,'0')}', style: const TextStyle(fontSize: 38)),
        Text('Time remaining: ${diff.isNegative ? '00:00' : '${diff.inHours.toString().padLeft(2,'0')}:${(diff.inMinutes % 60).toString().padLeft(2,'0')}'}', style: const TextStyle(color: muted)),
      ]))),
      const SizedBox(height: 12),
      ...entries.entries.map((e) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4), child: card(child: Row(children: [
        Expanded(child: Text(e.key.name, style: const TextStyle(fontSize: 16))),
        Text('${e.value.hour.toString().padLeft(2,'0')}:${e.value.minute.toString().padLeft(2,'0')}', style: const TextStyle(color: gold, fontSize: 17)),
      ])))),
      const Padding(padding: EdgeInsets.all(16), child: Text('Default coordinates are Srinagar. Verify or replace them with your location and confirm timings with your local mosque.', style: TextStyle(color: muted))),
    ]);
  }
}

class FocusPage extends StatefulWidget {
  const FocusPage({super.key});
  @override State<FocusPage> createState() => _FocusPageState();
}
class _FocusPageState extends State<FocusPage> {
  int seconds = 10 * 60; Timer? timer; bool running = false;
  final player = AudioPlayer();
  @override void dispose() { timer?.cancel(); player.dispose(); super.dispose(); }
  String get display => '${(seconds ~/ 60).toString().padLeft(2,'0')}:${(seconds % 60).toString().padLeft(2,'0')}';
  void start() {
    if (running) { timer?.cancel(); setState(() => running = false); return; }
    setState(() => running = true);
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (seconds <= 1) { t.cancel(); setState(() { seconds = 0; running = false; }); }
      else { setState(() => seconds--); }
    });
  }
  @override Widget build(BuildContext context) => ListView(children: [
    heading('Focus Studio', 'Step away from noise. Return with intention.'),
    Padding(padding: const EdgeInsets.all(16), child: card(child: Column(children: [
      const Icon(Icons.nights_stay, color: gold, size: 42), const SizedBox(height: 18),
      Text(display, style: const TextStyle(fontSize: 58, fontWeight: FontWeight.w300)),
      const SizedBox(height: 16),
      Wrap(spacing: 8, children: [10, 20, 30].map((m) => OutlinedButton(onPressed: running ? null : () => setState(() => seconds = m * 60), child: Text('$m min'))).toList()),
      const SizedBox(height: 12),
      FilledButton.icon(onPressed: start, icon: Icon(running ? Icons.pause : Icons.play_arrow), label: Text(running ? 'Pause' : 'Begin focus')),
      const SizedBox(height: 8),
      TextButton(onPressed: () { timer?.cancel(); setState(() { seconds = 600; running = false; }); }, child: const Text('Reset')),
    ]))),
  ]);
}

class JourneyPage extends StatelessWidget {
  const JourneyPage({super.key, required this.completed, required this.streak});
  final int completed, streak;
  @override Widget build(BuildContext context) => ListView(children: [
    heading('Your Journey', 'Consistency grows through small returns.'),
    Padding(padding: const EdgeInsets.all(16), child: card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Your progress', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
      const SizedBox(height: 20), _journeyRow('Completed sessions', '$completed'),
      _journeyRow('Current streak', '$streak days'),
      const SizedBox(height: 12), const Text('Keep returning, without pressure. Every sincere effort matters.', style: TextStyle(color: muted)),
    ]))),
  ]);
}
Widget _journeyRow(String label, String value) => Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Row(children: [
  Expanded(child: Text(label, style: const TextStyle(color: muted))), Text(value, style: const TextStyle(color: gold, fontWeight: FontWeight.bold)),
]));
