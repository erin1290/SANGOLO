# Sangolo — Installation du BACKEND (à exécuter par un agent IA / Mimo)

Ce document est écrit pour être suivi automatiquement par un agent
d'installation (ex : Mimo). Toutes les commandes sont explicites,
dans l'ordre, avec les vérifications à faire à chaque étape. Si une
commande échoue, corriger le problème signalé avant de passer à la
suivante — ne pas sauter d'étape.

Le dossier du backend s'appelle `backend/` (voir zip SANGOLO.zip fourni).

## 0. Détection de l'OS

Détecter automatiquement le système (Windows / macOS / Linux) et
adapter les commandes d'installation de PostgreSQL et Redis en
conséquence (voir étape 1 et 2).

## 1. Installer PostgreSQL

**macOS (Homebrew) :**
```
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Debian/Ubuntu) :**
```
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
```

**Windows :**
Télécharger et installer via https://www.postgresql.org/download/windows/
puis s'assurer que le service "postgresql" est démarré.

**Créer la base et l'utilisateur :**
```
psql -U postgres -c "CREATE DATABASE sangolo;"
psql -U postgres -c "CREATE USER sangolo WITH PASSWORD 'sangolo_dev_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sangolo TO sangolo;"
```

**Vérification :** `psql -U sangolo -d sangolo -c "SELECT 1;"` doit retourner `1`.

## 2. Installer Redis

**macOS :** `brew install redis && brew services start redis`
**Linux :** `sudo apt install -y redis-server && sudo service redis-server start`
**Windows :** utiliser WSL2 puis suivre les instructions Linux, ou installer
Redis via https://github.com/microsoftarchive/redis/releases

**Vérification :** `redis-cli ping` doit retourner `PONG`.

## 3. Installer Python 3.11+ et créer l'environnement virtuel

```
cd backend
python3 --version   # doit être >= 3.11, sinon installer une version récente
python3 -m venv venv
source venv/bin/activate      # Windows : venv\Scripts\activate
```

## 4. Installer les dépendances Python

```
pip install --upgrade pip
pip install -r requirements.txt
```

**Vérification :** `pip list` doit contenir Django, djangorestframework,
psycopg2-binary, channels, channels-redis, django-filter, Pillow.

## 5. Configurer les variables d'environnement

Copier `.env.example` en `.env` et y mettre :
```
DJANGO_SECRET_KEY=une-valeur-aleatoire-longue
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=sangolo
DB_USER=sangolo
DB_PASSWORD=sangolo_dev_password
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379
```
(Générer `DJANGO_SECRET_KEY` avec :
`python -c "import secrets; print(secrets.token_urlsafe(50))"`)

## 6. Charger les variables d'environnement puis migrer la base

```
export $(cat .env | xargs)     # Windows (PowerShell) : voir note ci-dessous
python manage.py makemigrations accounts journal messagerie alertes ressources planning
python manage.py migrate
```

Note Windows PowerShell pour charger `.env` :
```
Get-Content .env | ForEach-Object { if ($_ -match '^([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }
```

**Vérification :** la commande `migrate` doit se terminer sans erreur et
afficher une liste de migrations appliquées (OK en vert).

## 7. Créer un superutilisateur Django (pour /admin/)

```
python manage.py createsuperuser
```
Renseigner un email et un mot de passe quand demandé.

## 8. Charger les données de démonstration

```
python manage.py seed_demo
```

Doit afficher un message de succès avec les identifiants de démo
(ado `mango_23`, écoutante `aline@partenaire.org`, superviseur
`superviseur@sangolo.org`, mot de passe `demo12345` pour les trois).

## 9. Lancer le serveur

Pour tester l'API classique :
```
python manage.py runserver
```
Aller sur http://127.0.0.1:8000/admin/ et se connecter avec le
superutilisateur créé à l'étape 7 — vérifier que les objets créés par
`seed_demo` (Utilisateur, Ecoutant, Conversation, Alerte...) apparaissent.

Pour tester le temps réel (chat / cercles, nécessite Daphne) :
```
daphne sangolo.asgi:application
```

## 10. Tester les endpoints API principaux

```
curl -X POST http://127.0.0.1:8000/api/accounts/auth/ado/connexion/ \
  -H "Content-Type: application/json" \
  -d '{"pseudo": "mango_23", "mot_de_passe": "demo12345"}'
```
Doit retourner un JSON avec un `token`.

```
curl -X POST http://127.0.0.1:8000/api/accounts/auth/ecoutant/connexion/ \
  -H "Content-Type: application/json" \
  -d '{"email": "aline@partenaire.org", "mot_de_passe": "demo12345"}'
```
Doit aussi retourner un `token`.

## En cas d'erreur

- `psycopg2` échoue à l'installation → installer les en-têtes PostgreSQL
  (`libpq-dev` sur Linux, ou utiliser `psycopg2-binary` qui est déjà dans
  requirements.txt et ne devrait pas nécessiter de compilation).
- `connection refused` sur la base → vérifier que le service PostgreSQL
  tourne (étape 1) et que `.env` correspond aux identifiants créés.
- `channels_redis` erreur de connexion → vérifier que Redis tourne
  (étape 2, `redis-cli ping`).
