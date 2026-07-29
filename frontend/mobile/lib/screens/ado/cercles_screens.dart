import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/api_service.dart';
import '../../services/chat_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Vue ado : liste des cercles d'ecoute avec bouton Rejoindre/Quitter.
class CerclesListeScreen extends StatefulWidget {
  const CerclesListeScreen({super.key});

  @override
  State<CerclesListeScreen> createState() => _CerclesListeScreenState();
}

class _CerclesListeScreenState extends State<CerclesListeScreen> {
  final _api = ApiService();
  final _storage = const FlutterSecureStorage();
  List<dynamic> _cercles = [];
  Set<int> _mesCercleIds = {};
  bool _chargement = true;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    setState(() => _chargement = true);
    try {
      final data = await _api.listerCerclesEcoute();
      _cercles = data;
      // Verifier quels cercles l'ado a deja rejoint
      final userId = await _storage.read(key: 'user_id');
      if (userId != null) {
        final membreIds = <int>{};
        for (final cercle in _cercles) {
          try {
            final membres = await _api.listerMembresCercle(cercle['id'] as int);
            final estMembre = membres.any((m) => m['utilisateur'].toString() == userId);
            if (estMembre) membreIds.add(cercle['id'] as int);
          } catch (_) {}
        }
        _mesCercleIds = membreIds;
      }
    } catch (e) {
      debugPrint('Erreur chargement cercles: ');
    }
    if (mounted) setState(() => _chargement = false);
  }

  Future<void> _rejoindre(int cercleId) async {
    try {
      await _api.rejoindreCercle(cercleId);
      setState(() => _mesCercleIds.add(cercleId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tu as rejoint le cercle !')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ')),
        );
      }
    }
  }

  Future<void> _quitter(int cercleId) async {
    try {
      final membres = await _api.listerMembresCercle(cercleId);
      final userId = await _storage.read(key: 'user_id');
      final membre = membres.firstWhere(
        (m) => m['utilisateur'].toString() == userId,
        orElse: () => null,
      );
      if (membre != null) {
        await _api.quitterCercle(membre['id'] as int);
        setState(() => _mesCercleIds.remove(cercleId));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Tu as quitte le cercle.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _charger,
          child: ListView(
            padding: const EdgeInsets.all(18),
            children: [
              const HeroBand(
                titre: 'Cercles d\\'ecoute',
                sousTitre: 'Groupes de parole confidentiels',
              ),
              const SizedBox(height: 14),
              if (_chargement)
                const Padding(
                  padding: EdgeInsets.only(top: 30),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_cercles.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Text(
                    'Aucun cercle disponible pour l\\'instant.\nReviens plus tard !',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                )
              else
                ..._cercles.map((c) {
                  final id = c['id'] as int;
                  final estMembre = _mesCercleIds.contains(id);
                  final theme = c['theme']?.toString() ?? 'Cercle';
                  final nbMembres = c['nombre_membres'] ?? 0;
                  final ecoutantNom = c['ecoutant_nom']?.toString() ?? 'Non defini';
                  final actif = c['actif'] == true;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  theme,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: AppColors.ink,
                                  ),
                                ),
                              ),
                              StatusBadge(
                                estMembre ? 'Membre' : (actif ? 'actif' : 'inactif'),
                                color: estMembre ? AppColors.green : AppColors.inkSoft,
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ' membre(s) -- Animateur: ',
                            style: const TextStyle(fontSize: 12, color: AppColors.inkSoft),
                          ),
                          const SizedBox(height: 10),
                          if (actif && !estMembre)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => _rejoindre(id),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.green,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text('Rejoindre'),
                              ),
                            )
                          else if (estMembre)
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => CercleAdoChatScreen(
                                            cercleId: id,
                                            cercleTheme: theme,
                                          ),
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.amber,
                                      foregroundColor: const Color(0xFF3A2410),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    child: const Text('Ouvrir le chat'),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: const Text('Quitter le cercle'),
                                        content: const Text('Es-tu sur de vouloir quitter ce cercle ?'),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(ctx);
                                              _quitter(id);
                                            },
                                            child: const Text('Quitter', style: TextStyle(color: AppColors.coral)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.coral,
                                    side: const BorderSide(color: AppColors.coral),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text('Quitter'),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}

/// Chat ado dans un cercle d'ecoute (WebSocket).
class CercleAdoChatScreen extends StatefulWidget {
  final int cercleId;
  final String cercleTheme;
  const CercleAdoChatScreen({super.key, required this.cercleId, required this.cercleTheme});

  @override
  State<CercleAdoChatScreen> createState() => _CercleAdoChatScreenState();
}

class _CercleAdoChatScreenState extends State<CercleAdoChatScreen> {
  final _messageController = TextEditingController();
  late final ChatService _chat;
  final _api = ApiService();
  final _storage = const FlutterSecureStorage();
  final List<Map<String, dynamic>> _messages = [];
  bool _chargement = true;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _userId = await _storage.read(key: 'user_id');
    // Charger l'historique
    try {
      final data = await _api.listerMessagesCercle(widget.cercleId);
      setState(() {
        _messages.addAll(data.cast<Map<String, dynamic>>());
        _chargement = false;
      });
    } catch (e) {
      setState(() => _chargement = false);
    }
    // Connecter le WebSocket
    _chat = ChatService(cercleId: widget.cercleId);
    _chat.messages.listen((m) {
      setState(() {
        _messages.add({
          'auteur_label': m.auteurLabel ?? m.auteur,
          'contenu': m.contenu,
          'date_envoi': m.dateEnvoi?.toIso8601String(),
        });
      });
    });
  }

  void _envoyer() {
    final texte = _messageController.text.trim();
    if (texte.isEmpty) return;
    _chat.envoyer('ado', texte, extra: {'utilisateur_id': _userId});
    _messageController.clear();
  }

  @override
  void dispose() {
    _chat.fermer();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(22), bottomRight: Radius.circular(22)),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white, size: 18),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const CircleAvatar(
                    radius: 15,
                    backgroundColor: AppColors.green,
                    child: Icon(Icons.group, color: Colors.white, size: 14),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.cercleTheme,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const Text(
                          'Groupe d\\'ecoute',
                          style: TextStyle(color: Colors.white60, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Messages
            Expanded(
              child: _chargement
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) {
                        final m = _messages[i];
                        final auteurLabel = m['auteur_label']?.toString() ?? 'Membre';
                        final contenu = m['contenu']?.toString() ?? '';
                        final estMien = m['utilisateur']?.toString() == _userId;
                        return Align(
                          alignment: estMien ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.76),
                            decoration: BoxDecoration(
                              color: estMien ? AppColors.amber : AppColors.card,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (!estMien)
                                  Text(
                                    auteurLabel,
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.inkSoft),
                                  ),
                                Text(
                                  contenu,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: estMien ? const Color(0xFF3A2410) : AppColors.ink,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            // Input
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(hintText: 'Ecrire dans le groupe...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.ink,
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 16),
                      onPressed: _envoyer,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}