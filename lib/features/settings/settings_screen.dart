import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/app_sync.dart';
import '../../core/palette.dart';
import '../../core/prayer.dart';
import '../../core/reminders.dart';
import '../../core/store.dart';
import '../../ui/common.dart';
import '../salah/salah_actions.dart';

/// Everything that can be configured. Any change that affects prayer times or reminders
/// triggers [AppSync.soon], which reschedules notifications and refreshes the widgets.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> with WidgetsBindingObserver {
  final NoorStore store = NoorStore.instance;
  bool _exact = false, _notif = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refreshPermissions();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refreshPermissions();
  }

  Future<void> _refreshPermissions() async {
    final e = await NoorReminders.exactAlarmsAllowed();
    final n = await NoorReminders.notificationsAllowed();
    if (!mounted) return;
    setState(() {
      _exact = e;
      _notif = n;
    });
  }

  void _prayerChanged(void Function() change) {
    store.update(change);
    AppSync.soon();
  }

  Future<void> _copyBackup() async {
    await Clipboard.setData(ClipboardData(text: store.exportJson()));
    if (mounted) showToast(context, 'Backup copied. Paste it into a note or message to keep it.');
  }

  Future<void> _import() async {
    final ctl = TextEditingController();
    final go = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Import history'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Paste a Noor V5 backup or a Noor V3 export. History is merged — nothing is overwritten.',
                style: TextStyle(color: ctx.nc.muted, fontSize: 12, height: 1.45)),
            const SizedBox(height: 12),
            TextField(controller: ctl, maxLines: 6, decoration: noorField(ctx, hint: 'Paste JSON here')),
            TextButton.icon(
              onPressed: () async {
                final d = await Clipboard.getData(Clipboard.kTextPlain);
                if (d?.text != null) ctl.text = d!.text!;
              },
              icon: const Icon(Icons.content_paste_rounded, size: 18),
              label: const Text('Paste from clipboard'),
            ),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: TextStyle(color: ctx.nc.muted))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Import')),
        ],
      ),
    );
    if (go != true) return;
    final err = store.importJson(ctl.text);
    if (!mounted) return;
    if (err != null) {
      showToast(context, err);
    } else {
      AppSync.soon();
      showToast(context, 'Imported ${store.lastImportAdded} new session${store.lastImportAdded == 1 ? '' : 's'}.');
    }
  }

  Future<void> _clear() async {
    final ok = await confirmDialog(context,
        title: 'Clear all Noor data?',
        message: 'This removes sessions, routines, streaks, custom dhikr, location and settings from this device. Copy a backup first if you want to keep your history.',
        confirm: 'Clear everything', destructive: true);
    if (!ok) return;
    await store.clearAll();
    await AppSync.now();
    if (mounted) showToast(context, 'All local data cleared.');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: c.bg, foregroundColor: c.text, elevation: 0, scrolledUnderElevation: 0,
        title: const Text('Settings'),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListenableBuilder(
              listenable: store,
              builder: (context, _) => ListView(
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 32),
                children: [
                  _prayerSection(c),
                  _reminderSection(c),
                  _appearanceSection(c),
                  _dataSection(c),
                  _aboutSection(c),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ------------------------------------------------------------------ prayer
  Widget _prayerSection(NoorColors c) {
    final hasLoc = store.lat != null && store.lon != null;
    final info = methodInfo(store.method);
    return _Section('Prayer times', [
      _Tile(
        title: hasLoc ? (store.placeName.isEmpty ? 'Saved location' : store.placeName) : 'No location set',
        subtitle: hasLoc ? '${store.lat!.toStringAsFixed(4)}, ${store.lon!.toStringAsFixed(4)}' : 'Needed to calculate prayer times',
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          IconButton(tooltip: 'Use GPS', onPressed: () => useGpsLocation(context), icon: Icon(Icons.my_location, color: c.gold)),
          IconButton(tooltip: 'Enter manually', onPressed: () => enterManualLocation(context), icon: Icon(Icons.edit_location_alt_outlined, color: c.gold)),
        ]),
      ),
      _Tile(
        title: 'Calculation method',
        subtitle: info.note,
        below: DropdownButton<String>(
          value: store.method, isExpanded: true, dropdownColor: c.panel2,
          underline: Container(height: 1, color: c.line),
          items: [for (final m in calcMethods) DropdownMenuItem(value: m.id, child: Text(m.label, overflow: TextOverflow.ellipsis))],
          onChanged: (v) {
            if (v != null) _prayerChanged(() => store.method = v);
          },
        ),
      ),
      _Tile(
        title: 'Asr calculation (madhab)',
        subtitle: store.madhab == 'hanafi' ? 'Hanafi — Asr when shadow is twice the object’s length' : 'Shafi‘i / Maliki / Hanbali — Asr when shadow equals the object’s length',
        below: SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'hanafi', label: Text('Hanafi')),
            ButtonSegment(value: 'shafi', label: Text('Shafi‘i')),
          ],
          selected: {store.madhab},
          onSelectionChanged: (v) => _prayerChanged(() => store.madhab = v.first),
          style: _segStyle(c),
        ),
      ),
      _Tile(
        title: 'High-latitude rule',
        subtitle: 'Used only where twilight never ends or never begins',
        below: DropdownButton<String>(
          value: store.highLat, isExpanded: true, dropdownColor: c.panel2,
          underline: Container(height: 1, color: c.line),
          items: [for (final e in highLatitudeOptions.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
          onChanged: (v) {
            if (v != null) _prayerChanged(() => store.highLat = v);
          },
        ),
      ),
      _Tile(
        title: 'Manual adjustments',
        subtitle: 'Minutes added to each calculated time, e.g. to match your local mosque',
        below: Column(children: [
          for (final k in kPrayerKeys5)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(children: [
                Expanded(child: Text(prayerLabels[k]!, style: TextStyle(color: c.text))),
                _Stepper(
                  value: store.adjust[k] ?? 0, min: -30, max: 30, suffix: ' min',
                  onChanged: (v) => _prayerChanged(() => store.adjust[k] = v),
                ),
              ]),
            ),
        ]),
      ),
      _Tile(
        title: '24-hour clock',
        subtitle: 'Applies to prayer times and reminders',
        trailing: Switch(value: store.use24h, onChanged: (v) => _prayerChanged(() => store.use24h = v)),
      ),
    ]);
  }

  // ------------------------------------------------------------------ reminders
  Widget _reminderSection(NoorColors c) {
    return _Section('Reminders', [
      _Tile(
        title: 'Prayer reminders',
        subtitle: 'A notification at each prayer time, rescheduled whenever your location, method or madhab changes',
        trailing: Switch(
          value: store.remindersOn,
          onChanged: (v) async {
            await setRemindersEnabled(context, v);
            _refreshPermissions();
          },
        ),
      ),
      if (store.remindersOn) ...[
        _Tile(
          title: 'Which prayers',
          below: Wrap(spacing: 8, runSpacing: 4, children: [
            for (final k in kPrayerKeys5)
              FilterChip(
                label: Text(prayerLabels[k]!), selected: store.remindPrayer[k] != false, showCheckmark: false,
                onSelected: (v) => _prayerChanged(() => store.remindPrayer[k] = v),
                selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                side: BorderSide(color: store.remindPrayer[k] != false ? c.gold : c.line),
                labelStyle: TextStyle(fontSize: 12, color: store.remindPrayer[k] != false ? c.gold : c.muted),
              ),
          ]),
        ),
        _Tile(
          title: 'Heads-up before the prayer',
          below: Wrap(spacing: 8, children: [
            for (final m in const [0, 5, 10, 15, 30])
              ChoiceChip(
                label: Text(m == 0 ? 'Off' : '$m min'), selected: store.leadMinutes == m, showCheckmark: false,
                onSelected: (_) => _prayerChanged(() => store.leadMinutes = m),
                selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                side: BorderSide(color: store.leadMinutes == m ? c.gold : c.line),
                labelStyle: TextStyle(fontSize: 12, color: store.leadMinutes == m ? c.gold : c.muted),
              ),
          ]),
        ),
        _Tile(
          title: 'Jamaat reminders',
          subtitle: 'For prayers where you saved a Jamaat time on the Salah tab',
          trailing: Switch(value: store.jamaatRemind, onChanged: (v) => _prayerChanged(() => store.jamaatRemind = v)),
        ),
      ],
      ValueListenableBuilder<ReminderStatus>(
        valueListenable: NoorReminders.status,
        builder: (context, st, _) => _Tile(
          title: 'Status',
          subtitle: st.message,
          below: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              'Notifications: ${_notif ? 'allowed' : 'blocked or not yet requested'}  ·  Exact alarms: ${_exact ? 'allowed' : 'not allowed'}',
              style: TextStyle(fontSize: 11, color: c.muted),
            ),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 4, children: [
              OutlinedButton.icon(
                onPressed: () async {
                  if (!await NoorReminders.notificationsAllowed()) {
                    await NoorReminders.requestNotificationPermission();
                  }
                  if (!await NoorReminders.notificationsAllowed()) {
                    if (mounted) showToast(context, 'Notifications are blocked. Allow them for Noor in system settings.');
                    return;
                  }
                  await NoorReminders.showTest();
                  _refreshPermissions();
                },
                icon: const Icon(Icons.notifications_none_rounded, size: 18),
                label: const Text('Send test'),
              ),
              if (!_exact)
                OutlinedButton.icon(
                  onPressed: () async {
                    await NoorReminders.requestExactAlarms();
                    _refreshPermissions();
                  },
                  icon: const Icon(Icons.alarm_on_rounded, size: 18),
                  label: const Text('Allow exact alarms'),
                ),
            ]),
          ]),
        ),
      ),
      _Tile(
        title: 'If reminders arrive late or not at all',
        subtitle: 'Some phone makers stop background alarms to save battery. Set Noor to “Unrestricted” in battery settings. Reminders are scheduled 14 days ahead and refresh whenever you open Noor.',
      ),
    ]);
  }

  // ------------------------------------------------------------------ appearance
  Widget _appearanceSection(NoorColors c) {
    return _Section('Feel & look', [
      _Tile(
        title: 'Haptic feedback',
        subtitle: 'A light tick when counting, a firmer one when a target is reached',
        trailing: Switch(value: store.haptics, onChanged: (v) => store.update(() => store.haptics = v)),
      ),
      _Tile(
        title: 'Theme',
        below: SegmentedButton<bool>(
          segments: const [
            ButtonSegment(value: false, label: Text('Navy & gold'), icon: Icon(Icons.nightlight_round, size: 18)),
            ButtonSegment(value: true, label: Text('Light'), icon: Icon(Icons.wb_sunny_outlined, size: 18)),
          ],
          selected: {store.lightTheme},
          onSelectionChanged: (v) => store.update(() => store.lightTheme = v.first),
          style: _segStyle(c),
        ),
      ),
      _Tile(
        title: 'Celestial motion',
        subtitle: 'Starfield and orbits behind the app. Follows the system “remove animations” setting.',
        trailing: Switch(value: store.cosmos, onChanged: (v) => store.update(() => store.cosmos = v)),
      ),
    ]);
  }

  // ------------------------------------------------------------------ data
  Widget _dataSection(NoorColors c) {
    return _Section('Your data', [
      _Tile(
        title: 'Stored on this device only',
        subtitle: '${store.sessions.length} dhikr sessions · ${store.focusRecords.length} focus sessions · no account, no analytics, no network use for core features.',
      ),
      _Tile(
        title: 'Copy backup',
        subtitle: 'Puts your history (sessions, routines, custom dhikr) on the clipboard as JSON',
        trailing: IconButton(onPressed: _copyBackup, icon: Icon(Icons.copy_rounded, color: c.gold)),
      ),
      _Tile(
        title: 'Import history',
        subtitle: 'Restore a Noor V5 backup, or bring over a Noor V3 export',
        trailing: IconButton(onPressed: _import, icon: Icon(Icons.download_rounded, color: c.gold)),
      ),
      _Tile(
        title: 'Clear all local data',
        subtitle: 'Cannot be undone',
        trailing: IconButton(onPressed: _clear, icon: Icon(Icons.delete_outline_rounded, color: c.danger)),
      ),
    ]);
  }

  Widget _aboutSection(NoorColors c) {
    return _Section('About', [
      _Tile(
        title: 'Noor 5.0',
        subtitle: 'A quiet space for daily remembrance. Offline-first and private by design. Designed and developed by Midhat.',
      ),
      _Tile(
        title: 'Religious content',
        subtitle: 'The Salah guide, adhkar and Qur’anic reflections are learning aids, not a fatwa. Arabic text, transliteration and translations should be reviewed by a qualified scholar. Prayer times are astronomical calculations — confirm with your local mosque.',
      ),
    ]);
  }

  ButtonStyle _segStyle(NoorColors c) => ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold.withValues(alpha: .18) : c.panel2),
        foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold : c.muted),
        side: WidgetStatePropertyAll(BorderSide(color: c.line)),
      );
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section(this.title, this.children);
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.only(left: 4, bottom: 10), child: Eyebrow(title)),
        NoorCard(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) Divider(height: 1, color: c.line),
              children[i],
            ],
          ]),
        ),
      ]),
    );
  }
}

class _Tile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing, below;
  const _Tile({required this.title, this.subtitle, this.trailing, this.below});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: c.text)),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(subtitle!, style: TextStyle(fontSize: 11.5, height: 1.45, color: c.muted)),
              ],
            ]),
          ),
          if (trailing != null) trailing!,
        ]),
        if (below != null) ...[const SizedBox(height: 8), below!],
      ]),
    );
  }
}

class _Stepper extends StatelessWidget {
  final int value, min, max;
  final String suffix;
  final ValueChanged<int> onChanged;
  const _Stepper({required this.value, required this.min, required this.max, required this.onChanged, this.suffix = ''});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      IconButton(
        visualDensity: VisualDensity.compact,
        onPressed: value > min ? () => onChanged(value - 1) : null,
        icon: Icon(Icons.remove_circle_outline, color: c.gold),
      ),
      SizedBox(
        width: 64,
        child: Text('${value > 0 ? '+' : ''}$value$suffix', textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w600, color: value == 0 ? c.muted : c.gold)),
      ),
      IconButton(
        visualDensity: VisualDensity.compact,
        onPressed: value < max ? () => onChanged(value + 1) : null,
        icon: Icon(Icons.add_circle_outline, color: c.gold),
      ),
    ]);
  }
}
