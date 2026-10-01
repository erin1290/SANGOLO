"""Configuration locale uniquement pour exécuter la suite de tests.

Elle évite toute connexion à PostgreSQL et donc tout risque de toucher la
base de données de développement ou de production. L'application elle-même
continue d'utiliser PostgreSQL via ``sangolo.settings``.
"""
from .settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Les tâches de fond ne doivent pas lancer de vrai thread pendant les tests.
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# Les mots de passe de test ne sont jamais persistés ; ce hasher rend la suite
# rapide sans modifier la sécurité de l'application réelle.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Les tests de vues existants utilisent ``force_login`` ; l'application de
# production reste strictement en authentification par token dans settings.py.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
}
