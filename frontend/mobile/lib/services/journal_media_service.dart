import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

/// Gère la capture audio/photo pour le journal et leur envoi vers
/// EntreeJournal.fichier_audio / fichier_photo (backend/journal/models.py).
class JournalMediaService {
  final _recorder = AudioRecorder();
  final _picker = ImagePicker();
  final _storage = const FlutterSecureStorage();
  String? _cheminAudioEnCours;

  Future<bool> demarrerEnregistrementAudio() async {
    if (!await _recorder.hasPermission()) return false;
    final dossier = await getTemporaryDirectory();
    _cheminAudioEnCours = '${dossier.path}/journal_${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _recorder.start(const RecordConfig(), path: _cheminAudioEnCours!);
    return true;
  }

  /// Arrête l'enregistrement et envoie directement l'entrée de journal
  /// avec le fichier audio joint (humeur choisie en amont dans l'écran).
  Future<void> arreterEtEnvoyerAudio({required String humeur}) async {
    final chemin = await _recorder.stop();
    if (chemin == null) return;
    await _envoyerEntreeAvecFichier(humeur: humeur, cheminFichier: chemin, champ: 'fichier_audio');
  }

  Future<void> choisirEtEnvoyerPhoto({required String humeur}) async {
    final image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image == null) return;
    await _envoyerEntreeAvecFichier(humeur: humeur, cheminFichier: image.path, champ: 'fichier_photo');
  }

  Future<void> _envoyerEntreeAvecFichier({
    required String humeur,
    required String cheminFichier,
    required String champ,
  }) async {
    final token = await _storage.read(key: 'auth_token');
    final uri = Uri.parse('${ApiConfig.baseUrl}/journal/entrees/');
    final request = http.MultipartRequest('POST', uri);
    if (token != null) request.headers['Authorization'] = 'Token $token';
    request.fields['humeur'] = humeur;
    request.files.add(await http.MultipartFile.fromPath(champ, cheminFichier));

    final response = await request.send();
    if (response.statusCode >= 400) {
      throw ApiException('Échec de l\'envoi du fichier (${response.statusCode}).');
    }
    // Nettoyage du fichier temporaire local après envoi réussi.
    final f = File(cheminFichier);
    if (await f.exists()) await f.delete();
  }

  void dispose() {
    _recorder.dispose();
  }
}
