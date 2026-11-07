import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/store.dart';
import 'package:noor/ui/shell.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('app opens to the five-tab shell and has no Quran tab', (tester) async {
    // Test fonts are far wider than real ones, so layout-overflow reports are not meaningful here.
    final original = FlutterError.onError;
    FlutterError.onError = (d) {
      if (d.toString().contains('overflowed')) return;
      original?.call(d);
    };
    addTearDown(() => FlutterError.onError = original);

    SharedPreferences.setMockInitialValues({});
    await NoorStore.instance.load();
    await NoorStore.instance.clearAll();

    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 3.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const NoorApp());
    await tester.pump(const Duration(milliseconds: 2300)); // branded intro
    await tester.pump(const Duration(milliseconds: 800)); // cross-fade to the app

    expect(find.byType(NavigationDestination), findsNWidgets(5));
    for (final label in const ['Home', 'Dhikr', 'Salah', 'Focus', 'Journey']) {
      expect(find.text(label), findsWidgets, reason: label);
    }
    expect(find.text('Quran'), findsNothing);
  });
}
