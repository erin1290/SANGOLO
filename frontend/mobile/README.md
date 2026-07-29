
## Web (Flutter Web) — ajouté cette session

Le côté web n'est pas un projet séparé : c'est le **même code Dart**
(`lib/`) qui tourne aussi dans le navigateur, via la cible Flutter Web
activée dans `web/`. Voir `web/README_WEB.md` pour le détail.

Lancer :
```
flutter run -d chrome
```

`ApiConfig` (dans `lib/services/api_service.dart`) détecte maintenant
la plateforme web et utilise `localhost` au lieu de `10.0.2.2`
(spécifique à l'émulateur Android).

**Pas encore fait pour le web** : icônes réelles (favicon, Icon-192,
Icon-512 — actuellement absentes), adaptation de l'écran de
verrouillage (Face ID n'existe pas dans un navigateur), test réel de
l'enregistrement audio et de la sélection photo en environnement web.
