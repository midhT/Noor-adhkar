import 'package:flutter/material.dart';
import 'theme.dart';
import '../features/home/home_screen.dart';
import '../features/salah/salah_screen.dart';
import '../features/tasbeeh/tasbeeh_screen.dart';
import '../features/quran/quran_screen.dart';
import '../features/settings/settings_screen.dart';

class NoorApp extends StatelessWidget {
  const NoorApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Noor', debugShowCheckedModeBanner: false,
    theme: NoorTheme.dark(), home: const NoorShell(),
  );
}

class NoorShell extends StatefulWidget {
  const NoorShell({super.key});
  @override State<NoorShell> createState() => _NoorShellState();
}
class _NoorShellState extends State<NoorShell> {
  int index = 0;
  final pages = const [HomeScreen(), SalahScreen(), TasbeehScreen(), QuranScreen(), SettingsScreen()];
  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: IndexedStack(index: index, children: pages)),
    bottomNavigationBar: NavigationBar(
      selectedIndex: index,
      onDestinationSelected: (v) => setState(() => index = v),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.grid_view_rounded), label: 'Home'),
        NavigationDestination(icon: Icon(Icons.mosque_outlined), label: 'Salah'),
        NavigationDestination(icon: Icon(Icons.fingerprint), label: 'Dhikr'),
        NavigationDestination(icon: Icon(Icons.menu_book_outlined), label: 'Quran'),
        NavigationDestination(icon: Icon(Icons.tune), label: 'Settings'),
      ],
    ),
  );
}
