import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/app_sync.dart';
import '../core/palette.dart';
import '../core/store.dart';
import '../features/dhikr/dhikr_screen.dart';
import '../features/focus/focus_screen.dart';
import '../features/home/home_screen.dart';
import '../features/journey/journey_screen.dart';
import '../features/salah/salah_screen.dart';
import 'common.dart';
import 'splash.dart';

/// Lets any screen switch the bottom-nav tab (Home cards, widgets, etc.).
class ShellNav {
  static final ValueNotifier<int> tab = ValueNotifier<int>(0);
  static const home = 0, dhikr = 1, salah = 2, focus = 3, journey = 4;
}

class NoorApp extends StatelessWidget {
  const NoorApp({super.key});
  @override
  Widget build(BuildContext context) {
    final store = NoorStore.instance;
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) => MaterialApp(
        title: 'Noor',
        debugShowCheckedModeBanner: false,
        theme: buildNoorTheme(light: store.lightTheme),
        builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: store.lightTheme ? Brightness.dark : Brightness.light,
            systemNavigationBarColor: store.lightTheme ? NoorColors.light.bg : NoorColors.dark.bg,
            systemNavigationBarIconBrightness: store.lightTheme ? Brightness.dark : Brightness.light,
          ),
          child: child ?? const SizedBox.shrink(),
        ),
        home: const SplashGate(child: NoorShell()),
      ),
    );
  }
}

class NoorShell extends StatefulWidget {
  const NoorShell({super.key});
  @override
  State<NoorShell> createState() => _NoorShellState();
}

class _NoorShellState extends State<NoorShell> with WidgetsBindingObserver {
  static const _pages = <Widget>[HomeScreen(), DhikrScreen(), SalahScreen(), FocusScreen(), JourneyScreen()];

  /// Home-screen widgets open the app on a specific tab through this channel (see MainActivity.kt).
  static const MethodChannel _launch = MethodChannel('noor/launch');

  void _openTab(Object? t) {
    if (t is int && t >= 0 && t < _pages.length) ShellNav.tab.value = t;
  }

  Future<void> _readInitialTab() async {
    try {
      _openTab(await _launch.invokeMethod<int>('initialTab'));
    } catch (_) {
      // Not running on Android (e.g. tests): nothing to open.
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _launch.setMethodCallHandler((call) async {
      if (call.method == 'openTab') _openTab(call.arguments);
      return null;
    });
    _readInitialTab();
    AppSync.now();
  }

  @override
  void dispose() {
    _launch.setMethodCallHandler(null);
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      AppSync.soon(); // rolls the 14-day reminder window forward and refreshes widgets
    } else if (state == AppLifecycleState.paused) {
      NoorStore.instance.flush();
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    final store = NoorStore.instance;
    final reduced = MediaQuery.of(context).disableAnimations;
    return ListenableBuilder(
      listenable: Listenable.merge([ShellNav.tab, store]),
      builder: (context, _) {
        final index = ShellNav.tab.value;
        return Stack(children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(.8, -.9), radius: 1.3,
                colors: [c.gold.withValues(alpha: .05), Colors.transparent],
              ),
              color: c.bg,
            ),
          ),
        ),
        if (store.cosmos) Positioned.fill(child: CosmosBackground(animate: !reduced)),
        Scaffold(
          backgroundColor: Colors.transparent,
          body: SafeArea(
            bottom: false,
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: IndexedStack(index: index, children: _pages),
              ),
            ),
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: (v) => ShellNav.tab.value = v,
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
              NavigationDestination(icon: Icon(Icons.fingerprint), label: 'Dhikr'),
              NavigationDestination(icon: Icon(Icons.mosque_outlined), selectedIcon: Icon(Icons.mosque), label: 'Salah'),
              NavigationDestination(icon: Icon(Icons.spa_outlined), selectedIcon: Icon(Icons.spa), label: 'Focus'),
              NavigationDestination(icon: Icon(Icons.insights_outlined), selectedIcon: Icon(Icons.insights), label: 'Journey'),
            ],
          ),
        ),
      ]);
      },
    );
  }
}
