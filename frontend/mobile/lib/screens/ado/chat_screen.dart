import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/chat_service.dart';

/// Chat 1-to-1 avec un écoutant, branché en temps réel sur
/// backend/messagerie/consumers.py via ChatService.
class ChatScreen extends StatefulWidget {
  final int conversationId;
  const ChatScreen({super.key, required this.conversationId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  late final ChatService _chat;
  final List<ChatMessage> _messages = [];
  bool _connecte = true;

  @override
  void initState() {
    super.initState();
    _chat = ChatService(conversationId: widget.conversationId);
    _chat.messages.listen((m) => setState(() => _messages.add(m)));
    _chat.connexionEtat.listen((connecte) => setState(() => _connecte = connecte));
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
    _chat.envoyer('utilisateur', texte);
    _messageController.clear();
    // Le message affiché arrive via le flux `_chat.messages` (diffusé par
    // le serveur à tous les participants, y compris l'émetteur) — pas
    // besoin de l'ajouter localement ici, ça éviterait un doublon.
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(22), bottomRight: Radius.circular(22),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white, size: 18),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const CircleAvatar(radius: 17, backgroundColor: AppColors.amber),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Aline, écoutante', style: Theme.of(context).textTheme.bodyMedium
                          ?.copyWith(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                      Row(
                        children: [
                          Container(width: 6, height: 6,
                              decoration: const BoxDecoration(
                                  color: AppColors.green, shape: BoxShape.circle)),
                          const SizedBox(width: 4),
                          Text('En ligne', style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: Colors.white60)),
                        ],
                      ),
                    ],
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
                  final mine = m['auteur'] == 'utilisateur';
                  return Align(
                    alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                      decoration: BoxDecoration(
                        color: mine ? AppColors.amber : AppColors.card,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: Radius.circular(mine ? 16 : 4),
                          bottomRight: Radius.circular(mine ? 4 : 16),
                        ),
                      ),
                      child: Text(m['contenu']!,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: mine ? const Color(0xFF3A2410) : AppColors.ink,
                          )),
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
                      decoration: const InputDecoration(hintText: 'Écrire un message...'),
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
