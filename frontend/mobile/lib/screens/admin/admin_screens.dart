import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class AdminConnexionScreen extends StatelessWidget {
  const AdminConnexionScreen({super.key});

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
              const HeroBand(titre: 'Espace supervision', sousTitre: 'Accès réservé à l\'équipe'),
              const SectionLabel('Identifiant'),
              TextField(decoration: const InputDecoration(hintText: 'superviseur@sangolo.org')),
              const SectionLabel('Mot de passe'),
              TextField(obscureText: true, decoration: const InputDecoration(hintText: '••••••••')),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () {}, child: const Text('Se connecter')),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HeroBand(titre: 'Bonjour', sousTitre: 'Vue d\'ensemble'),
              const SizedBox(height: 8),
              NavTile(
                icon: Icons.warning_amber_outlined, label: 'Alertes urgentes',
                sub: 'À traiter maintenant', accent: AppColors.coral,
                trailing: const StatusBadge('2', color: AppColors.coral), onTap: () {},
              ),
              NavTile(
                icon: Icons.person_add_alt_outlined, label: 'Écoutants en attente',
                sub: 'Candidatures à valider', accent: AppColors.amber,
                trailing: const StatusBadge('5'), onTap: () {},
              ),
              NavTile(
                icon: Icons.favorite_border, label: 'Annuaire de ressources',
                sub: 'Gérer les partenaires', accent: AppColors.green, onTap: () {},
              ),
              NavTile(
                icon: Icons.bar_chart_outlined, label: 'Statistiques',
                sub: 'Données anonymisées', accent: AppColors.inkSurface, onTap: () {},
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AlerteDetailScreen extends StatelessWidget {
  const AlerteDetailScreen({super.key});

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
              const HeroBand(titre: 'mango_23', sousTitre: 'Signalée par Aline · urgent'),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16)),
                child: const Text('"...je sais pas si je peux tenir encore..."',
                    style: TextStyle(fontStyle: FontStyle.italic, fontSize: 12, color: AppColors.inkSoft)),
              ),
              const SizedBox(height: 14),
              ElevatedButton(onPressed: () {}, child: const Text('Contacter l\'ado')),
              const SizedBox(height: 8),
              GhostButton(label: 'Orienter vers un psychologue', onTap: () {}),
              const SizedBox(height: 8),
              GhostButton(label: 'Clôturer l\'alerte', onTap: () {}),
              const SizedBox(height: 10),
              Center(child: Text('Décision toujours humaine — jamais automatique',
                  style: Theme.of(context).textTheme.bodySmall)),
            ],
          ),
        ),
      ),
    );
  }
}

class ValidationEcoutantsScreen extends StatelessWidget {
  const ValidationEcoutantsScreen({super.key});

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
              const HeroBand(titre: 'Candidatures', sousTitre: '5 en attente'),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(13),
                decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Julien K.', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                      const StatusBadge('psycho L3', color: AppColors.green),
                    ]),
                    const SizedBox(height: 4),
                    Text('Formation validée · entretien fait', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(child: GhostButton(label: 'Valider', color: AppColors.green, onTap: () {})),
                      const SizedBox(width: 8),
                      Expanded(child: GhostButton(label: 'Refuser', color: AppColors.coral, onTap: () {})),
                    ]),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Text('Attestation, institution partenaire, formation, entretien',
                  textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}
