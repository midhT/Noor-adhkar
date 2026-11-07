import 'package:flutter/material.dart';
import '../../core/app_sync.dart';
import '../../core/data/dhikr_data.dart';
import '../../core/data/reflections.dart';
import '../../core/models.dart';
import '../../core/palette.dart';
import '../../core/store.dart';
import '../../core/util.dart';
import '../../ui/common.dart';
import 'completion_sheet.dart';
import 'library_sheet.dart';

/// The counter deliberately never shows the running total. Tapping advances a quiet
/// progress ring; the completed quantity appears only once the session has ended.
class DhikrScreen extends StatefulWidget {
  const DhikrScreen({super.key});
  @override
  State<DhikrScreen> createState() => _DhikrScreenState();
}

class _DhikrScreenState extends State<DhikrScreen> {
  final NoorStore store = NoorStore.instance;
  bool _finishing = false;

  Future<void> _tap() async {
    if (_finishing) return;
    if (!store.hasActive) store.startSession(store.selectedPreset);
    final r = store.tap();
    switch (r) {
      case TapResult.counted:
        tapHaptic();
        break;
      case TapResult.stepDone:
        tapHaptic(strong: true);
        break;
      case TapResult.sessionDone:
        tapHaptic(strong: true);
        await _finish();
        return;
    }
    if (mounted) setState(() {});
  }

  Future<void> _finish() async {
    final a = store.active;
    if (a == null || _finishing) return;
    if (a.total == 0) {
      store.discardSession();
      return;
    }
    _finishing = true;
    final presetId = a.presetId;
    final reflection = reflectionFor(presetId, store.sessions.length + dayOfYear(DateTime.now()));
    final rec = store.endSession(reflectionRef: reflection.reference);
    AppSync.soon(); // widgets show the new completed total
    if (rec != null && mounted) {
      final note = await showCompletionSheet(context, rec, reflection);
      if (note != null && note.trim().isNotEmpty) store.setSessionNote(rec.id, note);
    }
    _finishing = false;
    if (mounted) setState(() {});
  }

  Future<void> _discard() async {
    final ok = await confirmDialog(context,
        title: 'Discard this session?',
        message: 'Nothing from this session will be saved.',
        confirm: 'Discard', destructive: true);
    if (ok) store.discardSession();
  }

  Future<void> _editTarget(DhikrPreset p) async {
    final ctl = TextEditingController(text: '${store.targetsFor(p).first}');
    final v = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Session target'),
        content: TextField(
          controller: ctl, autofocus: true, keyboardType: TextInputType.number,
          decoration: noorField(ctx, label: 'Repetitions (1–10000)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: ctx.nc.muted))),
          TextButton(onPressed: () => Navigator.pop(ctx, int.tryParse(ctl.text.trim())), child: const Text('Save')),
        ],
      ),
    );
    if (v != null && v > 0) store.setTarget(p.id, v);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final preset = store.hasActive ? store.presetById(store.active!.presetId) : store.selectedPreset;
        final active = store.active;
        final targets = active?.targets ?? store.targetsFor(preset);
        final today = dateKey(DateTime.now());
        final todays = store.sessionsForDay(today);

        double progress = 0;
        if (active != null) progress = active.stepCount / active.currentTarget;
        final stepIdx = active?.step ?? 0;
        final step = preset.steps[stepIdx.clamp(0, preset.steps.length - 1)];

        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
          children: [
            ScreenTitle(
              'A moment of remembrance', 'Dhikr',
              subtitle: 'Count in stillness. Your total appears when the session ends.',
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(
                  tooltip: store.haptics ? 'Haptics on' : 'Haptics off',
                  onPressed: () => store.update(() => store.haptics = !store.haptics),
                  icon: Icon(store.haptics ? Icons.vibration : Icons.phone_android, color: c.gold),
                ),
                IconButton(
                  tooltip: 'Dhikr library',
                  onPressed: () => showLibrarySheet(context),
                  icon: Icon(Icons.library_books_outlined, color: c.gold),
                ),
              ]),
            ),
            NoorCard(
              onTap: active == null ? () => showLibrarySheet(context) : null,
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
              child: Column(children: [
                Row(children: [
                  Eyebrow(preset.category),
                  const Spacer(),
                  if (active == null) Icon(Icons.swap_horiz_rounded, size: 18, color: c.gold),
                ]),
                ArabicText(step.arabic, size: 30),
                Text(preset.isSet ? step.name : preset.name,
                    textAlign: TextAlign.center, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: c.text)),
                const SizedBox(height: 4),
                Text(step.meaning, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, height: 1.4, color: c.muted)),
                if (preset.isSet) ...[
                  const SizedBox(height: 12),
                  Wrap(spacing: 8, runSpacing: 6, alignment: WrapAlignment.center, children: [
                    for (var i = 0; i < preset.steps.length; i++)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          color: (active != null && i == stepIdx) ? c.gold.withValues(alpha: .18) : Colors.transparent,
                          border: Border.all(color: (active != null && i == stepIdx) ? c.gold : c.line),
                        ),
                        child: Text('${preset.steps[i].name} · ${targets[i]}',
                            style: TextStyle(fontSize: 11, color: (active != null && i == stepIdx) ? c.gold : c.muted)),
                      ),
                  ]),
                ],
              ]),
            ),
            if (active == null && !preset.isSet) ...[
              const SizedBox(height: 14),
              Row(children: [
                const Eyebrow('Session target'),
                const Spacer(),
                _StepBtn(icon: Icons.remove, onTap: () => store.setTarget(preset.id, targets.first - 1)),
                InkWell(
                  onTap: () => _editTarget(preset),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    child: Text('${targets.first}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: c.text)),
                  ),
                ),
                _StepBtn(icon: Icons.add, onTap: () => store.setTarget(preset.id, targets.first + 1)),
              ]),
              const SizedBox(height: 8),
              Wrap(spacing: 8, children: [
                for (final n in const [11, 33, 99, 100])
                  ChoiceChip(
                    label: Text('$n'), selected: targets.first == n,
                    onSelected: (_) => store.setTarget(preset.id, n),
                    selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                    side: BorderSide(color: targets.first == n ? c.gold : c.line),
                    labelStyle: TextStyle(color: targets.first == n ? c.gold : c.muted, fontSize: 12),
                    showCheckmark: false,
                  ),
              ]),
            ],
            const SizedBox(height: 18),
            Center(child: _TapCircle(progress: progress, active: active != null, onTap: _tap, label: preset.isSet && active != null ? step.name : null)),
            const SizedBox(height: 14),
            Center(
              child: Text(
                active == null
                    ? 'Tap the circle to begin. Target: ${preset.isSet ? preset.totalTarget : targets.first}.'
                    : (preset.isSet
                        ? 'Step ${stepIdx + 1} of ${preset.steps.length} · target ${targets[stepIdx]}'
                        : 'Target ${targets.first} · your count stays hidden until you finish'),
                textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: c.muted),
              ),
            ),
            if (active != null) ...[
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: OutlinedButton.icon(onPressed: _discard, icon: const Icon(Icons.close_rounded, size: 18), label: const Text('Discard'))),
                const SizedBox(width: 10),
                Expanded(flex: 2, child: FilledButton.icon(onPressed: _finish, icon: const Icon(Icons.check_rounded, size: 18), label: const Text('End session'))),
              ]),
            ],
            const SectionHeading('Today', 'Completed sessions'),
            if (todays.isEmpty)
              NoorCard(
                child: Text('Nothing completed yet today. When you end a session, its quantity is recorded here.',
                    style: TextStyle(fontSize: 12, height: 1.45, color: c.muted)),
              )
            else
              Column(children: [
                for (final s in todays.take(8)) Padding(padding: const EdgeInsets.only(bottom: 8), child: _SessionTile(s)),
              ]),
          ],
        );
      },
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _StepBtn({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Material(
      color: c.panel2, shape: CircleBorder(side: BorderSide(color: c.line)),
      child: InkWell(customBorder: const CircleBorder(), onTap: onTap, child: Padding(padding: const EdgeInsets.all(8), child: Icon(icon, size: 18, color: c.gold))),
    );
  }
}

class _TapCircle extends StatelessWidget {
  final double progress;
  final bool active;
  final VoidCallback onTap;
  final String? label;
  const _TapCircle({required this.progress, required this.active, required this.onTap, this.label});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return SizedBox(
      width: 250, height: 250,
      child: Stack(alignment: Alignment.center, children: [
        SizedBox(
          width: 250, height: 250,
          child: CustomPaint(painter: RingPainter(progress, c.gold, c.gold.withValues(alpha: .12), stroke: 5)),
        ),
        Container(
          width: 214, height: 214,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: c.gold.withValues(alpha: .10), blurRadius: 50, spreadRadius: 4)],
          ),
        ),
        Semantics(
          button: true, label: 'Count one dhikr',
          child: GestureDetector(
            onTap: onTap,
            child: Container(
              width: 206, height: 206,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(center: const Alignment(0, -.3), colors: [c.panel2, c.panel], radius: .9),
                border: Border.all(color: c.gold.withValues(alpha: .5)),
              ),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                CrescentMark(size: 44, color: c.gold.withValues(alpha: active ? 1 : .75)),
                const SizedBox(height: 8),
                Text(active ? 'TAP' : 'TAP TO BEGIN',
                    style: TextStyle(fontSize: 11, letterSpacing: 3, fontWeight: FontWeight.w800, color: c.gold)),
                if (label != null) ...[
                  const SizedBox(height: 4),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(label!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: c.muted)),
                  ),
                ],
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}

class _SessionTile extends StatelessWidget {
  final SessionRecord s;
  const _SessionTile(this.s);
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return NoorCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(children: [
        Icon(s.targetMet ? Icons.check_circle_rounded : Icons.timelapse_rounded, size: 20, color: s.targetMet ? c.green : c.muted),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w600, color: c.text)),
            Text(fmtTime(s.at), style: TextStyle(fontSize: 11, color: c.muted)),
          ]),
        ),
        Text('× ${s.count}', style: TextStyle(fontFamily: kSerif, fontSize: 20, color: c.gold)),
      ]),
    );
  }
}
