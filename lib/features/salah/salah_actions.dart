import 'package:flutter/material.dart';
import '../../core/app_sync.dart';
import '../../core/palette.dart';
import '../../core/prayer.dart';
import '../../core/reminders.dart';
import '../../core/store.dart';
import '../../ui/common.dart';

String _clean(Object e) => e.toString().replaceFirst('Exception: ', '');

Future<void> useGpsLocation(BuildContext context) async {
  showToast(context, 'Finding your location…');
  try {
    final pos = await PrayerService.locate();
    final s = NoorStore.instance;
    s.update(() {
      s.lat = pos.latitude;
      s.lon = pos.longitude;
      s.placeName = 'Current location';
    });
    AppSync.soon();
    if (context.mounted) showToast(context, 'Location saved. Prayer times updated.');
  } catch (e) {
    if (context.mounted) showToast(context, _clean(e));
  }
}

Future<void> enterManualLocation(BuildContext context) async {
  final s = NoorStore.instance;
  final latC = TextEditingController(text: s.lat?.toStringAsFixed(4) ?? '');
  final lonC = TextEditingController(text: s.lon?.toStringAsFixed(4) ?? '');
  final nameC = TextEditingController(text: s.placeName == 'Current location' ? '' : s.placeName);
  String? error;
  final saved = await showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setSt) => AlertDialog(
        title: const Text('Enter location'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: nameC, decoration: noorField(ctx, label: 'Place name (optional)')),
            const SizedBox(height: 12),
            TextField(
              controller: latC,
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
              decoration: noorField(ctx, label: 'Latitude (−90 to 90)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: lonC,
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
              decoration: noorField(ctx, label: 'Longitude (−180 to 180)'),
            ),
            if (error != null)
              Padding(padding: const EdgeInsets.only(top: 10), child: Text(error!, style: TextStyle(color: ctx.nc.danger, fontSize: 12))),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: TextStyle(color: ctx.nc.muted))),
          TextButton(
            onPressed: () {
              final la = double.tryParse(latC.text.trim().replaceAll('−', '-'));
              final lo = double.tryParse(lonC.text.trim().replaceAll('−', '-'));
              if (la == null || lo == null || la < -90 || la > 90 || lo < -180 || lo > 180) {
                setSt(() => error = 'Enter a valid latitude and longitude.');
                return;
              }
              s.update(() {
                s.lat = la;
                s.lon = lo;
                s.placeName = nameC.text.trim().isEmpty ? 'Saved coordinates' : nameC.text.trim();
              });
              Navigator.pop(ctx, true);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    ),
  );
  if (saved == true) AppSync.soon();
}

/// Turns reminders on/off. Turning on asks for notification permission and, when needed,
/// offers the Android "Alarms & reminders" screen so alerts fire on time.
Future<void> setRemindersEnabled(BuildContext context, bool on) async {
  final s = NoorStore.instance;
  if (!on) {
    s.update(() => s.remindersOn = false);
    await NoorReminders.sync();
    return;
  }
  var ok = await NoorReminders.notificationsAllowed();
  if (!ok) ok = await NoorReminders.requestNotificationPermission();
  if (!ok) {
    if (context.mounted) showToast(context, 'Notifications are blocked. Allow them for Noor in system settings.');
    return;
  }
  s.update(() => s.remindersOn = true);
  if (!await NoorReminders.exactAlarmsAllowed() && context.mounted) {
    final go = await confirmDialog(context,
        title: 'Allow exact alarms?',
        message: 'For prayer reminders to arrive on the minute, Android needs “Alarms & reminders” enabled for Noor. Without it they can arrive a few minutes late.',
        confirm: 'Open settings');
    if (go) await NoorReminders.requestExactAlarms();
  }
  final st = await NoorReminders.sync();
  if (context.mounted) showToast(context, st.message);
}
