import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Point de configuration unique de l'URL du backend.
/// - Web (kIsWeb) : le navigateur tourne deja sur la machine hote,
///   donc localhost fonctionne directement.
/// - Emulateur Android : 10.0.2.2 pour joindre localhost de l'hote.
/// - Autres cas (iOS simulateur, appareil physique) : a adapter via
///   --dart-define=API_BASE_URL=... au lancement.
class ApiConfig {
  static const String _override = String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    if (kIsWeb) return 'http://localhost:8000/api';
    return 'http://10.0.2.2:8000/api';
  }
}

class ApiService {
  final _storage = const FlutterSecureStorage();

  Future<String?> _token() => _storage.read(key: 'auth_token');

  Future<Map<String, String>> _headers({bool withAuth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (withAuth) {
      final token = await _token();
      if (token != null) headers['Authorization'] = 'Token ';
    }
    return headers;
  }

  // ---- Authentification ado ----

  Future<Map<String, dynamic>> inscriptionAdo({
    required String pseudo,
    required int age,
    required String motDePasse,
    required bool consentementAnalyseIa,
  }) async {
    final response = await http.post(
      Uri.parse('/accounts/auth/ado/inscription/'),
      headers: await _headers(withAuth: false),
      body: jsonEncode({
        'pseudo': pseudo,
        'age': age,
        'mot_de_passe': motDePasse,
        'consentement_analyse_ia': consentementAnalyseIa,
      }),
    );
    return _handleAuthResponse(response);
  }

  Future<Map<String, dynamic>> connexionAdo({
    required String pseudo,
    required String motDePasse,
  }) async {
    final response = await http.post(
      Uri.parse('/accounts/auth/ado/connexion/'),
      headers: await _headers(withAuth: false),
      body: jsonEncode({'pseudo': pseudo, 'mot_de_passe': motDePasse}),
    );
    return _handleAuthResponse(response);
  }

  Future<Map<String, dynamic>> _handleAuthResponse(http.Response response) async {
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      await _storage.write(key: 'auth_token', value: data['token']);
      return data;
    }
    throw ApiException(data['detail']?.toString() ?? 'Erreur de connexion');
  }

  Future<void> deconnexion() => _storage.delete(key: 'auth_token');

  // ---- Journal ----

  Future<List<dynamic>> listerEntreesJournal() async {
    final response = await http.get(
      Uri.parse('/journal/entrees/'),
      headers: await _headers(),
    );
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  Future<Map<String, dynamic>> creerEntreeJournal({
    required String humeur,
    String texte = '',
  }) async {
    final response = await http.post(
      Uri.parse('/journal/entrees/'),
      headers: await _headers(),
      body: jsonEncode({'humeur': humeur, 'texte': texte}),
    );
    _verifierErreur(response);
    return jsonDecode(response.body);
  }

  // ---- Conversations ----

  Future<List<dynamic>> listerConversations() async {
    final response = await http.get(
      Uri.parse('/messagerie/conversations/'),
      headers: await _headers(),
    );
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  // ---- Cercles d'ecoute ----

  Future<List<dynamic>> listerCerclesEcoute() async {
    final response = await http.get(
      Uri.parse('/messagerie/cercles/'),
      headers: await _headers(),
    );
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  Future<Map<String, dynamic>> creerCercle({required String theme}) async {
    final response = await http.post(
      Uri.parse('/messagerie/cercles/'),
      headers: await _headers(),
      body: jsonEncode({'theme': theme, 'actif': true}),
    );
    _verifierErreur(response);
    return jsonDecode(response.body);
  }

  Future<List<dynamic>> listerMessagesCercle(int cercleId) async {
    final response = await http.get(
      Uri.parse('/messagerie/messages-cercle/?cercle='),
      headers: await _headers(),
    );
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  // ---- Membres Cercle ----

  Future<List<dynamic>> listerMembresCercle(int cercleId) async {
    final response = await http.get(
      Uri.parse('/messagerie/membres-cercle/?cercle='),
      headers: await _headers(),
    );
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  Future<Map<String, dynamic>> rejoindreCercle(int cercleId) async {
    final response = await http.post(
      Uri.parse('/messagerie/membres-cercle/'),
      headers: await _headers(),
      body: jsonEncode({'cercle': cercleId}),
    );
    _verifierErreur(response);
    return jsonDecode(response.body);
  }

  Future<void> quitterCercle(int membreId) async {
    final response = await http.delete(
      Uri.parse('/messagerie/membres-cercle//'),
      headers: await _headers(),
    );
    _verifierErreur(response);
  }

  // ---- Planning ----

  Future<List<dynamic>> listerCreneauxPlanning({int? cercleId}) async {
    final uri = cercleId != null
        ? Uri.parse('/planning/creneaux/?cercle=')
        : Uri.parse('/planning/creneaux/');
    final response = await http.get(uri, headers: await _headers());
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  Future<Map<String, dynamic>> creerCreneau({
    required int jourSemaine,
    required String heure,
    required String typeCreneau,
    int? cercleId,
  }) async {
    final body = <String, dynamic>{
      'jour_semaine': jourSemaine,
      'heure': heure,
      'type_creneau': typeCreneau,
    };
    if (cercleId != null) body['cercle'] = cercleId;
    final response = await http.post(
      Uri.parse('/planning/creneaux/'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    _verifierErreur(response);
    return jsonDecode(response.body);
  }

  // ---- Ressources ----

  Future<List<dynamic>> listerRessources({String? ville}) async {
    final uri = Uri.parse('/ressources/ressources/')
        .replace(queryParameters: ville != null ? {'ville': ville} : null);
    final response = await http.get(uri, headers: await _headers());
    _verifierErreur(response);
    final data = jsonDecode(response.body);
    return data is Map ? (data['results'] ?? []) : data;
  }

  // ---- Profil ecoutant ----

  Future<Map<String, dynamic>> getProfilEcoutant(int id) async {
    final response = await http.get(
      Uri.parse('/accounts/ecoutants//'),
      headers: await _headers(),
    );
    _verifierErreur(response);
    return jsonDecode(response.body);
  }

  Future<void> updateLangueEcoutant(int id, String langue) async {
    final response = await http.patch(
      Uri.parse('/accounts/ecoutants//'),
      headers: await _headers(),
      body: jsonEncode({'langue_preferee': langue}),
    );
    _verifierErreur(response);
  }

  void _verifierErreur(http.Response response) {
    if (response.statusCode >= 400) {
      throw ApiException('Erreur  : ');
    }
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}