import 'package:flutter/material.dart';
import '../../core/app_sync.dart';
import '../../core/models.dart';
import '../../core/palette.dart';
import '../../core/store.dart';
import '../../core/streaks.dart';
import '../../core/util.dart';
import '../../ui/common.dart';
import '../settings/settings_screen.dart';

class JourneyScreen extends StatefulWidget {
  const JourneyScreen({super.key});
  @override
  State<JourneyScreen> createState() => _JourneyScreenState();
}

class _JourneyScreenState extends State<JourneyScreen> {
  final NoorStore store = NoorStore.instance;
  bool showAll = false;

  Future<void> _openSession(SessionRecord s) async {
    final c = context.nc;
    final ctl = TextEditingController(text: s.note);
    final r = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${s.name} × ${s.count}'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${prettyDate(s.at)} · ${fmtTime(s.at)}', style: TextStyle(color: c.muted, fontSize: 12)),
          Text(s.targetMet ? 'Target of ${s.target} reached' : 'Ended at ${s.count} of ${s.target}', style: TextStyle(color: c.muted, fontSize: 12)),
          if (s.reflectionRef.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text('Reflection: ${s.reflectionRef}', style: TextStyle(color: c.gold2, fontSize: 12))),
          const SizedBox(height: 12),
          TextField(controller: ctl, maxLines: 3, maxLength: 200, decoration: noorField(ctx, hint: 'Note')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, '\u0000delete'), child: Text('Delete', style: TextStyle(color: c.danger))),
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: c.muted))),
          TextButton(onPressed: () => Navigator.pop(ctx, ctl.text), child: const Text('Save')),
        ],
      ),
    );
    if (r == null) return;
    if (r == '\u0000delete') {
      final ok = await confirmDialog(context, title: 'Delete this session?', message: 'It will be removed from your totals and streak history.', confirm: 'Delete', destructive: true);
      if (ok) {
        store.deleteSession(s.id);
        AppSync.soon();
      }
    } else {
      store.setSessionNote(s.id, r);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final st = store.streaks;
        final next = streakMilestones.firstWhere((n) => n > st.current, orElse: () => 100);
        final now = DateTime.now();
        final days = [for (var i = 6; i >= 0; i--) dayOffset(now, -i)];
        final counts = [for (final d in days) store.countOn(dateKey(d))];
        final maxC = counts.fold<int>(1, (a, b) => b > a ? b : a);
        final recent = store.sessions.reversed.toList();
        final shown = showAll ? recent : recent.take(10).toList();
        final focusRecent = store.focusRecords.reversed.take(6).toList();

        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
          children: [
            ScreenTitle('Steady, not perfect', 'Your journey',
                subtitle: 'A private record stored on this device.',
                trailing: IconButton(
                  tooltip: 'Backup & data',
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
                  icon: Icon(Icons.save_alt_rounded, color: c.gold),
                )),
            NoorCard(
              padding: const EdgeInsets.all(20),
              gradient: LinearGradient(colors: [c.gold.withValues(alpha: .13), c.panel2, c.panel], begin: Alignment.topLeft, end: Alignment.bottomRight, stops: const [0, .5, 1]),
              borderColor: c.gold.withValues(alpha: .3),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Eyebrow('Current streak'),
                const SizedBox(height: 6),
                Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${st.current}', style: TextStyle(fontFamily: kSerif, fontSize: 60, height: 1, color: c.gold)),
                  const SizedBox(width: 8),
                  Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('days', style: TextStyle(color: c.muted))),
                ]),
                const SizedBox(height: 4),
                Text(st.current > 0 ? 'You’ve shown up ${st.current} day${st.current == 1 ? '' : 's'} in a row.' : 'Complete both daily routines to begin your streak.',
                    style: TextStyle(fontSize: 12, color: c.muted)),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: (st.current / next).clamp(0.0, 1.0), minHeight: 5, backgroundColor: c.text.withValues(alpha: .08), valueColor: AlwaysStoppedAnimation(c.gold)),
                ),
                const SizedBox(height: 8),
                Row(children: [
                  Text('Best: ${st.best} days', style: TextStyle(fontSize: 11, color: c.muted)),
                  const Spacer(),
                  Text('Next milestone: $next days', style: TextStyle(fontSize: 11, color: c.muted)),
                ]),
              ]),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _Stat('Total counts', '${store.totalCount}', Icons.all_inclusive)),
              const SizedBox(width: 10),
              Expanded(child: _Stat('Sessions', '${store.sessions.length}', Icons.checklist_rounded)),
              const SizedBox(width: 10),
              Expanded(child: _Stat('Focus', fmtMinutes(store.totalFocusMinutes), Icons.spa_outlined)),
            ]),
            const SectionHeading('Milestones', 'Achievements'),
            GridView.count(
              crossAxisCount: 3, mainAxisSpacing: 10, crossAxisSpacing: 10, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(), childAspectRatio: .95,
              children: [
                for (final n in streakMilestones) _Achievement(n, st.best >= n),
              ],
            ),
            const SectionHeading('Last 7 days', 'Counts completed'),
            NoorCard(
              padding: const EdgeInsets.fromLTRB(14, 18, 14, 12),
              child: SizedBox(
                height: 120,
                child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  for (var i = 0; i < 7; i++)
                    Expanded(
                      child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                        if (counts[i] > 0) Text('${counts[i]}', style: TextStyle(fontSize: 9, color: c.muted)),
                        const SizedBox(height: 3),
                        Container(
                          width: 18, height: (counts[i] / maxC * 70).clamp(4.0, 70.0),
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(8), bottom: Radius.circular(3)),
                            color: counts[i] > 0 ? c.gold : c.panel2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(weekdayShort(days[i]), style: TextStyle(fontSize: 10, color: i == 6 ? c.gold : c.muted)),
                      ]),
                    ),
                ]),
              ),
            ),
            const SectionHeading('History', 'Dhikr sessions'),
            if (recent.isEmpty)
              NoorCard(child: Text('Finished sessions will appear here with their quantities.', style: TextStyle(fontSize: 12, color: c.muted)))
            else ...[
              for (final s in shown)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: NoorCard(
                    onTap: () => _openSession(s),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(s.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w600, color: c.text)),
                          Text('${prettyDate(s.at)} · ${fmtTime(s.at)}', style: TextStyle(fontSize: 11, color: c.muted)),
                          if (s.note.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 3), child: Text(s.note, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: c.gold2))),
                        ]),
                      ),
                      Text('× ${s.count}', style: TextStyle(fontFamily: kSerif, fontSize: 20, color: c.gold)),
                    ]),
                  ),
                ),
              if (recent.length > 10)
                TextButton(onPressed: () => setState(() => showAll = !showAll), child: Text(showAll ? 'Show fewer' : 'Show all ${recent.length}')),
            ],
            if (focusRecent.isNotEmpty) ...[
              const SectionHeading('History', 'Focus sessions'),
              for (final f in focusRecent)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: NoorCard(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(children: [
                      Icon(f.completed ? Icons.check_circle_rounded : Icons.timelapse_rounded, size: 20, color: f.completed ? c.green : c.muted),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(f.purpose.isEmpty ? 'Focus' : f.purpose, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w600, color: c.text)),
                          Text('${prettyDate(f.at)} · ${fmtTime(f.at)}', style: TextStyle(fontSize: 11, color: c.muted)),
                        ]),
                      ),
                      Text(fmtMinutes((f.actualSeconds / 60).round()), style: TextStyle(color: c.gold, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),
            ],
          ],
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  final IconData icon;
  const _Stat(this.label, this.value, this.icon);
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return NoorCard(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 18, color: c.gold),
        const SizedBox(height: 10),
        FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Text(value, style: TextStyle(fontFamily: kSerif, fontSize: 24, color: c.text))),
        const SizedBox(height: 2),
        Text(label.toUpperCase(), style: TextStyle(fontSize: 9, letterSpacing: 1, color: c.muted, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _Achievement extends StatelessWidget {
  final int days;
  final bool unlocked;
  const _Achievement(this.days, this.unlocked);
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Opacity(
      opacity: unlocked ? 1 : .45,
      child: NoorCard(
        padding: const EdgeInsets.all(10),
        borderColor: unlocked ? c.gold.withValues(alpha: .5) : null,
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: c.gold2)),
            child: Center(child: Text('$days', style: TextStyle(fontFamily: kSerif, fontSize: 19, color: c.gold))),
          ),
          const SizedBox(height: 8),
          Text('$days-day streak', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: c.text)),
          Text(unlocked ? 'Unlocked' : 'Keep going', style: TextStyle(fontSize: 9, color: c.muted)),
        ]),
      ),
    );
  }
}
