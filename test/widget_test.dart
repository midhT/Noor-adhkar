import 'package:flutter_test/flutter_test.dart';
import 'package:noor/core/noor_app.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Noor launches and shows home navigation', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const NoorApp());
    await tester.pump();
    expect(find.text('NOOR'), findsOneWidget);
    expect(find.text('Salah'), findsOneWidget);
  });
}
