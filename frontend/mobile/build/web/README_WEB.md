# Sangolo — Version web (Flutter Web)

Ce dossier active la cible web pour l'app Flutter — **même code Dart**
que l'app mobile (`lib/`), aucune duplication. C'est le principal
intérêt de Flutter pour ce projet : un seul développement pour mobile
ET web, comme demandé dans le cahier des charges.

## Lancer en développement

```
flutter run -d chrome
```

## Construire pour la production

```
flutter build web
```
Génère un dossier `build/web/` statique, déployable sur n'importe quel
hébergeur de fichiers statiques (Nginx, Netlify, Vercel, GitHub Pages,
ou un simple serveur derrière le backend Django).

## Différences avec le mobile

- **URL de l'API** : sur mobile Android en émulateur, l'app utilise
  `10.0.2.2` pour joindre `localhost` de la machine hôte. Sur le web,
  ça n'a pas de sens (le navigateur tourne déjà sur la machine hôte)
  — `lib/services/api_service.dart` doit détecter la plateforme web
  (`kIsWeb`) et utiliser `localhost` directement. Voir la mise à jour
  apportée à `ApiConfig` cette session.
- **Face ID / authentification biométrique** (`local_auth`) n'existe
  pas dans un navigateur — l'écran de verrouillage doit se limiter au
  mot de passe côté web (à gérer avec une vérification de plateforme
  dans `verrouillage_screen.dart`, pas encore fait).
- **Enregistrement audio** (`record`) et **sélection de photo**
  (`image_picker`) fonctionnent différemment dans un navigateur
  (permissions, formats) — à tester spécifiquement une fois `flutter
  run -d chrome` lancé, pas garanti fonctionner du premier coup sans
  ajustement.

## Icônes

Les icônes réelles (`icons/Icon-192.png`, `icons/Icon-512.png`,
`favicon.png`) ne sont pas encore générées dans cette session — à
produire à partir du logo Sangolo avant un vrai déploiement (sinon
Flutter utilisera ses icônes par défaut).
