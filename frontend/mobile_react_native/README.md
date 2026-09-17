# Sangolo — App mobile (React Native / Expo)

Conversion complète du code Flutter en React Native — même palette,
même typographie (Fraunces + Manrope), même disposition d'écrans.

## Installation

```
npm install
npx expo start
```
Scanne le QR code avec l'app Expo Go (Android : bouton intégré ;
iPhone : appareil photo natif). Téléphone et ordinateur doivent être
sur le même réseau WiFi — sinon utilise `npx expo start --tunnel`.

## Connexion au backend
Par défaut : `http://localhost:8000/api`. Si "localhost" ne marche pas
depuis ton téléphone (test via Expo Go, pas un émulateur), remplace
par l'adresse IP locale de ta machine dans `.env` — voir `.env.example`.

## Écrans — parité complète avec la version Flutter

**Ado** : accueil, inscription, accueil, journal (audio/photo réels),
chat (WebSocket + reconnexion auto), SOS, verrouillage Face ID, profil.

**Écoutant** : accueil, connexion, tableau de bord, conversations en
attente (branché à l'API), chat écoutant (bouton Signaler), cercle -
modération, escalade + confirmation, planning, profil, paramètres.

**Admin** : connexion, tableau de bord, liste des alertes filtrable,
détail d'une alerte, validation des écoutants, annuaire, paramètres.

Tous les écrans réutilisent `src/components/Shared.js` et
`src/theme/colors.js` — mêmes couleurs et composants que Flutter,
rien de dénaturé dans le design.

## Ce qui reste
- Navigation d'entrée (écran de choix de rôle ado/écoutant/admin —
  actuellement chaque flux se lance indépendamment, pas encore relié
  à un point d'entrée unique)
- Jamais lancé en conditions réelles dans cette session
- Icônes d'app réelles (favicon/icon.png)
- Écran de connexion psychologue partenaire (fait côté Flutter, pas
  encore porté ici)
