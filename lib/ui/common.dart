import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import '../core/palette.dart';

class NoorCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Gradient? gradient;
  final Color? color, borderColor;
  final double radius;
  const NoorCard({
    super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap,
    this.gradient, this.color, this.borderColor, this.radius = 20,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    final r = BorderRadius.circular(radius);
    return Material(
      color: Colors.transparent,
      child: Ink(
        decoration: BoxDecoration(
          color: gradient == null ? (color ?? c.panel) : null,
          gradient: gradient,
          borderRadius: r,
          border: Border.all(color: borderColor ?? c.line),
        ),
        child: InkWell(borderRadius: r, onTap: onTap, child: Padding(padding: padding, child: child)),
      ),
    );
  }
}

class Eyebrow extends StatelessWidget {
  final String text;
  final Color? color;
  const Eyebrow(this.text, {super.key, this.color});
  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: TextStyle(fontSize: 10, letterSpacing: 1.8, fontWeight: FontWeight.w800, color: color ?? context.nc.gold2),
      );
}

class ScreenTitle extends StatelessWidget {
  final String eyebrow, title;
  final String? subtitle;
  final Widget? trailing;
  const ScreenTitle(this.eyebrow, this.title, {super.key, this.subtitle, this.trailing});
  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 18),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Eyebrow(eyebrow),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontFamily: kSerif, fontSize: 32, height: 1.1, letterSpacing: -.5, color: c.text)),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle!, style: TextStyle(fontSize: 13, height: 1.45, color: c.muted)),
            ],
          ]),
        ),
        if (trailing != null) trailing!,
      ]),
    );
  }
}

class SectionHeading extends StatelessWidget {
  final String eyebrow, title;
  final Widget? trailing;
  const SectionHeading(this.eyebrow, this.title, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 26, 4, 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Eyebrow(eyebrow),
              const SizedBox(height: 4),
              Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700, letterSpacing: -.2)),
            ]),
          ),
          if (trailing != null) trailing!,
        ]),
      );
}

/// Rebuilds every second, aligned to the wall-clock second, always from `DateTime.now()`
/// (never from an accumulated counter), so countdowns cannot drift.
class LiveClock extends StatefulWidget {
  final Widget Function(BuildContext context, DateTime now) builder;
  const LiveClock({super.key, required this.builder});
  @override
  State<LiveClock> createState() => _LiveClockState();
}

class _LiveClockState extends State<LiveClock> {
  Timer? _t;
  late DateTime _now;
  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _arm();
  }

  void _arm() {
    final wait = 1000 - DateTime.now().millisecond;
    _t = Timer(Duration(milliseconds: wait + 5), () {
      if (!mounted) return;
      setState(() => _now = DateTime.now());
      _arm();
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.builder(context, _now);
}

Path crescentPath(Size size) {
  final r = size.shortestSide * .36;
  final c = Offset(size.width * .46, size.height * .52);
  final outer = Path()..addOval(Rect.fromCircle(center: c, radius: r));
  final cut = Path()
    ..addOval(Rect.fromCircle(center: Offset(c.dx + r * .42, c.dy - r * .18), radius: r * .86));
  return Path.combine(PathOperation.difference, outer, cut);
}

class CrescentPainter extends CustomPainter {
  final Color color;
  final bool star;
  const CrescentPainter(this.color, {this.star = true});
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawPath(crescentPath(size), Paint()..color = color);
    if (star) {
      final r = size.shortestSide * .36;
      final s = Offset(size.width * .46 + r * .78, size.height * .52 - r * .62);
      final sr = r * .30;
      final p = Path();
      for (var i = 0; i < 8; i++) {
        final a = math.pi / 4 * i - math.pi / 2;
        final rad = i.isEven ? sr : sr * .22;
        final pt = Offset(s.dx + rad * math.cos(a), s.dy + rad * math.sin(a));
        if (i == 0) {
          p.moveTo(pt.dx, pt.dy);
        } else {
          p.lineTo(pt.dx, pt.dy);
        }
      }
      p.close();
      canvas.drawPath(p, Paint()..color = color.withValues(alpha: .95));
    }
  }

  @override
  bool shouldRepaint(CrescentPainter old) => old.color != color || old.star != star;
}

class CrescentMark extends StatelessWidget {
  final double size;
  final Color? color;
  final bool star;
  const CrescentMark({super.key, this.size = 40, this.color, this.star = true});
  @override
  Widget build(BuildContext context) => SizedBox(
        width: size, height: size,
        child: CustomPaint(painter: CrescentPainter(color ?? context.nc.gold, star: star)),
      );
}

class RingPainter extends CustomPainter {
  final double progress;
  final Color color, track;
  final double stroke;
  const RingPainter(this.progress, this.color, this.track, {this.stroke = 6});
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final deflated = rect.deflate(stroke / 2);
    final base = Paint()
      ..style = PaintingStyle.stroke ..strokeWidth = stroke ..color = track;
    canvas.drawArc(deflated, 0, math.pi * 2, false, base);
    if (progress > 0) {
      final fg = Paint()
        ..style = PaintingStyle.stroke ..strokeWidth = stroke ..strokeCap = StrokeCap.round ..color = color;
      canvas.drawArc(deflated, -math.pi / 2, math.pi * 2 * progress.clamp(0.0, 1.0), false, fg);
    }
  }

  @override
  bool shouldRepaint(RingPainter old) =>
      old.progress != progress || old.color != color || old.track != track || old.stroke != stroke;
}

/// Twinkling stars and slow orbits behind the app. [animate] false = a static starfield
/// (used for reduced-motion); the widget is simply not built when the user turns it off.
class CosmosBackground extends StatefulWidget {
  final bool animate;
  const CosmosBackground({super.key, required this.animate});
  @override
  State<CosmosBackground> createState() => _CosmosBackgroundState();
}

class _CosmosBackgroundState extends State<CosmosBackground> with SingleTickerProviderStateMixin {
  late final AnimationController _ctl;
  @override
  void initState() {
    super.initState();
    _ctl = AnimationController(vsync: this, duration: const Duration(seconds: 90));
    if (widget.animate) _ctl.repeat();
  }

  @override
  void didUpdateWidget(CosmosBackground old) {
    super.didUpdateWidget(old);
    if (widget.animate && !_ctl.isAnimating) {
      _ctl.repeat();
    } else if (!widget.animate && _ctl.isAnimating) {
      _ctl.stop();
    }
  }

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: RepaintBoundary(
          child: CustomPaint(
            size: Size.infinite,
            painter: _CosmosPainter(_ctl, context.nc.gold, Theme.of(context).brightness == Brightness.light),
          ),
        ),
      );
}

class _Star {
  final double x, y, r, phase, speed;
  const _Star(this.x, this.y, this.r, this.phase, this.speed);
}

final List<_Star> _stars = () {
  final rnd = math.Random(11);
  return List.generate(
      56, (_) => _Star(rnd.nextDouble(), rnd.nextDouble(), .5 + rnd.nextDouble() * 1.2, rnd.nextDouble(), 4 + rnd.nextInt(8).toDouble()));
}();

class _CosmosPainter extends CustomPainter {
  final Animation<double> anim;
  final Color gold;
  final bool light;
  _CosmosPainter(this.anim, this.gold, this.light) : super(repaint: anim);

  @override
  void paint(Canvas canvas, Size size) {
    final t = anim.value;
    final base = light ? .5 : 1.0;
    final p = Paint();
    for (final s in _stars) {
      final tw = .5 + .5 * math.sin(2 * math.pi * (t * s.speed + s.phase));
      p.color = gold.withValues(alpha: (.10 + .5 * tw) * base * .8);
      canvas.drawCircle(Offset(s.x * size.width, s.y * size.height), s.r, p);
    }
    final ring = Paint()
      ..style = PaintingStyle.stroke ..strokeWidth = 1 ..color = gold.withValues(alpha: .10 * base);
    final c1 = Offset(size.width * .98, size.height * .22);
    canvas.drawCircle(c1, 140, ring);
    ring.color = gold.withValues(alpha: .06 * base);
    canvas.drawCircle(c1, 205, ring);
    final a1 = 2 * math.pi * t * 2;
    p.color = gold.withValues(alpha: .55 * base);
    canvas.drawCircle(Offset(c1.dx + 140 * math.cos(a1), c1.dy + 140 * math.sin(a1)), 4, p);
    final a2 = -2 * math.pi * t * 1;
    p.color = gold.withValues(alpha: .35 * base);
    canvas.drawCircle(Offset(c1.dx + 205 * math.cos(a2), c1.dy + 205 * math.sin(a2)), 3, p);
  }

  @override
  bool shouldRepaint(_CosmosPainter old) => old.gold != gold || old.light != light;
}

Future<bool> confirmDialog(BuildContext context,
    {required String title, required String message, String confirm = 'Confirm', bool destructive = false}) async {
  final c = context.nc;
  final r = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message, style: TextStyle(color: c.muted, height: 1.45)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: TextStyle(color: c.muted))),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirm, style: TextStyle(color: destructive ? c.danger : c.gold)),
        ),
      ],
    ),
  );
  return r == true;
}

void showToast(BuildContext context, String message) {
  final m = ScaffoldMessenger.of(context);
  m.hideCurrentSnackBar();
  m.showSnackBar(SnackBar(content: Text(message), duration: const Duration(seconds: 3)));
}

InputDecoration noorField(BuildContext context, {String? label, String? hint}) {
  final c = context.nc;
  return InputDecoration(
    labelText: label, hintText: hint, filled: true, fillColor: c.panel2,
    labelStyle: TextStyle(color: c.muted), hintStyle: TextStyle(color: c.muted.withValues(alpha: .7)),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: c.line)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: c.line)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: c.gold)),
  );
}

class ArabicText extends StatelessWidget {
  final String text;
  final double size;
  final Color? color;
  final TextAlign align;
  const ArabicText(this.text, {super.key, this.size = 26, this.color, this.align = TextAlign.center});
  @override
  Widget build(BuildContext context) => Text(
        text,
        textDirection: TextDirection.rtl,
        textAlign: align,
        style: TextStyle(fontSize: size, height: 1.9, color: color ?? context.nc.gold),
      );
}

const List<FontFeature> kTabular = [FontFeature.tabularFigures()];
