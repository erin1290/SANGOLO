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

Expo Go détecte automatiquement l'IP du PC à partir du QR code Metro et
utilise ce même PC pour joindre Django sur le port 8000. Il n'y a donc aucune
IP à modifier quand le Wi-Fi change. Après le changement de réseau, redémarre
simplement le backend et `npm start`, puis rescanner le nouveau QR code.

Le téléphone et le PC doivent être sur le **même Wi-Fi**. Si ce n'est pas
possible, il faut déployer Django sur une URL HTTPS fixe (à définir alors via
`EXPO_PUBLIC_API_URL`) : un téléphone ne peut pas joindre un serveur lancé
uniquement sur un autre réseau local.

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

## Vérification avant essai

1. Démarrer PostgreSQL puis appliquer les migrations : `cd ../../backend && venv/bin/python manage.py migrate`.
2. Lancer le backend sur le réseau : `venv/bin/python manage.py runserver 0.0.0.0:8000`.
3. Vérifier depuis le téléphone que `http://IP_DU_PC:8000/admin/` répond.
4. Depuis ce dossier, lancer `npm start`, scanner le QR avec Expo Go et accepter l'accès au réseau local.
# Démarrage sur téléphone (Expo Go)

Lancer une seule instance depuis ce dossier :

```bash
npm start
```

Si le téléphone et le PC ne peuvent pas se joindre sur le Wi-Fi, utiliser :

```bash
npm run start:tunnel
```

Avant de scanner le QR, fermer complètement Expo Go puis vider son stockage/cache Android. L'erreur Android `JSBigFileString::fromPath - Could not open file` vient du cache natif d'Expo Go qui conserve un ancien bundle absent ; elle intervient avant le code Sangolo.
