import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/reminders.dart';
import 'core/store.dart';
import 'ui/shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
  await NoorStore.instance.load();
  try {
    await NoorReminders.initialize();
  } catch (e) {
    debugPrint('Notifications unavailable: $e');
  }
  runApp(const NoorApp());
}
