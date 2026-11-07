import 'package:flutter/material.dart';
import '../../core/app_sync.dart';
import '../../core/data/duas.dart';
import '../../core/data/salah_guide.dart';
import '../../core/palette.dart';
import '../../core/prayer.dart';
import '../../core/store.dart';
import '../../core/util.dart';
import '../../ui/common.dart';
import '../settings/settings_screen.dart';
import 'salah_actions.dart';

class SalahScreen extends StatefulWidget {
  const SalahScreen({super.key});
  @override
  State<SalahScreen> createState() => _SalahScreenState();
}

class _SalahScreenState extends State<SalahScreen> {
  final NoorStore store = NoorStore.instance;
  int tab = 0;
  String query = '';

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
        children: [
          const ScreenTitle('Prayer & learning', 'Salah', subtitle: 'Times calculated on your device, and a step-by-step guide.'),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Times'), icon: Icon(Icons.schedule_rounded)),
              ButtonSegment(value: 1, label: Text('Learn'), icon: Icon(Icons.menu_book_outlined)),
            ],
            selected: {tab},
            onSelectionChanged: (v) => setState(() => tab = v.first),
            style: ButtonStyle(
              backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold.withValues(alpha: .18) : c.panel),
              foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold : c.muted),
              side: WidgetStatePropertyAll(BorderSide(color: c.line)),
            ),
          ),
          const SizedBox(height: 16),
          if (tab == 0) ..._times(context) else ..._learn(context),
        ],
      ),
    );
  }

  // ------------------------------------------------------------------ times
  List<Widget> _times(BuildContext context) {
    final c = context.nc;
    final hasLoc = store.lat != null && store.lon != null;
    final info = methodInfo(store.method);
    return [
      NoorCard(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.location_on_outlined, color: c.gold, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                hasLoc ? (store.placeName.isEmpty ? 'Saved location' : store.placeName) : 'No location set',
                style: TextStyle(fontWeight: FontWeight.w700, color: c.text),
              ),
            ),
          ]),
          if (hasLoc)
            Padding(
              padding: const EdgeInsets.only(left: 28, top: 2),
              child: Text('${store.lat!.toStringAsFixed(4)}, ${store.lon!.toStringAsFixed(4)}', style: TextStyle(fontSize: 11, color: c.muted)),
            )
          else
            Padding(
              padding: const EdgeInsets.only(left: 28, top: 4),
              child: Text('Use GPS or enter coordinates. Nothing leaves your device.', style: TextStyle(fontSize: 12, height: 1.4, color: c.muted)),
            ),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: FilledButton.icon(onPressed: () => useGpsLocation(context), icon: const Icon(Icons.my_location, size: 18), label: const Text('Use GPS'))),
            const SizedBox(width: 10),
            Expanded(child: OutlinedButton.icon(onPressed: () => enterManualLocation(context), icon: const Icon(Icons.edit_location_alt_outlined, size: 18), label: const Text('Manual'))),
          ]),
        ]),
      ),
      if (hasLoc)
        LiveClock(builder: (context, now) {
          final st = PrayerController.instance.stateAt(now);
          if (st == null) {
            return Padding(
              padding: const EdgeInsets.only(top: 12),
              child: NoorCard(child: Text(PrayerController.instance.lastError ?? 'Prayer times are unavailable for this location.', style: TextStyle(color: c.muted))),
            );
          }
          return Column(children: [
            const SizedBox(height: 12),
            NoorCard(
              padding: const EdgeInsets.all(18),
              gradient: LinearGradient(colors: [c.gold.withValues(alpha: .14), c.panel], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderColor: c.gold.withValues(alpha: .35),
              child: Row(children: [
                SizedBox(
                  width: 74, height: 74,
                  child: Stack(alignment: Alignment.center, children: [
                    CustomPaint(size: const Size(74, 74), painter: RingPainter(st.progress(now), c.gold, c.gold.withValues(alpha: .15), stroke: 4)),
                    Icon(Icons.access_time_rounded, color: c.gold, size: 26),
                  ]),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Eyebrow(st.current == null ? 'Next prayer' : 'Now ${st.current!.name} · next'),
                    const SizedBox(height: 4),
                    Text('${st.next.name} · ${fmtTime(st.next.time)}', style: TextStyle(fontFamily: kSerif, fontSize: 22, color: c.text)),
                    const SizedBox(height: 2),
                    Text('in ${fmtCountdown(st.remaining(now))}',
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.w300, color: c.gold, fontFeatures: kTabular)),
                  ]),
                ),
              ]),
            ),
            const SizedBox(height: 12),
            for (final e in st.today)
              Padding(padding: const EdgeInsets.only(bottom: 8), child: _PrayerRow(entry: e, state: st, now: now)),
          ]);
        }),
      const SizedBox(height: 4),
      NoorCard(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.notifications_active_outlined, color: c.gold, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Prayer reminders', style: TextStyle(fontWeight: FontWeight.w700, color: c.text)),
                Text(store.remindersOn ? 'On — tap a bell below to mute a prayer' : 'Off', style: TextStyle(fontSize: 11, color: c.muted)),
              ]),
            ),
            Switch(value: store.remindersOn, onChanged: (v) => setRemindersEnabled(context, v)),
          ]),
        ]),
      ),
      const SizedBox(height: 12),
      NoorCard(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Eyebrow('Calculation'),
              const SizedBox(height: 4),
              Text(info.label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.text)),
              Text('Asr: ${store.madhab == 'hanafi' ? 'Hanafi (later Asr)' : 'Shafi‘i (earlier Asr)'}', style: TextStyle(fontSize: 12, color: c.muted)),
            ]),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
            child: const Text('Change'),
          ),
        ]),
      ),
      const SizedBox(height: 10),
      Text('Sunrise is shown for reference — it is not a prayer time. After Isha the countdown continues to tomorrow’s Fajr.',
          style: TextStyle(fontSize: 11, height: 1.5, color: c.muted)),
    ];
  }

  // ------------------------------------------------------------------ learn
  List<Widget> _learn(BuildContext context) {
    final c = context.nc;
    final q = query.toLowerCase().trim();
    final steps = salahGuide.where((x) => q.isEmpty || '${x.title} ${x.place} ${x.latin} ${x.meaning}'.toLowerCase().contains(q)).toList();
    return [
      NoorCard(
        padding: const EdgeInsets.all(18),
        gradient: LinearGradient(colors: [c.panel2, c.panel], begin: Alignment.topLeft, end: Alignment.bottomRight),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Eyebrow('Default learning path'),
          const SizedBox(height: 6),
          Text('Hanafi method', style: TextStyle(fontFamily: kSerif, fontSize: 24, color: c.text)),
          const SizedBox(height: 6),
          Text('Content follows commonly taught Hanafi practice. Recognised differences exist; use this as a learning aid and verify details with a trusted scholar.',
              style: TextStyle(fontSize: 12, height: 1.55, color: c.muted)),
        ]),
      ),
      const SizedBox(height: 12),
      TextField(
        onChanged: (v) => setState(() => query = v),
        decoration: noorField(context, hint: 'Search a position or recitation…').copyWith(prefixIcon: Icon(Icons.search, color: c.gold)),
      ),
      const SizedBox(height: 12),
      if (steps.isEmpty) Padding(padding: const EdgeInsets.all(20), child: Text('Nothing matches your search.', textAlign: TextAlign.center, style: TextStyle(color: c.muted))),
      for (final s in steps)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: NoorCard(
            padding: EdgeInsets.zero,
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                iconColor: c.gold, collapsedIconColor: c.gold,
                title: Text(s.title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: c.text)),
                subtitle: Text(s.place, style: TextStyle(fontSize: 11, color: c.muted)),
                children: [
                  ArabicText(s.arabic, size: 24),
                  const SizedBox(height: 6),
                  Text(s.latin, textAlign: TextAlign.center, style: TextStyle(fontStyle: FontStyle.italic, height: 1.5, color: c.text)),
                  const SizedBox(height: 8),
                  Text(s.meaning, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, height: 1.55, color: c.muted)),
                  const SizedBox(height: 10),
                  Text('Reference / note: ${s.source}', style: TextStyle(fontSize: 11, height: 1.5, color: c.gold2)),
                ],
              ),
            ),
          ),
        ),
      const SectionHeading('Supplications', 'Duas'),
      for (final d in duas)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: NoorCard(
            padding: const EdgeInsets.all(18),
            child: Column(children: [
              ArabicText(d.arabic, size: 22),
              const SizedBox(height: 6),
              Text(d.meaning, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, height: 1.5, color: c.text)),
              const SizedBox(height: 6),
              Text(d.reference, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: c.muted)),
            ]),
          ),
        ),
      const SizedBox(height: 6),
      Text('Translations communicate the general meaning. Transliteration cannot fully represent Arabic pronunciation. Qur’anic text and prayer details should be reviewed by a qualified editor before public release.',
          style: TextStyle(fontSize: 11, height: 1.55, color: c.muted)),
    ];
  }
}

class _PrayerRow extends StatelessWidget {
  final PrayerEntry entry;
  final PrayerState state;
  final DateTime now;
  const _PrayerRow({required this.entry, required this.state, required this.now});

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    final s = NoorStore.instance;
    final isCurrent = state.current != null && state.current!.key == entry.key && state.current!.time == entry.time;
    final isNext = state.next.key == entry.key && state.next.time == entry.time;
    final passed = entry.time.isBefore(now);
    final obligatory = !entry.isSunrise;
    final jamaat = s.jamaat[entry.key];
    final muted = s.remindPrayer[entry.key] == false;
    return NoorCard(
      padding: const EdgeInsets.fromLTRB(16, 10, 6, 10),
      borderColor: isNext ? c.gold : (isCurrent ? c.green.withValues(alpha: .6) : null),
      color: isNext ? c.gold.withValues(alpha: .07) : null,
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text(entry.name, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: passed && !isCurrent ? c.muted : c.text)),
              if (isNext) _Badge('NEXT', c.gold),
              if (isCurrent) _Badge('NOW', c.green),
            ]),
            if (obligatory)
              InkWell(
                onTap: () => _editJamaat(context),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Text(
                    jamaat == null ? 'Add Jamaat time' : 'Jamaat · ${fmtClockString(jamaat)}',
                    style: TextStyle(fontSize: 11, color: jamaat == null ? c.muted : c.gold2),
                  ),
                ),
              )
            else
              Text('Reference only', style: TextStyle(fontSize: 11, color: c.muted)),
          ]),
        ),
        Text(fmtTime(entry.time), style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: passed && !isCurrent ? c.muted : c.gold)),
        if (obligatory)
          IconButton(
            tooltip: muted ? 'Reminder muted' : 'Reminder on',
            onPressed: () {
              s.update(() => s.remindPrayer[entry.key] = muted);
              AppSync.soon();
              if (!s.remindersOn) showToast(context, 'Turn on prayer reminders above to receive alerts.');
            },
            icon: Icon(muted ? Icons.notifications_off_outlined : Icons.notifications_active_outlined, size: 20, color: muted ? c.muted : c.gold),
          )
        else
          const SizedBox(width: 12),
      ]),
    );
  }

  Future<void> _editJamaat(BuildContext context) async {
    final s = NoorStore.instance;
    final existing = parseClock(s.jamaat[entry.key]);
    if (existing != null) {
      final choice = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('${entry.name} Jamaat'),
          content: Text('Saved Jamaat time: ${fmtClockString(s.jamaat[entry.key]!)}', style: TextStyle(color: ctx.nc.muted)),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, 'remove'), child: Text('Remove', style: TextStyle(color: ctx.nc.danger))),
            TextButton(onPressed: () => Navigator.pop(ctx, 'change'), child: const Text('Change')),
          ],
        ),
      );
      if (choice == 'remove') {
        s.update(() => s.jamaat.remove(entry.key));
        AppSync.soon();
        return;
      }
      if (choice != 'change') return;
    }
    if (!context.mounted) return;
    final initial = existing != null ? TimeOfDay(hour: existing.$1, minute: existing.$2) : TimeOfDay.fromDateTime(entry.time);
    final picked = await showTimePicker(context: context, initialTime: initial, helpText: '${entry.name} Jamaat time');
    if (picked != null) {
      s.update(() => s.jamaat[entry.key] = '${two(picked.hour)}:${two(picked.minute)}');
      AppSync.soon();
    }
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;
  const _Badge(this.text, this.color);
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(left: 8),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), border: Border.all(color: color)),
        child: Text(text, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1, color: color)),
      );
}
