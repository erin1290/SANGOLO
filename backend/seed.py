import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sangolo.settings")
import django
django.setup()

from django.contrib.auth.models import User
from accounts.models import Superviseur

ADMIN_EMAIL = "admini@sangolo.org"
ADMIN_USERNAME = "admini"
ADMIN_PASSWORD = "123"
ADMIN_NOM = "Admini"

user, created = User.objects.get_or_create(
    username=ADMIN_USERNAME,
    defaults={
        "email": ADMIN_EMAIL,
        "is_staff": True,
        "is_superuser": True,
        "first_name": ADMIN_NOM,
    },
)
user.set_password(ADMIN_PASSWORD)
user.is_staff = True
user.is_superuser = True
user.save()
print(f"Utilisateur: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")

superviseur, _ = Superviseur.objects.get_or_create(
    user=user,
    defaults={
        "nom_complet": ADMIN_NOM,
        "email": ADMIN_EMAIL,
    },
)
superviseur.save()
print("Superviseur associe:", superviseur.nom_complet)
