"""
App: accounts
Les quatre profils utilisateurs de Sangolo.

DÃ©cisions reprises du cahier des charges :
- L'ado est anonyme : pseudo + Ã¢ge + mot de passe, aucune donnÃ©e identifiante.
- L'Ã©coutant n'a pas d'inscription libre : son compte est crÃ©Ã© aprÃ¨s validation
  (institution partenaire + formation + entretien + pÃ©riode probatoire).
- Le superviseur/admin a un accÃ¨s restreint.
- Le psychologue partenaire est le seul profil habilitÃ© aux sÃ©ances physiques.
"""
from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password


class Utilisateur(models.Model):
    """L'ado. Volontairement minimal : rien qui permette de l'identifier."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="utilisateur_profile"
    )
    pseudo = models.CharField(max_length=30, unique=True)
    age = models.PositiveSmallIntegerField()
    mot_de_passe_hash = models.CharField(max_length=255)

    securite_biometrique_active = models.BooleanField(
        default=False,
        help_text="Double sÃ©curitÃ© Face ID + mot de passe activÃ©e par l'ado."
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)

    # Consentement Ã  l'analyse du module de supervision IA (cf. app alertes)
    consentement_analyse_ia = models.BooleanField(default=False)

    def set_mot_de_passe(self, mot_de_passe_clair):
        self.mot_de_passe_hash = make_password(mot_de_passe_clair)

    def __str__(self):
        return self.pseudo


class StatutEcoutant(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente de validation"
    VALIDE = "valide", "ValidÃ©"
    REFUSE = "refuse", "RefusÃ©"
    PROBATOIRE = "probatoire", "PÃ©riode probatoire"


class Ecoutant(models.Model):
    """Volontaire formÃ©. Compte crÃ©Ã© aprÃ¨s validation, jamais en auto-inscription."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="ecoutant_profile", null=True, blank=True
    )
    nom_complet = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    mot_de_passe_hash = models.CharField(max_length=255)

    statut = models.CharField(
        max_length=20, choices=StatutEcoutant.choices,
        default=StatutEcoutant.EN_ATTENTE
    )
    institution_partenaire = models.CharField(
        max_length=150, blank=True,
        help_text="Fac de psychologie ou ONG ayant prÃ©-validÃ© le volontaire."
    )
    formation_validee = models.BooleanField(default=False)
    entretien_effectue = models.BooleanField(default=False)
    date_validation = models.DateTimeField(null=True, blank=True)

    disponible = models.BooleanField(default=False)
    consentement_analyse_ia = models.BooleanField(default=False)
    langue_preferee = models.CharField(
        max_length=10,
        choices=[("fr", "Francais"), ("en", "English")],
        default="fr",
        blank=True,
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    def peut_accompagner_ado(self):
        return self.statut in (StatutEcoutant.VALIDE, StatutEcoutant.PROBATOIRE)

    def __str__(self):
        return f"{self.nom_complet} ({self.get_statut_display()})"


class Superviseur(models.Model):
    """Ã‰quipe de supervision : reÃ§oit les alertes, valide les Ã©coutants."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="superviseur_profile", null=True, blank=True
    )
    nom_complet = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    mot_de_passe_hash = models.CharField(max_length=255)
    est_psychologue = models.BooleanField(
        default=False,
        help_text="Un superviseur peut aussi Ãªtre le psychologue rÃ©fÃ©rent."
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom_complet


class PsychologuePartenaire(models.Model):
    """
    Seul profil habilitÃ© aux sÃ©ances physiques (toujours en lieu institutionnel).
    Distinct de Superviseur : un psychologue partenaire n'a pas forcÃ©ment
    accÃ¨s au tableau de bord de supervision.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="psychologue_profile", null=True, blank=True
    )
    nom_complet = models.CharField(max_length=100)
    structure = models.CharField(max_length=150, help_text="Cabinet, centre, ONG")
    ville = models.CharField(max_length=80)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=30, blank=True)
    certifie = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nom_complet} â€” {self.structure}"
