import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/api_service.dart';
import '../../services/chat_service.dart';

/// E2 -- Liste des demandes en attente, anonymisees (pseudo + premier message).
class ConversationsEnAttenteScreen extends StatefulWidget {
  const ConversationsEnAttenteScreen({super.key});

  @override
  State<ConversationsEnAttenteScreen> createState() => _ConversationsEnAttenteScreenState();
}

class _ConversationsEnAttenteScreenState extends State<ConversationsEnAttenteScreen> {
  final _api = ApiService();
  List<dynamic> _conversations = [];
  bool _chargement = true;
  String? _erreur;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    setState(() { _chargement = true; _erreur = null; });
    try {
      final data = await _api.listerConversations();
      setState(() => _conversations = data);
    } catch (e) {
      setState(() => _erreur = 'Impossible de charger les conversations.');
    } finally {
      if (mounted) setState(() => _chargement = false);
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
              HeroBand(titre: 'Demandes en attente',
                  sousTitre: ' conversation(s)'),
              const SizedBox(height: 14),
              if (_chargement)
                const Padding(
                  padding: EdgeInsets.only(top: 30),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_erreur != null)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Text(_erreur!, textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.coral, fontSize: 12)),
                )
              else if (_conversations.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Text('Aucune demande en attente pour l\\'instant.',
                      textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
                )
              else
                ..._conversations.map((c) {
                  final premierMessage = (c['messages'] as List?)?.isNotEmpty == true
                      ? c['messages'][0]['contenu'] as String
                      : 'Nouvelle demande';
                  final pseudo = c['utilisateur_pseudo']?.toString() ?? 'ado_';
                  return ListItemCard(
                    titre: pseudo,
                    sousTitre: '\"\"',
                    tag: StatusBadge(
                      c['statut'] == 'en_attente' ? 'nouveau' : c['statut'],
                      color: c['statut'] == 'en_attente' ? AppColors.green : AppColors.amberDeep,
                    ),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChatEcoutantScreen(
                          pseudoAdo: pseudo,
                          conversationId: c['id'] as int,
                        ),
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

/// E3 -- Chat ecoutant 1-to-1 avec bouton Signaler.
class ChatEcoutantScreen extends StatefulWidget {
  final String pseudoAdo;
  final int conversationId;
  const ChatEcoutantScreen({super.key, required this.pseudoAdo, required this.conversationId});

  @override
  State<ChatEcoutantScreen> createState() => _ChatEcoutantScreenState();
}

class _ChatEcoutantScreenState extends State<ChatEcoutantScreen> {
  final _messageController = TextEditingController();
  late final ChatService _chat;
  final List<ChatMessage> _messages = [];

  @override
  void initState() {
    super.initState();
    _chat = ChatService(conversationId: widget.conversationId);
    _chat.messages.listen((m) => setState(() => _messages.add(m)));
  }

  @override
  void dispose() {
    _chat.fermer();
    _messageController.dispose();
    super.dispose();
  }

  void _envoyer() {
    final texte = _messageController.text.trim();
    if (texte.isEmpty) return;
    _chat.envoyer('ecoutant', texte);
    _messageController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(22), bottomRight: Radius.circular(22)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white, size: 18),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      const CircleAvatar(radius: 15, backgroundColor: AppColors.amber),
                      const SizedBox(width: 8),
                      Text(widget.pseudoAdo, style: Theme.of(context).textTheme.bodyMedium
                          ?.copyWith(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: () => Navigator.of(context).pushNamed('/ecoutant/escalade'),
                    style: TextButton.styleFrom(
                      backgroundColor: AppColors.coral.withOpacity(0.35),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    icon: const Icon(Icons.warning_amber_rounded, size: 13, color: Colors.white),
                    label: const Text('Signaler', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, i) {
                  final m = _messages[i];
                  final mine = m.auteur == 'ecoutant';
                  return Align(
                    alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                      decoration: BoxDecoration(
                        color: mine ? AppColors.amber : AppColors.card,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16), topRight: const Radius.circular(16),
                          bottomLeft: Radius.circular(mine ? 16 : 4),
                          bottomRight: Radius.circular(mine ? 4 : 16),
                        ),
                      ),
                      child: Text(m.contenu,
                          style: TextStyle(fontSize: 11.5, color: mine ? const Color(0xFF3A2410) : AppColors.ink)),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(hintText: 'Ecrire un message...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 20, backgroundColor: AppColors.ink,
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

/// Cercle moderation ecoutant avec gestion des membres.
class CercleModerationScreen extends StatefulWidget {
  final int cercleId;
  final String cercleTheme;
  const CercleModerationScreen({super.key, required this.cercleId, required this.cercleTheme});

  @override
  State<CercleModerationScreen> createState() => _CercleModerationScreenState();
}

class _CercleModerationScreenState extends State<CercleModerationScreen> {
  final _messageController = TextEditingController();
  final _api = ApiService();
  late final ChatService _chat;
  final List<Map<String, dynamic>> _messages = [];
  bool _chargement = true;
  bool _showMembres = false;
  List<dynamic> _membres = [];
  bool _chargementMembres = false;

  @override
  void initState() {
    super.initState();
    _chargerMessages();
    _chat = ChatService(cercleId: widget.cercleId);
    _chat.messages.listen((m) {
      setState(() {
        _messages.add({
          'auteur_label': m.auteurLabel ?? m.auteur,
          'contenu': m.contenu,
        });
      });
    });
  }

  Future<void> _chargerMessages() async {
    try {
      final data = await _api.listerMessagesCercle(widget.cercleId);
      setState(() {
        _messages.addAll(data.cast<Map<String, dynamic>>());
        _chargement = false;
      });
    } catch (e) {
      setState(() => _chargement = false);
    }
  }

  void _envoyer() {
    final texte = _messageController.text.trim();
    if (texte.isEmpty) return;
    _chat.envoyer('ecoutant', texte);
    _messageController.clear();
  }

  Future<void> _chargerMembres() async {
    setState(() => _chargementMembres = true);
    try {
      final data = await _api.listerMembresCercle(widget.cercleId);
      setState(() => _membres = data);
    } catch (e) { /* silent */ }
    finally { if (mounted) setState(() => _chargementMembres = false); }
  }

  Future<void> _retirerMembre(int membreId) async {
    try {
      await _api.quitterCercle(membreId);
      setState(() => _membres.removeWhere((m) => m['id'] == membreId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Membre retire du cercle.')),
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
                    radius: 15, backgroundColor: AppColors.green,
                    child: Icon(Icons.group, color: Colors.white, size: 14),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.cercleTheme, style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                        const Text('Groupe d\\'ecoute', style: TextStyle(color: Colors.white60, fontSize: 10)),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() => _showMembres = true);
                      _chargerMembres();
                    },
                    style: TextButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text('Membres', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
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
                        final estMien = m['ecoutant'] != null;
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
                            child: Text(contenu,
                                style: TextStyle(fontSize: 11, color: estMien ? const Color(0xFF3A2410) : AppColors.ink)),
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
                      decoration: const InputDecoration(hintText: 'Intervenir dans le groupe...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 20, backgroundColor: AppColors.ink,
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
      // Bottom sheet membres
      bottomSheet: _showMembres ? Container(
        height: MediaQuery.of(context).size.height * 0.5,
        decoration: const BoxDecoration(
          color: AppColors.paper,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Membres du cercle',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(() => _showMembres = false),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _chargementMembres
                  ? const Center(child: CircularProgressIndicator())
                  : _membres.isEmpty
                      ? const Center(child: Text('Aucun membre dans ce cercle.'))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _membres.length,
                          itemBuilder: (context, i) {
                            final m = _membres[i];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                title: Text(m['pseudo']?.toString() ?? 'Ado',
                                    style: const TextStyle(fontWeight: FontWeight.w700)),
                                subtitle: Text('Membre depuis le ',
                                    style: const TextStyle(fontSize: 11)),
                                trailing: OutlinedButton(
                                  onPressed: () => _retirerMembre(m['id'] as int),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.coral,
                                    side: const BorderSide(color: AppColors.coral),
                                  ),
                                  child: const Text('Retirer', style: TextStyle(fontSize: 11)),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ) : null,
    );
  }
}

/// E7 -- Profil de l'ecoutant.
class ProfilEcoutantScreen extends StatelessWidget {
  const ProfilEcoutantScreen({super.key});

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
                titre: 'Aline M.', sousTitre: 'Ecouteante depuis mars 2026',
                leading: const CircleAvatar(
                  radius: 26, backgroundColor: Colors.white24,
                  child: Icon(Icons.person_outline, color: Colors.white),
                ),
              ),
              const SectionLabel('Disponibilite'),
              NavTile(
                icon: Icons.check_circle_outline, label: 'Disponible', sub: 'Visible des ados',
                accent: AppColors.green, trailing: const StatusBadge('ON'), onTap: () {},
              ),
              NavTile(
                icon: Icons.school_outlined, label: 'Formation suivie', sub: 'Ecoute active -- validee',
                accent: AppColors.amber, onTap: () {},
              ),
              NavTile(
                icon: Icons.notifications_none, label: 'Notifications', sub: 'Nouvelles demandes',
                accent: AppColors.inkSurface, onTap: () {},
              ),
              const Spacer(),
              Center(
                child: TextButton(
                  onPressed: () {},
                  child: const Text('Se deconnecter',
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

/// Confirmation apres escalation.
class ConfirmationEscaladeScreen extends StatelessWidget {
  const ConfirmationEscaladeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 60, height: 60,
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), shape: BoxShape.circle),
                    child: const Icon(Icons.check, color: Colors.white, size: 26),
                  ),
                  const SizedBox(height: 22),
                  Text('Alerte transmise', style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(color: Colors.white, fontSize: 19)),
                  const SizedBox(height: 10),
                  Text(
                    'Un superviseur humain va prendre le relais.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                      onPressed: () => Navigator.of(context)
                          .popUntil((route) => route.settings.name == null || route.isFirst),
                      child: const Text('Revenir au tableau de bord'),
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