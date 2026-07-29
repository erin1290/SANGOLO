import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'api_service.dart';

class ChatMessage {
  final String auteur;
  final String contenu;
  final DateTime? dateEnvoi;
  final String? auteurLabel;

  ChatMessage({required this.auteur, required this.contenu, this.dateEnvoi, this.auteurLabel});

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        auteur: json['auteur'] ?? json['auteur_label'] ?? 'Inconnu',
        contenu: json['contenu'],
        dateEnvoi: json['date_envoi'] != null ? DateTime.tryParse(json['date_envoi']) : null,
        auteurLabel: json['auteur_label'],
      );
}

/// Connexion temps reel a une conversation ou un cercle d'ecoute.
///
/// Branchee sur backend/messagerie/consumers.py :
/// - ConversationConsumer pour les conversations 1-to-1
/// - CercleConsumer pour les cercles d'ecoute
///
/// Reconnexion automatique avec backoff progressif (1s, 2s, 4s... plafonne
/// a 30s) en cas de coupure.
///
/// Usage :
///   final chat = ChatService(conversationId: 42);     // conversation
///   final chat = ChatService(cercleId: 5);             // cercle
///   chat.messages.listen((m) => ...);
///   chat.envoyer('utilisateur', 'salut');
///   chat.fermer();
class ChatService {
  final int? conversationId;
  final int? cercleId;
  WebSocketChannel? _channel;
  final _messagesController = StreamController<ChatMessage>.broadcast();
  final _etatController = StreamController<bool>.broadcast();

  bool _fermeManuel = false;
  int _tentativeReconnexion = 0;
  Timer? _timerReconnexion;

  // File d'attente des messages envoyes pendant une coupure.
  final List<Map<String, dynamic>> _messagesEnAttente = [];

  ChatService({this.conversationId, this.cercleId}) {
    assert(conversationId != null || cercleId != null, 'Fournir conversationId ou cercleId');
    _connecter();
  }

  Stream<ChatMessage> get messages => _messagesController.stream;
  Stream<bool> get connexionEtat => _etatController.stream;

  bool get _estCercle => cercleId != null;

  void _connecter() {
    final wsBaseUrl = ApiConfig.baseUrl
        .replaceFirst('http://', 'ws://')
        .replaceFirst('https://', 'wss://')
        .replaceFirst('/api', '');

    final uri = _estCercle
        ? Uri.parse('/ws/cercle//')
        : Uri.parse('/ws/conversation//');

    try {
      _channel = WebSocketChannel.connect(uri);
    } catch (_) {
      _planifierReconnexion();
      return;
    }

    _channel!.stream.listen(
      (data) {
        _tentativeReconnexion = 0;
        _etatController.add(true);
        final json = jsonDecode(data) as Map<String, dynamic>;
        _messagesController.add(ChatMessage.fromJson(json));
      },
      onError: (error) {
        _etatController.add(false);
        _planifierReconnexion();
      },
      onDone: () {
        _etatController.add(false);
        if (!_fermeManuel) _planifierReconnexion();
      },
    );

    _etatController.add(true);
    _viderFileAttente();
  }

  void _planifierReconnexion() {
    if (_fermeManuel) return;
    _timerReconnexion?.cancel();
    final delaiSecondes = (1 << _tentativeReconnexion).clamp(1, 30);
    _tentativeReconnexion++;
    _timerReconnexion = Timer(Duration(seconds: delaiSecondes), _connecter);
  }

  void _viderFileAttente() {
    if (_messagesEnAttente.isEmpty) return;
    for (final m in List.of(_messagesEnAttente)) {
      _channel?.sink.add(jsonEncode(m));
    }
    _messagesEnAttente.clear();
  }

  void envoyer(String auteur, String contenu, {Map<String, dynamic>? extra}) {
    final message = <String, dynamic>{'contenu': contenu};
    if (_estCercle) {
      message['auteur_label'] = auteur;
      if (extra != null) message.addAll(extra);
    } else {
      message['auteur'] = auteur;
    }
    if (_channel == null) {
      _messagesEnAttente.add(message);
      return;
    }
    try {
      _channel!.sink.add(jsonEncode(message));
    } catch (_) {
      _messagesEnAttente.add(message);
    }
  }

  void fermer() {
    _fermeManuel = true;
    _timerReconnexion?.cancel();
    _channel?.sink.close();
    _messagesController.close();
    _etatController.close();
  }
}