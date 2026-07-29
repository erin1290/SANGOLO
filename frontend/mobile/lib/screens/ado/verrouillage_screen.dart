import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import '../../theme/app_theme.dart';

class VerrouillageScreen extends StatefulWidget {
  final VoidCallback onDeverrouille;
  const VerrouillageScreen({super.key, required this.onDeverrouille});

  @override
  State<VerrouillageScreen> createState() => _VerrouillageScreenState();
}

class _VerrouillageScreenState extends State<VerrouillageScreen> {
  final _auth = LocalAuthentication();
  String? _erreur;

  Future<void> _essayerFaceId() async {
    setState(() => _erreur = null);
    try {
      final disponible = await _auth.canCheckBiometrics;
      if (!disponible) {
        setState(() => _erreur = 'Face ID non disponible sur cet appareil.');
        return;
      }
      final ok = await _auth.authenticate(
        localizedReason: 'Déverrouille pour retrouver ton espace Sangolo',
        options: const AuthenticationOptions(biometricOnly: true),
      );
      if (ok) widget.onDeverrouille();
    } catch (e) {
      setState(() => _erreur = 'Échec de l\'authentification biométrique.');
    }
  }

  void _utiliserMotDePasse() {
    // À connecter : dialogue de saisie du mot de passe, vérifié côté
    // stockage local (pas d'appel réseau nécessaire pour un simple déverrouillage).
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Mot de passe'),
        content: TextField(obscureText: true, decoration: const InputDecoration(hintText: '••••••••')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
          TextButton(onPressed: () { Navigator.pop(context); widget.onDeverrouille(); },
              child: const Text('Valider')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 60, height: 60,
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), shape: BoxShape.circle),
                    child: const Icon(Icons.lock_outline, color: Colors.white, size: 26),
                  ),
                  const SizedBox(height: 22),
                  Text('Content de te revoir', style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(color: Colors.white)),
                  const SizedBox(height: 6),
                  Text('Déverrouille pour retrouver ton espace',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60)),
                  if (_erreur != null) ...[
                    const SizedBox(height: 10),
                    Text(_erreur!, style: const TextStyle(color: AppColors.coral, fontSize: 11)),
                  ],
                  const SizedBox(height: 26),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.amber, foregroundColor: const Color(0xFF3A2410),
                      ),
                      onPressed: _essayerFaceId,
                      icon: const Icon(Icons.fingerprint, size: 18),
                      label: const Text('Déverrouiller par Face ID'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white70,
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                      onPressed: _utiliserMotDePasse,
                      child: const Text('Utiliser le mot de passe'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
