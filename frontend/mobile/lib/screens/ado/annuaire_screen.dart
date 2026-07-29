import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class AnnuaireScreen extends StatefulWidget {
  const AnnuaireScreen({super.key});

  @override
  State<AnnuaireScreen> createState() => _AnnuaireScreenState();
}

class _AnnuaireScreenState extends State<AnnuaireScreen> {
  final _api = ApiService();
  final _villeController = TextEditingController();
  List<Ressource> _ressources = [];
  bool _chargement = true;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger({String? ville}) async {
    setState(() => _chargement = true);
    try {
      final data = await _api.listerRessources(ville: ville);
      setState(() => _ressources = data.map((e) => Ressource.fromJson(e)).toList());
    } catch (_) {
      // On garde une liste vide plutôt que de bloquer l'écran.
    } finally {
      if (mounted) setState(() => _chargement = false);
    }
  }

  String _labelType(String t) {
    switch (t) {
      case 'psychologue': return 'Psychologue';
      case 'ong': return 'ONG';
      default: return 'Centre d\'écoute';
    }
  }

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
              const SizedBox(height: 12),
              TextField(
                controller: _villeController,
                decoration: InputDecoration(
                  hintText: 'Filtrer par ville',
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.search, size: 18),
                    onPressed: () => _charger(ville: _villeController.text.trim().isEmpty
                        ? null : _villeController.text.trim()),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (_chargement)
                const Center(child: Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: CircularProgressIndicator(),
                ))
              else if (_ressources.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 30),
                  child: Text('Aucune ressource trouvée pour l\'instant.',
                      textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
                )
              else
                ..._ressources.map((r) => ListItemCard(
                      titre: r.nom, sousTitre: '${r.ville} · ${_labelType(r.typeRessource)}',
                    )),
            ],
          ),
        ),
      ),
    );
  }
}
