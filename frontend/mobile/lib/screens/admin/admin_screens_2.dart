import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// A2 — Liste des alertes, filtrable par source (écoutant vs module IA).
class AlertesListeScreen extends StatefulWidget {
  const AlertesListeScreen({super.key});

  @override
  State<AlertesListeScreen> createState() => _AlertesListeScreenState();
}

class _AlertesListeScreenState extends State<AlertesListeScreen> {
  int _filtre = 0; // 0=toutes, 1=écoutant, 2=module IA

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
              const HeroBand(titre: 'Alertes', sousTitre: 'Écoutant + module IA'),
              const SizedBox(height: 12),
              Row(
                children: ['Toutes', 'Écoutant', 'Module IA'].asMap().entries.map((e) {
                  final actif = e.key == _filtre;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: GestureDetector(
                      onTap: () => setState(() => _filtre = e.key),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: actif ? AppColors.ink : AppColors.card,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(e.value, style: TextStyle(
                            fontSize: 10.5, fontWeight: FontWeight.w700,
                            color: actif ? Colors.white : AppColors.inkSoft)),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              ListItemCard(
                titre: 'mango_23', sousTitre: 'Signalé par Aline il y a 4 min',
                tag: const StatusBadge('urgent · écoutant', color: AppColors.coral),
                onTap: () => Navigator.of(context).pushNamed('/admin/alerte'),
              ),
              ListItemCard(
                titre: 'calme_02', sousTitre: 'Mot-clé de détresse détecté',
                tag: const StatusBadge('module IA', color: AppColors.amberDeep),
                onTap: () => Navigator.of(context).pushNamed('/admin/alerte'),
              ),
              ListItemCard(
                titre: 'etoile_v', sousTitre: 'Conseil écoutant à revoir',
                tag: const StatusBadge('à traiter', color: AppColors.green),
                onTap: () => Navigator.of(context).pushNamed('/admin/alerte'),
              ),
              const SizedBox(height: 6),
              Text('Triées par gravité, source toujours visible',
                  textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

/// A5 — Gestion de l'annuaire de ressources (ajout/modification côté admin).
class AnnuaireAdminScreen extends StatelessWidget {
  const AnnuaireAdminScreen({super.key});

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
              const HeroBand(titre: 'Annuaire', sousTitre: 'Psychologues · ONG · centres'),
              const SizedBox(height: 14),
              const ListItemCard(titre: 'Cabinet Nkolo', sousTitre: 'Yaoundé · partenaire certifié'),
              const ListItemCard(titre: 'Centre Espoir', sousTitre: 'Douala · ONG'),
              const SizedBox(height: 6),
              GhostButton(label: '+ Ajouter une ressource', onTap: () {}),
            ],
          ),
        ),
      ),
    );
  }
}

/// A6 — Paramètres du compte superviseur.
class AdminParametresScreen extends StatelessWidget {
  const AdminParametresScreen({super.key});

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
              const HeroBand(titre: 'Paramètres', sousTitre: 'Réglages du compte superviseur'),
              const SectionLabel('Compte'),
              NavTile(
                icon: Icons.security_outlined, label: 'Sécurité', sub: 'Face ID + mot de passe',
                accent: AppColors.ink, trailing: const StatusBadge('ON'), onTap: () {},
              ),
              NavTile(
                icon: Icons.warning_amber_outlined, label: 'Alertes prioritaires', sub: 'Notification immédiate',
                accent: AppColors.coral, trailing: const StatusBadge('ON', color: AppColors.coral), onTap: () {},
              ),
              const SectionLabel('Équipe'),
              NavTile(
                icon: Icons.groups_outlined, label: 'Membres de l\'équipe', sub: 'Gérer les accès superviseur',
                accent: AppColors.amber, onTap: () {},
              ),
              NavTile(
                icon: Icons.language_outlined, label: 'Langue', sub: 'Français',
                accent: AppColors.green, onTap: () {},
              ),
              const Spacer(),
              GhostButton(label: 'Se déconnecter', color: AppColors.coral, onTap: () {}),
            ],
          ),
        ),
      ),
    );
  }
}
