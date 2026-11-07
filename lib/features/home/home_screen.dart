import 'package:flutter/material.dart';
import '../../core/data/reflections.dart';
import '../../core/palette.dart';
import '../../core/prayer.dart';
import '../../core/store.dart';
import '../../core/util.dart';
import '../../ui/common.dart';
import '../../ui/shell.dart';
import '../settings/settings_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: NoorStore.instance,
        builder: (context, _) => _HomeBody(store: NoorStore.instance),
      );
}

class _HomeBody extends StatelessWidget {
  final NoorStore store;
  const _HomeBody({required this.store});

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    final now = DateTime.now();
    final today = dateKey(now);
    final streaks = store.streaks;
    final morning = store.routineDone(today, 'morning'), evening = store.routineDone(today, 'evening');
    final done = (morning ? 1 : 0) + (evening ? 1 : 0);
    final reflection = reflectionOfTheDay(now);
    final preset = store.selectedPreset;

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
      children: [
        Row(children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: c.gold2), color: c.panel),
            child: const Center(child: CrescentMark(size: 28)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('NOOR', style: TextStyle(letterSpacing: 4, fontSize: 14, fontWeight: FontWeight.w800, color: c.text)),
              Text(prettyDate(now), style: TextStyle(fontSize: 11, color: c.muted)),
            ]),
          ),
          IconButton(
            tooltip: 'Settings',
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
            icon: Icon(Icons.tune_rounded, color: c.gold),
          ),
        ]),
        const SizedBox(height: 22),
        Text('Assalamu alaikum', style: TextStyle(fontFamily: kSerif, fontSize: 30, letterSpacing: -.4, color: c.text)),
        const SizedBox(height: 4),
        Text('A little, consistently, with intention.', style: TextStyle(fontSize: 13, color: c.muted)),
        const SizedBox(height: 18),

        // 1 — hero: next Salah with a live countdown
        _NextSalahHero(store: store),
        const SizedBox(height: 12),

        // 2 — mixed sizes: tall dhikr card + two stacked small cards
        SizedBox(
          height: 200,
          child: Row(children: [
            Expanded(
              flex: 6,
              child: NoorCard(
                onTap: () => ShellNav.tab.value = ShellNav.dhikr,
                padding: const EdgeInsets.all(16),
                gradient: LinearGradient(
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                  colors: [c.panel2, c.panel],
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Eyebrow('Dhikr today'),
                  const Spacer(),
                  if (store.hasActive) ...[
                    Icon(Icons.hourglass_top_rounded, color: c.gold, size: 30),
                    const SizedBox(height: 8),
                    Text('Session in progress', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: c.text)),
                    const SizedBox(height: 2),
                    Text('Your total appears when you finish.', style: TextStyle(fontSize: 11, height: 1.35, color: c.muted)),
                  ] else ...[
                    Text('${store.countOn(today)}',
                        style: TextStyle(fontFamily: kSerif, fontSize: 54, height: 1, color: c.gold)),
                    const SizedBox(height: 4),
                    Text(
                      store.sessionsOn(today) == 0
                          ? 'completed — begin a session'
                          : 'completed in ${store.sessionsOn(today)} session${store.sessionsOn(today) == 1 ? '' : 's'}',
                      style: TextStyle(fontSize: 11, color: c.muted),
                    ),
                  ],
                  const Spacer(),
                  Row(children: [
                    Expanded(child: Text(preset.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.text))),
                    Icon(Icons.arrow_outward_rounded, size: 18, color: c.gold),
                  ]),
                ]),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 4,
              child: Column(children: [
                Expanded(
                  child: NoorCard(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Icon(Icons.auto_awesome, size: 16, color: c.gold),
                        const SizedBox(width: 6),
                        const Eyebrow('Streak'),
                      ]),
                      const Spacer(),
                      Text('${streaks.current}', style: TextStyle(fontFamily: kSerif, fontSize: 32, height: 1, color: c.text)),
                      Text('days · best ${streaks.best}', style: TextStyle(fontSize: 10, color: c.muted)),
                    ]),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: NoorCard(
                    onTap: () => ShellNav.tab.value = ShellNav.focus,
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Icon(Icons.spa_outlined, size: 16, color: c.gold),
                        const SizedBox(width: 6),
                        const Eyebrow('Focus'),
                      ]),
                      const Spacer(),
                      Text(fmtMinutes(store.focusMinutesOn(today)),
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: c.text)),
                      Text('today', style: TextStyle(fontSize: 10, color: c.muted)),
                    ]),
                  ),
                ),
              ]),
            ),
          ]),
        ),

        // 3 — wide routines card
        const SectionHeading('Today', 'Your adhkar'),
        NoorCard(
          padding: const EdgeInsets.all(14),
          child: Column(children: [
            Row(children: [
              Expanded(child: _RoutineButton(
                  icon: Icons.wb_sunny_outlined, label: 'Morning adhkar', done: morning,
                  onTap: () {
                    tapHaptic();
                    store.toggleRoutine('morning');
                  })),
              const SizedBox(width: 10),
              Expanded(child: _RoutineButton(
                  icon: Icons.nightlight_outlined, label: 'Evening adhkar', done: evening,
                  onTap: () {
                    tapHaptic();
                    store.toggleRoutine('evening');
                  })),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Text('$done / 2 complete', style: TextStyle(fontSize: 11, color: c.gold, fontWeight: FontWeight.w700)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  done == 2 ? 'Today’s routines are complete.' : '${2 - done} routine${2 - done == 1 ? '' : 's'} left to keep your streak.',
                  textAlign: TextAlign.end, style: TextStyle(fontSize: 11, color: c.muted),
                ),
              ),
            ]),
          ]),
        ),

        // 4 — reflection
        const SectionHeading('A verse to carry', 'Reflection of the day'),
        NoorCard(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
          child: Column(children: [
            ArabicText(reflection.arabic, size: 25),
            const SizedBox(height: 8),
            Text(reflection.translation, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, height: 1.55, color: c.text)),
            const SizedBox(height: 10),
            Text(reflection.reference, style: TextStyle(fontSize: 11, color: c.muted, letterSpacing: .5)),
          ]),
        ),
      ],
    );
  }
}

class _RoutineButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool done;
  final VoidCallback onTap;
  const _RoutineButton({required this.icon, required this.label, required this.done, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Material(
      color: Colors.transparent,
      child: Ink(
        decoration: BoxDecoration(
          color: done ? c.green.withValues(alpha: .14) : c.panel2,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: done ? c.green.withValues(alpha: .6) : c.line),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Icon(done ? Icons.check_circle_rounded : icon, color: done ? c.green : c.gold, size: 24),
              const SizedBox(height: 10),
              Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: c.text)),
              const SizedBox(height: 2),
              Text(done ? 'Completed' : 'Tap when done', style: TextStyle(fontSize: 11, color: done ? c.green : c.muted)),
            ]),
          ),
        ),
      ),
    );
  }
}

class _NextSalahHero extends StatelessWidget {
  final NoorStore store;
  const _NextSalahHero({required this.store});

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    if (store.lat == null || store.lon == null) {
      return NoorCard(
        onTap: () => ShellNav.tab.value = ShellNav.salah,
        padding: const EdgeInsets.all(22),
        child: Row(children: [
          Icon(Icons.location_searching_rounded, color: c.gold, size: 30),
          const SizedBox(width: 16),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Set your location', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: c.text)),
              const SizedBox(height: 4),
              Text('Noor calculates prayer times on your device — no account, no internet.',
                  style: TextStyle(fontSize: 12, height: 1.4, color: c.muted)),
            ]),
          ),
          Icon(Icons.chevron_right_rounded, color: c.gold),
        ]),
      );
    }
    return LiveClock(builder: (context, now) {
      final st = PrayerController.instance.stateAt(now);
      if (st == null) {
        return NoorCard(
          padding: const EdgeInsets.all(22),
          child: Text(PrayerController.instance.lastError ?? 'Prayer times are unavailable for this location.',
              style: TextStyle(color: c.muted)),
        );
      }
      final remaining = st.remaining(now);
      return NoorCard(
        onTap: () => ShellNav.tab.value = ShellNav.salah,
        padding: EdgeInsets.zero,
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [c.gold.withValues(alpha: .16), c.panel2, c.panel],
          stops: const [0, .45, 1],
        ),
        borderColor: c.gold.withValues(alpha: .35),
        child: Stack(children: [
          Positioned(
            right: -18, top: -14,
            child: Opacity(opacity: .10, child: CrescentMark(size: 170, color: c.gold, star: false)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Eyebrow('Next Salah'),
                const Spacer(),
                Icon(Icons.location_on_outlined, size: 13, color: c.muted),
                const SizedBox(width: 3),
                Flexible(
                  child: Text(store.placeName.isEmpty ? 'Saved location' : store.placeName,
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: c.muted)),
                ),
              ]),
              const SizedBox(height: 10),
              Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Expanded(child: Text(st.next.name, style: TextStyle(fontFamily: kSerif, fontSize: 40, height: 1.05, color: c.text))),
                Text(fmtTime(st.next.time), style: TextStyle(fontSize: 20, color: c.gold, fontWeight: FontWeight.w600)),
              ]),
              const SizedBox(height: 12),
              Text('in ${fmtCountdown(remaining)}',
                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.w300, color: c.gold, fontFeatures: kTabular)),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: st.progress(now), minHeight: 4,
                  backgroundColor: c.text.withValues(alpha: .08), valueColor: AlwaysStoppedAnimation(c.gold),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  for (final e in st.today.where((e) => !e.isSunrise))
                    Expanded(
                      child: Column(children: [
                        Text(e.name,
                            style: TextStyle(
                              fontSize: 10, letterSpacing: .3,
                              fontWeight: e.key == st.next.key && e.time == st.next.time ? FontWeight.w800 : FontWeight.w500,
                              color: e.key == st.next.key && e.time == st.next.time ? c.gold : c.muted,
                            )),
                        const SizedBox(height: 3),
                        Text(fmtTime(e.time).replaceAll(' ', ' '),
                            style: TextStyle(fontSize: 11, color: e.time.isBefore(now) ? c.muted : c.text)),
                      ]),
                    ),
                ],
              ),
            ]),
          ),
        ]),
      );
    });
  }
}
