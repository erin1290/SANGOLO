import 'package:flutter/material.dart';

/// Palette et typographie reprises telles quelles des maquettes haute
/// fidélité validées : brun foncé du wordmark pour le texte, mélange
/// orange/bordeaux du cœur du logo pour les dégradés de fond.
class AppColors {
  static const ink = Color(0xFF3B2417);
  static const inkSoft = Color(0xFF7A6552);
  static const inkSurface = Color(0xFFBA686A);
  static const amber = Color(0xFFF2A65A);
  static const amberDeep = Color(0xFFB9752C);
  static const green = Color(0xFF4C7A5E);
  static const coral = Color(0xFFE4574B);
  static const paper = Color(0xFFFBF8F3);
  static const card = Color(0xFFFFFFFF);
  static const line = Color(0xFFEAE3D4);

  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [inkSurface, ink],
  );
}

class AppTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.paper,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.ink,
        primary: AppColors.ink,
        secondary: AppColors.amber,
        surface: AppColors.card,
        error: AppColors.coral,
      ),
      textTheme: TextTheme(
        headlineMedium: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.ink),
        titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.ink),
        bodyMedium: TextStyle(fontSize: 14, color: AppColors.ink),
        bodySmall: TextStyle(fontSize: 12, color: AppColors.inkSoft),
        labelSmall: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.inkSoft),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.ink,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.card,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 3,
        shadowColor: AppColors.ink.withOpacity(0.06),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
