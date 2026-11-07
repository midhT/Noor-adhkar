import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/palette.dart';
import 'common.dart';

const Color kBrandNavy = Color(0xFF080C1E);
const Color kBrandGold = Color(0xFFE8C978);

/// Branded opening animation. Starts on the same navy as the native Android splash,
/// so the hand-off is seamless. Shortened when the system asks for reduced motion.
class SplashGate extends StatefulWidget {
  final Widget child;
  const SplashGate({super.key, required this.child});
  @override
  State<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<SplashGate> with SingleTickerProviderStateMixin {
  late final AnimationController _ctl;
  bool _done = false;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _ctl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2100));
    _ctl.addStatusListener((s) {
      if (s == AnimationStatus.completed && mounted) setState(() => _done = true);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_started) {
      _started = true;
      final reduced = MediaQuery.of(context).disableAnimations;
      _ctl.duration = Duration(milliseconds: reduced ? 500 : 2100);
      _ctl.forward();
    }
  }

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: _done
          ? KeyedSubtree(key: const ValueKey('app'), child: widget.child)
          : KeyedSubtree(key: const ValueKey('splash'), child: _Intro(anim: _ctl)),
    );
  }
}

class _Intro extends StatelessWidget {
  final Animation<double> anim;
  const _Intro({required this.anim});

  double _seg(double a, double b) => Curves.easeOutCubic.transform(((anim.value - a) / (b - a)).clamp(0.0, 1.0));

  @override
  Widget build(BuildContext context) {
    return Material(
      color: kBrandNavy,
      child: AnimatedBuilder(
        animation: anim,
        builder: (context, _) {
          final emblem = _seg(0, .45), word = _seg(.3, .65), tag = _seg(.55, .85), rule = _seg(.6, 1);
          return Stack(fit: StackFit.expand, children: [
            CustomPaint(painter: _IntroSky(anim.value)),
            Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Opacity(
                  opacity: emblem,
                  child: Transform.scale(scale: .82 + .18 * emblem, child: const CrescentMark(size: 150, color: kBrandGold)),
                ),
                const SizedBox(height: 14),
                Opacity(
                  opacity: word,
                  child: Transform.translate(
                    offset: Offset(0, 12 * (1 - word)),
                    child: const Text('NOOR',
                        style: TextStyle(fontFamily: kSerif, fontSize: 46, letterSpacing: 10, color: kBrandGold)),
                  ),
                ),
                const SizedBox(height: 10),
                Opacity(
                  opacity: tag,
                  child: const Text('REMEMBER  •  PRAY  •  REFLECT',
                      style: TextStyle(fontSize: 11, letterSpacing: 3, color: Color(0xFFB89448), fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 22),
                Opacity(
                  opacity: rule,
                  child: Container(
                    width: 120 * rule, height: 1,
                    decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [Colors.transparent, kBrandGold, Colors.transparent])),
                  ),
                ),
              ]),
            ),
          ]);
        },
      ),
    );
  }
}

class _IntroSky extends CustomPainter {
  final double t;
  const _IntroSky(this.t);
  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..shader = RadialGradient(colors: [kBrandGold.withValues(alpha: .10), Colors.transparent])
          .createShader(Rect.fromCircle(center: size.center(Offset.zero), radius: size.shortestSide * .7));
    canvas.drawRect(Offset.zero & size, glow);
    final rnd = math.Random(5);
    final p = Paint();
    for (var i = 0; i < 40; i++) {
      final x = rnd.nextDouble() * size.width, y = rnd.nextDouble() * size.height;
      final tw = .5 + .5 * math.sin(2 * math.pi * (t * 3 + rnd.nextDouble()));
      p.color = kBrandGold.withValues(alpha: .12 + .4 * tw);
      canvas.drawCircle(Offset(x, y), .6 + rnd.nextDouble() * 1.2, p);
    }
  }

  @override
  bool shouldRepaint(_IntroSky old) => old.t != t;
}
