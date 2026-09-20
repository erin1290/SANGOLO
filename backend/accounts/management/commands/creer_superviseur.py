from getpass import getpass

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Superviseur


class Command(BaseCommand):
    help = "Crée ou répare un compte superviseur utilisable dans l'application mobile."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--nom", required=True)
        parser.add_argument("--mot-de-passe")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        mot_de_passe = options["mot_de_passe"] or getpass("Mot de passe du superviseur : ")
        if len(mot_de_passe) < 8:
            raise CommandError("Le mot de passe doit comporter au moins 8 caractères.")

        superviseur, _ = Superviseur.objects.get_or_create(
            email=email,
            defaults={"nom_complet": options["nom"], "mot_de_passe_hash": ""},
        )
        user = superviseur.user or User.objects.filter(email__iexact=email).first()
        if user is None:
            base_username = f"superviseur_{superviseur.id or email.split('@')[0]}"
            username = base_username
            suffixe = 2
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{suffixe}"
                suffixe += 1
            user = User.objects.create_user(username=username, email=email)

        user.email = email
        user.is_staff = True
        user.set_password(mot_de_passe)
        user.save()

        superviseur.user = user
        superviseur.nom_complet = options["nom"]
        superviseur.mot_de_passe_hash = user.password
        superviseur.save()
        self.stdout.write(self.style.SUCCESS(
            f"Le superviseur {email} peut maintenant se connecter depuis le mobile."
        ))
