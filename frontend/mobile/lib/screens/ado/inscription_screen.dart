import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/api_service.dart';
import 'accueil_screen.dart';

class InscriptionScreen extends StatefulWidget {
  const InscriptionScreen({super.key});

  @override
  State<InscriptionScreen> createState() => _InscriptionScreenState();
}

class _InscriptionScreenState extends State<InscriptionScreen> {
  final _pseudoController = TextEditingController();
  final _ageController = TextEditingController();
  final _mdpController = TextEditingController();
  final _confirmationController = TextEditingController();
  final _api = ApiService();
  bool _chargement = false;
  String? _erreur;

  Future<void> _creerCompte() async {
    if (_mdpController.text != _confirmationController.text) {
      setState(() => _erreur = 'Les mots de passe ne correspondent pas.');
      return;
    }
    final age = int.tryParse(_ageController.text);
    if (age == null) {
      setState(() => _erreur = 'Âge invalide.');
      return;
    }

    setState(() { _chargement = true; _erreur = null; });
    try {
      await _api.inscriptionAdo(
        pseudo: _pseudoController.text.trim(),
        age: age,
        motDePasse: _mdpController.text,
        consentementAnalyseIa: true,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AccueilScreen()),
      );
    } catch (e) {
      setState(() => _erreur = e.toString());
    } finally {
      if (mounted) setState(() => _chargement = false);
    }
  }

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
              Container(
                padding: const EdgeInsets.symmetric(vertical: 22),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 88, height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.paper,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.amber,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Text('S', style: TextStyle(
                              color: Colors.white, fontSize: 30, fontWeight: FontWeight.w700,
                            )),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text('Crée ton espace',
                        style: Theme.of(context).textTheme.titleLarge
                            ?.copyWith(color: Colors.white)),
                    Text('Anonyme, juste pour toi',
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: Colors.white70)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _label('Pseudo'),
              TextField(controller: _pseudoController,
                  decoration: const InputDecoration(hintText: 'Choisis un pseudo')),
              const SizedBox(height: 12),
              _label('Âge'),
              TextField(controller: _ageController, keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: '16')),
              const SizedBox(height: 12),
              _label('Mot de passe'),
              TextField(controller: _mdpController, obscureText: true,
                  decoration: const InputDecoration(hintText: '••••••••')),
              const SizedBox(height: 12),
              _label('Confirmation'),
              TextField(controller: _confirmationController, obscureText: true,
                  decoration: const InputDecoration(hintText: '••••••••')),
              if (_erreur != null) ...[
                const SizedBox(height: 10),
                Text(_erreur!, style: const TextStyle(color: AppColors.coral, fontSize: 12)),
              ],
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: _chargement ? null : _creerCompte,
                child: _chargement
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Créer mon espace'),
              ),
              const SizedBox(height: 10),
              Text('Aucune donnée identifiante requise',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(text, style: Theme.of(context).textTheme.labelSmall),
      );
}
