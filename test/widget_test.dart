import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:noor/main.dart';

void main() {
  testWidgets('Noor opens with home and navigation', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const NoorApp());

    // Allow asynchronous initialization without waiting for
    // the loading indicator's continuous animation to settle.
    for (var i = 0; i < 20; i++) {
      if (find.text('Assalamu Alaikum').evaluate().isNotEmpty) {
        break;
      }
      await tester.pump(const Duration(milliseconds: 100));
    }

    expect(find.text('Assalamu Alaikum'), findsOneWidget);
    expect(find.text('Dhikr'), findsOneWidget);
    expect(find.text('Salah'), findsOneWidget);
  });
}
