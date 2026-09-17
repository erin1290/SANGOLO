import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/ado/welcome_screen.dart';
import 'screens/ado/cercles_screens.dart';
import 'screens/ado/annuaire_screen.dart';
import 'screens/ecoutant/ecoutant_screens.dart';
import 'screens/ecoutant/ecoutant_screens_2.dart';
import 'screens/ecoutant/planning_ecoutant_screen.dart';
import 'screens/admin/admin_screens.dart';
import 'screens/admin/admin_screens_2.dart';
import 'screens/admin/psychologue_screens.dart';

void main() {
  runApp(const SangoloApp());
}

class SangoloApp extends StatelessWidget {
  const SangoloApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sangolo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      initialRoute: '/',
      routes: {
        '/': (_) => const WelcomeScreen(),
        '/cercles': (_) => const CerclesListeScreen(),
        '/annuaire': (_) => const AnnuaireScreen(),

        '/ecoutant/connexion': (_) => const EcoutantConnexionScreen(),
        '/ecoutant/dashboard': (_) => const EcoutantDashboardScreen(),
        '/ecoutant/conversations-attente': (_) => const ConversationsEnAttenteScreen(),
        '/ecoutant/escalade': (_) => const EscaladeScreen(),
        '/ecoutant/escalade-confirmation': (_) => const ConfirmationEscaladeScreen(),
        '/ecoutant/profil': (_) => const ProfilEcoutantScreen(),
        '/ecoutant/parametres': (_) => const EcoutantParametresScreen(),
        '/ecoutant/cercle-moderation': (_) => CercleModerationScreen(cercleId: 0, cercleTheme: ''),
        '/ecoutant/planning': (_) => const PlanningEcoutantScreen(),

        // Point d'entrÃ©e unique du cÃ´tÃ© "supervision" â€” redirige ensuite
        // vers /admin/connexion ou /psychologue/connexion selon le rÃ´le.
        '/supervision': (_) => const SupervisionRoleChoiceScreen(),
        '/admin/connexion': (_) => const AdminConnexionScreen(),
        '/admin/dashboard': (_) => const AdminDashboardScreen(),
        '/admin/alertes': (_) => const AlertesListeScreen(),
        '/admin/alerte': (_) => const AlerteDetailScreen(),
        '/admin/validation-ecoutants': (_) => const ValidationEcoutantsScreen(),
        '/admin/annuaire': (_) => const AnnuaireAdminScreen(),
        '/admin/parametres': (_) => const AdminParametresScreen(),

        '/psychologue/connexion': (_) => const PsychologueConnexionScreen(),
        '/psychologue/dashboard': (_) => const PsychologueDashboardScreen(),
      },
    );
  }
}
