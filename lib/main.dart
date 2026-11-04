import 'package:flutter/material.dart';
import 'core/noor_app.dart';
import 'core/notifications.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NoorNotifications.initialize();
  runApp(const NoorApp());
}
