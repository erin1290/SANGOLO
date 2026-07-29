import 'package:flutter_test/flutter_test.dart';
import 'package:sangolo/services/api_service.dart';

void main() {
  group('ApiException', () {
    test('conserve le message d\'erreur transmis', () {
      final exception = ApiException('Pseudo déjà pris');
      expect(exception.toString(), 'Pseudo déjà pris');
      expect(exception.message, 'Pseudo déjà pris');
    });
  });

  group('ApiConfig', () {
    test('utilise une URL par défaut cohérente pour un émulateur Android', () {
      expect(ApiConfig.baseUrl, contains('/api'));
    });
  });
}
