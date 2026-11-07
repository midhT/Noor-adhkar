import 'package:flutter/material.dart';

/// Noor colour tokens (dark navy + gold, with a light variant). Read via `context.nc`.
class NoorColors extends ThemeExtension<NoorColors> {
  final Color bg, panel, panel2, text, muted, gold, gold2, line, green, danger, deep;
  const NoorColors({
    required this.bg, required this.panel, required this.panel2, required this.text,
    required this.muted, required this.gold, required this.gold2, required this.line,
    required this.green, required this.danger, required this.deep,
  });

  static const dark = NoorColors(
    bg: Color(0xFF080C1E), panel: Color(0xFF10172C), panel2: Color(0xFF182039),
    text: Color(0xFFF7F5EE), muted: Color(0xFF9DA5BB), gold: Color(0xFFE8C978),
    gold2: Color(0xFFB89448), line: Color(0x2EE8C978), green: Color(0xFFA6C8B1),
    danger: Color(0xFFE79A8B), deep: Color(0xFF050813),
  );

  static const light = NoorColors(
    bg: Color(0xFFF4F1E9), panel: Color(0xFFFFFDF7), panel2: Color(0xFFEEE9DC),
    text: Color(0xFF202238), muted: Color(0xFF72768A), gold: Color(0xFF99712D),
    gold2: Color(0xFF876226), line: Color(0x40876226), green: Color(0xFF4E7A5E),
    danger: Color(0xFFB5503E), deep: Color(0xFFE9E4D6),
  );

  @override
  NoorColors copyWith({
    Color? bg, Color? panel, Color? panel2, Color? text, Color? muted, Color? gold,
    Color? gold2, Color? line, Color? green, Color? danger, Color? deep,
  }) => NoorColors(
    bg: bg ?? this.bg, panel: panel ?? this.panel, panel2: panel2 ?? this.panel2,
    text: text ?? this.text, muted: muted ?? this.muted, gold: gold ?? this.gold,
    gold2: gold2 ?? this.gold2, line: line ?? this.line, green: green ?? this.green,
    danger: danger ?? this.danger, deep: deep ?? this.deep,
  );

  @override
  NoorColors lerp(ThemeExtension<NoorColors>? other, double t) {
    if (other is! NoorColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return NoorColors(
      bg: l(bg, other.bg), panel: l(panel, other.panel), panel2: l(panel2, other.panel2),
      text: l(text, other.text), muted: l(muted, other.muted), gold: l(gold, other.gold),
      gold2: l(gold2, other.gold2), line: l(line, other.line), green: l(green, other.green),
      danger: l(danger, other.danger), deep: l(deep, other.deep),
    );
  }
}

extension NoorContext on BuildContext {
  NoorColors get nc => Theme.of(this).extension<NoorColors>() ?? NoorColors.dark;
}

const String kSerif = 'serif';

ThemeData buildNoorTheme({required bool light}) {
  final c = light ? NoorColors.light : NoorColors.dark;
  final scheme = (light ? const ColorScheme.light() : const ColorScheme.dark()).copyWith(
    primary: c.gold, onPrimary: light ? Colors.white : const Color(0xFF14172B),
    secondary: c.gold2, surface: c.panel, onSurface: c.text, error: c.danger,
    surfaceContainerHighest: c.panel2, surfaceContainerHigh: c.panel2,
    surfaceContainer: c.panel, surfaceContainerLow: c.panel, surfaceContainerLowest: c.bg,
    outline: c.line, outlineVariant: c.line,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: light ? Brightness.light : Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    canvasColor: c.panel,
    dividerColor: c.line,
    extensions: <ThemeExtension<dynamic>>[c],
    textTheme: ThemeData(brightness: light ? Brightness.light : Brightness.dark)
        .textTheme.apply(bodyColor: c.text, displayColor: c.text),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.gold,
        foregroundColor: light ? Colors.white : const Color(0xFF14172B),
        minimumSize: const Size(0, 48),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: .3),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.text,
        minimumSize: const Size(0, 46),
        side: BorderSide(color: c.line),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: c.gold)),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? c.gold : c.muted),
      trackColor: WidgetStateProperty.resolveWith((s) =>
          s.contains(WidgetState.selected) ? c.gold.withValues(alpha: .28) : c.panel2),
      trackOutlineColor: WidgetStateProperty.all(c.line),
    ),
    sliderTheme: SliderThemeData(
      activeTrackColor: c.gold, inactiveTrackColor: c.panel2, thumbColor: c.gold,
      overlayColor: c.gold.withValues(alpha: .12),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating, backgroundColor: c.gold,
      contentTextStyle: TextStyle(
          color: light ? Colors.white : const Color(0xFF14172B), fontWeight: FontWeight.w700),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.bg.withValues(alpha: .94),
      indicatorColor: c.gold.withValues(alpha: .14),
      surfaceTintColor: Colors.transparent,
      iconTheme: WidgetStateProperty.resolveWith((s) =>
          IconThemeData(color: s.contains(WidgetState.selected) ? c.gold : c.muted)),
      labelTextStyle: WidgetStateProperty.resolveWith((s) => TextStyle(
          fontSize: 11, fontWeight: FontWeight.w600,
          color: s.contains(WidgetState.selected) ? c.gold : c.muted)),
    ),
    cardTheme: CardThemeData(
      color: c.panel, elevation: 0, margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20), side: BorderSide(color: c.line)),
    ),
  );
}
