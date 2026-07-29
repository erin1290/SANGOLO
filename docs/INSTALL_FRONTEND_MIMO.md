# Sangolo — Installation du FRONTEND Flutter (à exécuter par un agent IA / Mimo)

**État actuel du projet : le code de l'application Flutter n'a pas encore
été généré dans cette session — seul le backend Django existe pour
l'instant.** Ce document prépare l'environnement Flutter pour qu'il soit
prêt dès que le code de l'app sera ajouté dans `frontend/mobile/`.

## 0. Détection de l'OS

Adapter l'installation du SDK Flutter selon macOS / Linux / Windows
(voir étape 1).

## 1. Installer le SDK Flutter

**macOS :**
```
brew install --cask flutter
```

**Linux :**
```
sudo snap install flutter --classic
```
ou télécharger l'archive depuis https://docs.flutter.dev/get-started/install/linux
et l'ajouter au PATH.

**Windows :**
Télécharger le SDK depuis https://docs.flutter.dev/get-started/install/windows
et l'ajouter au PATH.

**Vérification :**
```
flutter --version
```
Doit afficher une version Flutter (canal stable recommandé) et Dart.

## 2. Vérifier l'installation complète avec flutter doctor

```
flutter doctor
```
Corriger chaque point signalé en rouge ou orange :
- Android : installer Android Studio + Android SDK si le développement
  Android est visé.
- iOS (macOS uniquement) : installer Xcode + CocoaPods
  (`sudo gem install cocoapods`) si le développement iOS est visé.
- Éditeur : l'extension Flutter/Dart pour VS Code est recommandée mais
  optionnelle.

## 3. Une fois le code Flutter ajouté dans frontend/mobile/

```
cd frontend/mobile
flutter pub get
```
Installe toutes les dépendances listées dans `pubspec.yaml`.

**Vérification :**
```
flutter analyze
```
Ne doit remonter aucune erreur bloquante (des avertissements mineurs
sont acceptables).

## 4. Lancer l'application

Lister les appareils/émulateurs disponibles :
```
flutter devices
```

Si aucun appareil physique n'est connecté, démarrer un émulateur :
- Android : `flutter emulators --launch <nom_emulateur>`
  (créer un émulateur via Android Studio si la liste est vide)
- iOS (macOS) : `open -a Simulator`

Puis lancer l'app :
```
flutter run
```

## 5. Connexion au backend

L'app Flutter doit pointer vers l'API Django lancée en local
(voir INSTALL_BACKEND_MIMO.md). Par défaut, un émulateur Android utilise
`10.0.2.2` pour joindre `localhost` de la machine hôte ; un simulateur
iOS peut utiliser `localhost` directement. Cette valeur sera à
configurer dans le fichier de config de l'app une fois celui-ci créé
(probablement `lib/services/api_config.dart`).

## En cas d'erreur

- `flutter doctor` bloqué sur les licences Android →
  `flutter doctor --android-licenses` puis accepter chaque licence.
- Émulateur Android lent ou ne démarre pas → vérifier que la
  virtualisation matérielle (VT-x/AMD-V) est activée dans le BIOS.
- `pub get` échoue → vérifier la connexion internet et que la version
  Flutter installée correspond à celle attendue dans `pubspec.yaml`
  (contrainte `sdk:` du fichier).
