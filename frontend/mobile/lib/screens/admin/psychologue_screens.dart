import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Point d'entrée du côté "supervision" de l'app : un superviseur et un
/// psychologue partenaire ne sont pas le même rôle (le psychologue n'a pas
/// forcément accès au tableau de bord d'alertes), donc deux connexions
/// séparées plutôt qu'un seul formulaire ambigu.
class SupervisionRoleChoiceScreen extends StatelessWidget {
  const SupervisionRoleChoiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(titre: 'Espace supervision', sousTitre: 'Tu te connectes en tant que...'),
              const SizedBox(height: 16),
              NavTile(
                icon: Icons.admin_panel_settings_outlined,
                label: 'Superviseur / Admin',
                sub: 'Alertes, validation des écoutants, annuaire',
                accent: AppColors.ink,
                onTap: () => Navigator.of(context).pushNamed('/admin/connexion'),
              ),
              NavTile(
                icon: Icons.psychology_outlined,
                label: 'Psychologue partenaire',
                sub: 'Cas orientés, séances (institutionnelles uniquement)',
                accent: AppColors.green,
                onTap: () => Navigator.of(context).pushNamed('/psychologue/connexion'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PsychologueConnexionScreen extends StatelessWidget {
  const PsychologueConnexionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(titre: 'Espace psychologue', sousTitre: 'Accès réservé aux partenaires certifiés'),
              const SectionLabel('Identifiant'),
              TextField(decoration: const InputDecoration(hintText: 'toi@cabinet.org')),
              const SectionLabel('Mot de passe'),
              TextField(obscureText: true, decoration: const InputDecoration(hintText: '••••••••')),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () {}, child: const Text('Se connecter')),
              const SizedBox(height: 10),
              Text(
                'Rappel : les séances physiques restent réservées aux psychologues '
                'certifiés, toujours en lieu institutionnel.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Tableau de bord minimal du psychologue partenaire : cas orientés par un
/// superviseur, et ses propres créneaux de séance (distincts du planning
/// écoutant — jamais interchangeables, cf. backend/planning/models.py).
class PsychologueDashboardScreen extends StatelessWidget {
  const PsychologueDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(titre: 'Bonjour Docteur', sousTitre: 'Cabinet Nkolo · Yaoundé'),
              const SectionLabel('Cas orientés'),
              NavTile(
                icon: Icons.assignment_ind_outlined, label: 'Nouveaux cas',
                sub: 'Orientés par un superviseur', accent: AppColors.coral,
                trailing: const StatusBadge('2', color: AppColors.coral), onTap: () {},
              ),
              const SectionLabel('Séances'),
              NavTile(
                icon: Icons.event_available_outlined, label: 'Mes séances institutionnelles',
                sub: 'Toujours en lieu certifié', accent: AppColors.green, onTap: () {},
              ),
            ],
          ),
        ),
      ),
    );
  }
}
