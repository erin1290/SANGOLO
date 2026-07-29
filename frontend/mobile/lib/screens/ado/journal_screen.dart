import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/api_service.dart';
import '../../services/journal_media_service.dart';
import '../../models/models.dart';

class JournalScreen extends StatefulWidget {
  const JournalScreen({super.key});

  @override
  State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  final _api = ApiService();
  final _media = JournalMediaService();
  final _texteController = TextEditingController();
  int _humeurIndex = 1;
  bool _envoiEnCours = false;
  bool _enregistrementAudioEnCours = false;
  List<EntreeJournal> _historique = [];

  static const _humeurs = ['content', 'neutre', 'triste', 'colere'];
  static const _labelsHumeur = {
    'content': 'Content', 'neutre': 'Neutre',
    'triste': 'Triste', 'colere': 'En colère',
  };

  @override
  void initState() {
    super.initState();
    _chargerHistorique();
  }

  Future<void> _chargerHistorique() async {
    try {
      final data = await _api.listerEntreesJournal();
      setState(() => _historique = data.map((e) => EntreeJournal.fromJson(e)).toList());
    } catch (_) {
      // Historique non bloquant : l'écran reste utilisable même si le chargement échoue.
    }
  }

  Future<void> _basculerEnregistrementAudio() async {
    if (!_enregistrementAudioEnCours) {
      final demarre = await _media.demarrerEnregistrementAudio();
      if (demarre) setState(() => _enregistrementAudioEnCours = true);
      return;
    }
    setState(() => _enregistrementAudioEnCours = false);
    try {
      await _media.arreterEtEnvoyerAudio(humeur: _humeurs[_humeurIndex]);
      await _chargerHistorique();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Audio enregistré')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    }
  }

  Future<void> _choisirPhoto() async {
    try {
      await _media.choisirEtEnvoyerPhoto(humeur: _humeurs[_humeurIndex]);
      await _chargerHistorique();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo ajoutée')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    }
  }

  @override
  void dispose() {
    _media.dispose();
    _texteController.dispose();
    super.dispose();
  }

  Future<void> _enregistrer() async {
    setState(() => _envoiEnCours = true);
    try {
      await _api.creerEntreeJournal(
        humeur: _humeurs[_humeurIndex],
        texte: _texteController.text.trim(),
      );
      _texteController.clear();
      await _chargerHistorique();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entrée enregistrée')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur : $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _envoiEnCours = false);
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
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mon journal', style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(color: Colors.white)),
                    Text('Ce que tu écris ici reste privé',
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(color: Colors.white60)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text('Aujourd\'hui, je me sens...', style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 8),
              Row(
                children: List.generate(_humeurs.length, (i) {
                  final actif = i == _humeurIndex;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _humeurIndex = i),
                      child: Container(
                        margin: const EdgeInsets.only(right: 6),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: actif ? AppColors.amber : AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _labelsHumeur[_humeurs[i]]!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.w700,
                            color: actif ? const Color(0xFF3A2410) : AppColors.inkSoft,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _texteController,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Ce que je ressens aujourd\'hui...'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _AttachChip(
                    icon: _enregistrementAudioEnCours ? Icons.stop_circle_outlined : Icons.mic_none,
                    label: _enregistrementAudioEnCours ? 'Arrêter' : 'Audio',
                    onTap: _basculerEnregistrementAudio,
                  ),
                  const SizedBox(width: 8),
                  _AttachChip(icon: Icons.image_outlined, label: 'Photo', onTap: _choisirPhoto),
                ],
              ),
              const SizedBox(height: 14),
              ElevatedButton(
                onPressed: _envoiEnCours ? null : _enregistrer,
                child: _envoiEnCours
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Enregistrer'),
              ),
              const SizedBox(height: 20),
              Text('Historique', style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 6),
              ..._historique.map((entree) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      radius: 14, backgroundColor: AppColors.paper,
                      child: Text(_emojiHumeur(entree.humeur), style: const TextStyle(fontSize: 13)),
                    ),
                    title: Text(_labelsHumeur[entree.humeur] ?? entree.humeur,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    subtitle: entree.dateCreation != null
                        ? Text('${entree.dateCreation}', style: Theme.of(context).textTheme.bodySmall)
                        : null,
                  )),
            ],
          ),
        ),
      ),
    );
  }

  String _emojiHumeur(String humeur) {
    switch (humeur) {
      case 'content': return '🙂';
      case 'triste': return '😢';
      case 'colere': return '😠';
      case 'fatigue': return '😴';
      default: return '😐';
    }
  }
}

class _AttachChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _AttachChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.paper,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppColors.ink),
            const SizedBox(width: 5),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
