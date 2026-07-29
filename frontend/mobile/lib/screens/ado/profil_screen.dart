import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class ProfilScreen extends StatelessWidget {
  const ProfilScreen({super.key});

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
              HeroBand(
                titre: 'Ton profil',
                sousTitre: 'Toujours anonyme',
                leading: const CircleAvatar(
                  radius: 26, backgroundColor: Colors.white24,
                  child: Icon(Icons.person_outline, color: Colors.white),
                ),
              ),
              const SectionLabel('Confidentialité & sécurité'),
              NavTile(
                icon: Icons.security_outlined, label: 'Sécurité', sub: 'Face ID + mot de passe',
                accent: AppColors.ink, trailing: const StatusBadge('ON', color: AppColors.green),
                onTap: () {},
              ),
              NavTile(
                icon: Icons.notifications_none, label: 'Notifications', sub: 'Discrètes, sans aperçu',
                accent: AppColors.amber, onTap: () {},
              ),
              NavTile(
                icon: Icons.help_outline, label: 'Aide', sub: 'Questions fréquentes',
                accent: AppColors.green, onTap: () {},
              ),
              const Spacer(),
              Center(
                child: TextButton(
                  onPressed: () {},
                  child: const Text('Se déconnecter',
                      style: TextStyle(color: AppColors.inkSoft, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
