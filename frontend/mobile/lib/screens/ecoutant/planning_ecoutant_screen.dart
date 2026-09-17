import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/api_service.dart';

const _jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

class PlanningEcoutantScreen extends StatefulWidget {
  const PlanningEcoutantScreen({super.key});

  @override
  State<PlanningEcoutantScreen> createState() => _PlanningEcoutantScreenState();
}

class _PlanningEcoutantScreenState extends State<PlanningEcoutantScreen> {
  final _api = ApiService();
  List<dynamic> _creneaux = [];
  bool _chargement = true;
  bool _showForm = false;
  int _jourIndex = 0;
  String _heure = '';
  bool _enCours = false;

  @override
  void initState() {
    super.initState();
    _chargerCreneaux();
  }

  Future<void> _chargerCreneaux() async {
    try {
      final data = await _api.listerCreneauxPlanning();
      setState(() => _creneaux = data);
    } catch (e) { /* silent */ }
    finally { if (mounted) setState(() => _chargement = false); }
  }

  Future<void> _ajouterCreneau() async {
    if (_heure.trim().isEmpty) return;
    setState(() => _enCours = true);
    try {
      await _api.creerCreneau(
        jourSemaine: _jourIndex,
        heure: _heure.trim(),
        typeCreneau: 'cercle',
      );
      setState(() { _showForm = false; _heure = ''; });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Creneau ajoute !')),
      );
      await _chargerCreneaux();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: ')),
      );
    } finally { if (mounted) setState(() => _enCours = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _chargerCreneaux,
          child: ListView(
            padding: const EdgeInsets.all(18),
            children: [
              const HeroBand(titre: 'Mon planning', sousTitre: 'Tes creneaux d\'ecoute'),
              const SizedBox(height: 14),
              if (_chargement)
                const Padding(
                  padding: EdgeInsets.only(top: 30),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_creneaux.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Text('Aucun creneau programme pour l\'instant.',
                      textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
                )
              else
                ..._creneaux.map((c) {
                  final jour = _jours[c['jour_semaine'] as int];
                  final heure = c['heure']?.toString() ?? '';
                  final cercleTheme = c['cercle_theme']?.toString();
                  final type = c['type_creneau']?.toString() ?? 'cercle';
                  return ListItemCard(
                    titre: ' . ',
                    sousTitre: type == 'cercle' ? 'Cercle: ' : 'Seance physique',
                    tag: StatusBadge(type),
                  );
                }),
              const SizedBox(height: 6),
              if (!_showForm)
                GhostButton(label: '+ Ajouter un creneau', onTap: () => setState(() => _showForm = true))
              else
                Card(
                  margin: const EdgeInsets.only(top: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionLabel('Jour'),
                        Row(
                          children: List.generate(7, (i) {
                            final actif = i == _jourIndex;
                            return Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _jourIndex = i),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 4),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: actif ? AppColors.amber : AppColors.paper,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(_jours[i], textAlign: TextAlign.center,
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                                          color: actif ? const Color(0xFF3A2410) : AppColors.inkSoft)),
                                ),
                              ),
                            );
                          }),
                        ),
                        const SectionLabel('Heure (ex: 14:30)'),
                        TextField(
                          onChanged: (v) => _heure = v,
                          decoration: const InputDecoration(hintText: '14:30'),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(child: GhostButton(label: 'Annuler', onTap: () => setState(() => _showForm = false))),
                            const SizedBox(width: 10),
                            Expanded(child: ElevatedButton(
                              onPressed: _enCours ? null : _ajouterCreneau,
                              child: Text(_enCours ? '...' : 'Ajouter'),
                            )),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 10),
              Text(
                'Seances physiques reservees aux psychologues partenaires certifies',
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