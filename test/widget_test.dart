import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/noor_app.dart';

void main() {
  testWidgets('Noor launches and shows home navigation', (tester) async {
    await tester.pumpWidget(const NoorApp());
    expect(find.text('NOOR'), findsOneWidget);
    expect(find.text('Salah'), findsOneWidget);
  });
}
