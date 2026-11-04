import 'package:flutter/material.dart';

class NoorTheme {
  static const background = Color(0xFF08090B);
  static const surface = Color(0xFF121417);
  static const surface2 = Color(0xFF1A1D21);
  static const line = Color(0xFF292D32);
  static const muted = Color(0xFF9299A2);
  static const white = Color(0xFFF4F5F6);

  static ThemeData dark() => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    colorScheme: const ColorScheme.dark(
      primary: white, secondary: Color(0xFFB8BEC6),
      surface: surface, onSurface: white,
    ),
    useMaterial3: true,
    fontFamily: 'Roboto',
    appBarTheme: const AppBarTheme(
      backgroundColor: background, foregroundColor: white, elevation: 0,
      centerTitle: false,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: surface,
      indicatorColor: const Color(0xFF30353B),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
    ),
    cardTheme: CardTheme(
      color: surface, elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22),
        side: const BorderSide(color: line, width: .7)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: surface2,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none),
    ),
  );
}
