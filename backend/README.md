# Sangolo — Backend

Django + Django REST Framework + PostgreSQL + Channels.

## Installation

1. `python -m venv venv && source venv/bin/activate`
2. `pip install -r requirements.txt`
3. Copier `.env.example` en `.env` et remplir les valeurs (base PostgreSQL réelle,
   pas de SQLite — voir cahier des charges).
4. `python manage.py makemigrations accounts journal messagerie alertes ressources planning`
5. `python manage.py migrate`
6. `python manage.py createsuperuser` (pour accéder à /admin/)
7. `python manage.py runserver` (ou `daphne sangolo.asgi:application` pour le temps réel)

## Structure des apps

| App | Rôle |
|---|---|
| `accounts` | Les 4 profils : Utilisateur (ado), Ecoutant, Superviseur, PsychologuePartenaire + authentification |
| `journal` | Journal émotionnel (texte, audio, photo) |
| `messagerie` | Tchat 1-to-1 et cercles d'écoute, avec consumers WebSocket (Channels) |
| `alertes` | Alertes écoutant + module de supervision IA (`alertes/supervision.py`) — décision toujours humaine |
| `ressources` | Annuaire psychologues / ONG / centres |
| `planning` | Créneaux écoutants ; séance physique réservée aux psychologues certifiés (vérifié modèle + serializer) |

## Points de vigilance déjà encodés dans le code

- `planning/models.py` et `planning/serializers.py` : impossible d'assigner une
  séance physique à un écoutant, seulement à un psychologue partenaire certifié.
- `alertes/supervision.py` : le module IA ne répond jamais à un utilisateur,
  il crée uniquement une `Alerte` à destination d'un superviseur humain.
- `accounts/auth.py` : l'ado s'inscrit par pseudo + âge + mot de passe, jamais
  d'email ni de donnée identifiante.

## Tests

Chaque app critique a sa suite de tests, avec une attention particulière
aux garde-fous du cahier des charges :

- `accounts/tests.py` — inscription ado sans donnée identifiante,
  écoutant non validé refusé à la connexion
- `journal/tests.py` — un ado ne voit jamais le journal d'un autre
- `messagerie/tests.py` — scoping conversations/messages (couvre les
  deux bugs corrigés en session), rattachement automatique de l'ado
- `alertes/tests.py` — le module IA crée une alerte mais ne répond
  jamais lui-même à personne
- `planning/tests.py` — une séance physique ne peut jamais être
  assignée à un écoutant

Lancer toute la suite :
```
python manage.py test
```
