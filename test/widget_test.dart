import 'package:flutter_test/flutter_test.dart';
import 'package:noor/main.dart';

void main() {
  testWidgets('Noor opens with home and navigation', (tester) async {
    await tester.pumpWidget(const NoorApp());
    await tester.pumpAndSettle();
    expect(find.text('Assalamu Alaikum'), findsOneWidget);
    expect(find.text('Dhikr'), findsOneWidget);
    expect(find.text('Salah'), findsOneWidget);
  });
}
