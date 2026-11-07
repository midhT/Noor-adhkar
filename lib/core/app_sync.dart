import 'dart:async';
import 'reminders.dart';
import 'widgets_service.dart';

/// Reschedules prayer reminders and refreshes widgets. Call [soon] after any setting that
/// affects them; it is debounced so rapid changes (e.g. a stepper) cost one reschedule.
class AppSync {
  static Timer? _t;

  static Future<void> now() async {
    await NoorReminders.sync();
    await NoorWidgets.pushAll();
  }

  static void soon() {
    _t?.cancel();
    _t = Timer(const Duration(milliseconds: 700), now);
  }
}
