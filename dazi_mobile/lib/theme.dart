import 'package:flutter/material.dart';

class DaziTheme {
  DaziTheme._();

  static const _violet = Color(0xFF7C3AED);
  static const _violetLight = Color(0xFFA78BFA);
  static const _darkBackground = Color(0xFF1E1E1E);
  static const _darkSurface = Color(0xFF252526);
  static const _darkPanel = Color(0xFF2D2D30);
  static const _lightBackground = Color(0xFFF5F5F7);
  static const _lightSurface = Color(0xFFFFFFFF);
  static const _lightPanel = Color(0xFFF0F0F5);

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _violet,
        brightness: Brightness.light,
        surface: _lightSurface,
        surfaceContainerHighest: _lightPanel,
      ),
      scaffoldBackgroundColor: _lightBackground,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        color: _lightSurface,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        selectedItemColor: _violet,
        unselectedItemColor: Colors.grey,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _lightPanel,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
      ),
    );
    return base;
  }

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _violet,
        brightness: Brightness.dark,
        surface: _darkSurface,
        surfaceContainerHighest: _darkPanel,
      ),
      scaffoldBackgroundColor: _darkBackground,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        color: _darkSurface,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        selectedItemColor: _violetLight,
        unselectedItemColor: Colors.grey,
        backgroundColor: _darkSurface,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _darkPanel,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
      ),
    );
    return base;
  }
}
