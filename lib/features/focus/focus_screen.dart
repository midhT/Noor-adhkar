import 'package:flutter/material.dart';
import '../../core/audio_service.dart';
import '../../core/data/reflections.dart';
import '../../core/models.dart';
import '../../core/palette.dart';
import '../../core/reminders.dart';
import '../../core/store.dart';
import '../../core/util.dart';
import '../../ui/common.dart';

/// Focus Studio. The timer is wall-clock based (an end timestamp), so it stays correct
/// across screen-off, backgrounding and app restarts; a notification fires at the end.
class FocusScreen extends StatefulWidget {
  const FocusScreen({super.key});
  @override
  State<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends State<FocusScreen> {
  final NoorStore store = NoorStore.instance;
  final FocusAudio audio = FocusAudio.instance;
  bool _completing = false;
  bool _previewing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Session was running when the app was restarted: resume the audio if enabled.
      if (store.focusState == 'running' && store.audioOn && !audio.playing) _startAudio(quiet: true);
    });
  }

  int _remaining(DateTime now) {
    switch (store.focusState) {
      case 'running':
        final ms = store.focusEndMs - now.millisecondsSinceEpoch;
        return ms <= 0 ? 0 : (ms / 1000).ceil();
      case 'paused':
        return store.focusRemainSec;
      default:
        return store.focusMinutes * 60;
    }
  }

  Future<void> _startAudio({bool quiet = false}) async {
    final err = await audio.start();
    if (err != null && mounted && !quiet) {
      showToast(context, err);
      store.update(() => store.audioOn = false);
    }
  }

  Future<void> _start() async {
    final total = store.focusState == 'paused' ? store.focusRemainSec : store.focusMinutes * 60;
    final end = DateTime.now().add(Duration(seconds: total));
    store.update(() {
      if (store.focusState == 'idle') store.focusPlannedSec = total;
      store.focusState = 'running';
      store.focusEndMs = end.millisecondsSinceEpoch;
    });
    tapHaptic();
    NoorReminders.scheduleFocusEnd(end, (store.focusPlannedSec / 60).round());
    if (store.audioOn) await _startAudio();
  }

  void _pause() {
    final rem = _remaining(DateTime.now());
    store.update(() {
      store.focusState = 'paused';
      store.focusRemainSec = rem;
    });
    NoorReminders.cancelFocusEnd();
    audio.stop();
  }

  Future<void> _reset() async {
    if (store.focusState != 'idle') {
      final ok = await confirmDialog(context,
          title: 'Reset this session?', message: 'The timer returns to the start and this session is not recorded.', confirm: 'Reset', destructive: true);
      if (!ok) return;
    }
    store.update(() => store.focusState = 'idle');
    NoorReminders.cancelFocusEnd();
    audio.stop();
  }

  Future<void> _finishEarly() async {
    final rem = _remaining(DateTime.now());
    final elapsed = store.focusPlannedSec - rem;
    final ok = await confirmDialog(context,
        title: 'End session now?',
        message: elapsed >= 30 ? 'The time you spent will be saved to your journey.' : 'Less than 30 seconds elapsed, so it will not be recorded.',
        confirm: 'End session');
    if (!ok) return;
    store.update(() {
      if (elapsed >= 30) {
        store.addFocusRecord(FocusRecord(
            at: DateTime.now(), plannedMinutes: (store.focusPlannedSec / 60).round(), actualSeconds: elapsed,
            purpose: store.focusPurpose, completed: false));
      }
      store.focusState = 'idle';
    });
    NoorReminders.cancelFocusEnd();
    audio.stop();
  }

  Future<void> _complete() async {
    if (_completing) return;
    _completing = true;
    final planned = store.focusPlannedSec > 0 ? store.focusPlannedSec : store.focusMinutes * 60;
    final purpose = store.focusPurpose;
    store.update(() {
      store.addFocusRecord(FocusRecord(
          at: DateTime.now(), plannedMinutes: (planned / 60).round(), actualSeconds: planned, purpose: purpose, completed: true));
      store.focusState = 'idle';
    });
    audio.stop();
    tapHaptic(strong: true);
    if (mounted) {
      final r = reflectionFor('tahlil', store.focusRecords.length);
      final c = context.nc;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Column(children: [
            CrescentMark(size: 44, color: c.gold),
            const SizedBox(height: 8),
            const Text('Session complete', textAlign: TextAlign.center),
          ]),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('${fmtMinutes((planned / 60).round())} · $purpose', textAlign: TextAlign.center, style: TextStyle(color: c.muted, fontSize: 13)),
              const SizedBox(height: 14),
              ArabicText(r.arabic, size: 22),
              Text(r.translation, textAlign: TextAlign.center, style: TextStyle(height: 1.5, color: c.text, fontSize: 13)),
              const SizedBox(height: 6),
              Text(r.reference, style: TextStyle(fontSize: 11, color: c.muted)),
            ]),
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done'))],
        ),
      );
    }
    _completing = false;
  }

  Future<void> _customMinutes() async {
    final ctl = TextEditingController(text: '${store.focusMinutes}');
    final v = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Custom length'),
        content: TextField(controller: ctl, autofocus: true, keyboardType: TextInputType.number, decoration: noorField(ctx, label: 'Minutes (1–240)')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: ctx.nc.muted))),
          TextButton(onPressed: () => Navigator.pop(ctx, int.tryParse(ctl.text.trim())), child: const Text('Set')),
        ],
      ),
    );
    if (v != null && v >= 1 && v <= 240) store.update(() => store.focusMinutes = v);
  }

  Future<void> _togglePreview() async {
    if (_previewing) {
      await audio.stop();
      setState(() => _previewing = false);
      return;
    }
    final err = await audio.start();
    if (err != null) {
      if (mounted) showToast(context, err);
      return;
    }
    setState(() => _previewing = true);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final state = store.focusState;
        final today = dateKey(DateTime.now());
        const presets = [5, 10, 20, 30];
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
          children: [
            const ScreenTitle('A quiet space', 'Focus Studio', subtitle: 'Set aside a little time for remembrance, reading, or reflection.'),
            LiveClock(builder: (context, now) {
              final rem = _remaining(now);
              if (state == 'running' && rem <= 0) {
                WidgetsBinding.instance.addPostFrameCallback((_) => _complete());
              }
              final planned = state == 'idle' ? store.focusMinutes * 60 : (store.focusPlannedSec > 0 ? store.focusPlannedSec : store.focusMinutes * 60);
              final progress = state == 'idle' ? 0.0 : (1 - rem / planned).clamp(0.0, 1.0);
              return Center(
                child: SizedBox(
                  width: 270, height: 270,
                  child: Stack(alignment: Alignment.center, children: [
                    Container(
                      width: 240, height: 240,
                      decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: c.gold.withValues(alpha: state == 'running' ? .16 : .07), blurRadius: 60, spreadRadius: 6)]),
                    ),
                    CustomPaint(size: const Size(270, 270), painter: RingPainter(progress, c.gold, c.gold.withValues(alpha: .12), stroke: 5)),
                    Container(
                      width: 232, height: 232,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(center: const Alignment(0, -.3), colors: [c.panel2, c.panel]),
                        border: Border.all(color: c.gold.withValues(alpha: .35)),
                      ),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(
                          state == 'running' ? 'FOCUS IN PROGRESS' : (state == 'paused' ? 'PAUSED' : 'READY WHEN YOU ARE'),
                          style: TextStyle(fontSize: 9, letterSpacing: 2.2, fontWeight: FontWeight.w800, color: c.muted),
                        ),
                        const SizedBox(height: 6),
                        Text(fmtCountdown(Duration(seconds: rem)),
                            style: TextStyle(fontSize: 54, fontWeight: FontWeight.w300, color: c.gold, fontFeatures: kTabular)),
                        const SizedBox(height: 4),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 26),
                          child: Text(store.focusPurpose, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: c.muted)),
                        ),
                      ]),
                    ),
                  ]),
                ),
              );
            }),
            const SizedBox(height: 16),
            if (state == 'idle') ...[
              Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
                for (final m in presets)
                  ChoiceChip(
                    label: Text('$m min'), selected: store.focusMinutes == m, showCheckmark: false,
                    onSelected: (_) => store.update(() => store.focusMinutes = m),
                    selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                    side: BorderSide(color: store.focusMinutes == m ? c.gold : c.line),
                    labelStyle: TextStyle(color: store.focusMinutes == m ? c.gold : c.muted),
                  ),
                ChoiceChip(
                  label: Text(presets.contains(store.focusMinutes) ? 'Custom' : '${store.focusMinutes} min'),
                  selected: !presets.contains(store.focusMinutes), showCheckmark: false,
                  onSelected: (_) => _customMinutes(),
                  selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                  side: BorderSide(color: !presets.contains(store.focusMinutes) ? c.gold : c.line),
                  labelStyle: TextStyle(color: !presets.contains(store.focusMinutes) ? c.gold : c.muted),
                ),
              ]),
              const SizedBox(height: 16),
              NoorCard(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Eyebrow('Session intention'),
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final p in kFocusPurposes)
                      ChoiceChip(
                        label: Text(p), selected: store.focusPurpose == p, showCheckmark: false,
                        onSelected: (_) => store.update(() => store.focusPurpose = p),
                        selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                        side: BorderSide(color: store.focusPurpose == p ? c.gold : c.line),
                        labelStyle: TextStyle(fontSize: 12, color: store.focusPurpose == p ? c.gold : c.muted),
                      ),
                  ]),
                ]),
              ),
            ],
            const SizedBox(height: 16),
            if (state == 'idle')
              SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: _start, icon: const Icon(Icons.play_arrow_rounded), label: const Text('Start focus')))
            else
              Row(children: [
                Expanded(
                  child: state == 'running'
                      ? OutlinedButton.icon(onPressed: _pause, icon: const Icon(Icons.pause_rounded), label: const Text('Pause'))
                      : FilledButton.icon(onPressed: _start, icon: const Icon(Icons.play_arrow_rounded), label: const Text('Resume')),
                ),
                const SizedBox(width: 10),
                Expanded(child: OutlinedButton(onPressed: _finishEarly, child: const Text('End early'))),
                const SizedBox(width: 10),
                IconButton.outlined(onPressed: _reset, tooltip: 'Reset', icon: const Icon(Icons.refresh_rounded)),
              ]),
            const SectionHeading('Atmosphere', 'Motion & sound'),
            NoorCard(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                _SwitchRow(
                  title: 'Celestial motion',
                  subtitle: 'Gentle star and orbit animation. Turn off to reduce movement and battery use.',
                  value: store.cosmos,
                  onChanged: (v) => store.update(() => store.cosmos = v),
                ),
                Divider(color: c.line, height: 26),
                _SwitchRow(
                  title: 'Audio during focus',
                  subtitle: 'Off by default. Plays only while a session is running.',
                  value: store.audioOn,
                  onChanged: (v) async {
                    store.update(() => store.audioOn = v);
                    if (v && store.focusState == 'running') {
                      await _startAudio();
                    } else if (!v) {
                      await audio.stop();
                      if (mounted) setState(() => _previewing = false);
                    }
                  },
                ),
                const SizedBox(height: 12),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'pad', label: Text('Ambient pad'), icon: Icon(Icons.graphic_eq)),
                    ButtonSegment(value: 'file', label: Text('My audio'), icon: Icon(Icons.audio_file_outlined)),
                  ],
                  selected: {store.audioMode},
                  onSelectionChanged: (v) async {
                    if (v.first == 'file' && store.audioPath.isEmpty) {
                      final err = await audio.pickFile();
                      if (err != null && mounted) showToast(context, err);
                      return;
                    }
                    store.update(() => store.audioMode = v.first);
                    if (audio.playing) {
                      await audio.stop();
                      if (store.focusState == 'running' || _previewing) await audio.start();
                    }
                  },
                  style: ButtonStyle(
                    backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold.withValues(alpha: .18) : c.panel2),
                    foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.gold : c.muted),
                    side: WidgetStatePropertyAll(BorderSide(color: c.line)),
                  ),
                ),
                if (store.audioMode == 'file') ...[
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: Text(store.audioName.isEmpty ? 'No file chosen' : store.audioName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: c.muted))),
                    TextButton(
                      onPressed: () async {
                        final err = await audio.pickFile();
                        if (err != null && mounted) showToast(context, err);
                      },
                      child: Text(store.audioName.isEmpty ? 'Choose file' : 'Change'),
                    ),
                  ]),
                ],
                Row(children: [
                  Icon(Icons.volume_down_rounded, color: c.muted, size: 20),
                  Expanded(
                    child: Slider(
                      value: store.audioVolume,
                      onChanged: (v) {
                        store.update(() => store.audioVolume = v);
                        audio.setVolume(v);
                      },
                    ),
                  ),
                  Icon(Icons.volume_up_rounded, color: c.muted, size: 20),
                ]),
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _togglePreview,
                      icon: Icon(_previewing ? Icons.stop_rounded : Icons.play_arrow_rounded, size: 18),
                      label: Text(_previewing ? 'Stop preview' : 'Preview'),
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                Text('Noor bundles only a generated ambient pad — no recordings. Your own audio stays on this device.',
                    style: TextStyle(fontSize: 11, height: 1.45, color: c.muted)),
              ]),
            ),
            const SizedBox(height: 14),
            Text(
              'Today: ${fmtMinutes(store.focusMinutesOn(today))} of focus. Focus mode does not block calls or notifications — use Do Not Disturb if you need it.',
              style: TextStyle(fontSize: 11, height: 1.5, color: c.muted),
            ),
          ],
        );
      },
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final String title, subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _SwitchRow({required this.title, required this.subtitle, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Row(children: [
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: c.text)),
          const SizedBox(height: 3),
          Text(subtitle, style: TextStyle(fontSize: 11, height: 1.4, color: c.muted)),
        ]),
      ),
      Switch(value: value, onChanged: onChanged),
    ]);
  }
}
