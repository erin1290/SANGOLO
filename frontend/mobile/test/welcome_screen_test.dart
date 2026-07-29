import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sangolo/screens/ado/welcome_screen.dart';
import 'package:sangolo/screens/ado/inscription_screen.dart';

void main() {
  group('WelcomeScreen', () {
    testWidgets('affiche le message rassurant et le bouton continuer',
        (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: WelcomeScreen()));

      expect(find.text('Nous sommes\nlà pour toi'), findsOneWidget);
      expect(find.text('Continuer'), findsOneWidget);
    });

    testWidgets('le bouton Continuer ouvre l\'écran d\'inscription',
        (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: WelcomeScreen()));

      await tester.tap(find.text('Continuer'));
      await tester.pumpAndSettle();

      expect(find.byType(InscriptionScreen), findsOneWidget);
      expect(find.text('Crée ton espace'), findsOneWidget);
    });
  });
}
