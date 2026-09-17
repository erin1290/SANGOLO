"""
App: accounts
Les quatre profils utilisateurs de Sangolo.

Décisions reprises du cahier des charges :
- L'ado est anonyme : pseudo + âge + mot de passe, aucune donnée identifiante.
- L'écoutant n'a pas d'inscription libre : son compte est créé après validation
  (institution partenaire + formation + entretien + période probatoire).
- Le superviseur/admin a un accès restreint.
- Le psychologue partenaire est le seul profil habilité aux séances physiques.
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
        help_text="Double sécurité Face ID + mot de passe activée par l'ado."
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)

    consentement_analyse_ia = models.BooleanField(default=False)

    def set_mot_de_passe(self, mot_de_passe_clair):
        self.mot_de_passe_hash = make_password(mot_de_passe_clair)

    def __str__(self):
        return self.pseudo


class StatutEcoutant(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente de validation"
    VALIDE = "valide", "Validé"
    REFUSE = "refuse", "Refusé"
    PROBATOIRE = "probatoire", "Période probatoire"


class Ecoutant(models.Model):
    """Volontaire formé. Compte créé après validation, jamais en auto-inscription."""

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
        help_text="Fac de psychologie ou ONG ayant pré-validé le volontaire."
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

    sexe = models.CharField(max_length=1, choices=[("M", "Masculin"), ("F", "Féminin")], blank=True)
    date_entretien = models.DateTimeField(null=True, blank=True)
    lieu_entretien = models.CharField(max_length=200, blank=True)
    email_invitation_envoyee = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    def peut_accompagner_ado(self):
        return self.statut in (StatutEcoutant.VALIDE, StatutEcoutant.PROBATOIRE)

    def __str__(self):
        return f"{self.nom_complet} ({self.get_statut_display()})"


class Superviseur(models.Model):
    """Équipe de supervision : reçoit les alertes, valide les écoutants."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="superviseur_profile", null=True, blank=True
    )
    nom_complet = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    mot_de_passe_hash = models.CharField(max_length=255)
    est_psychologue = models.BooleanField(
        default=False,
        help_text="Un superviseur peut aussi être le psychologue référent."
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom_complet


class StatutPsychologue(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente de validation"
    VALIDE = "valide", "Validé"
    REFUSE = "refuse", "Refusé"


class PsychologuePartenaire(models.Model):
    """
    Seul profil habilité aux séances physiques (toujours en lieu institutionnel).
    Même logique d'inscription/validation que l'écoutant : auto-inscription,
    entretien fixé par un superviseur, compte actif seulement après validation.
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
    sexe = models.CharField(max_length=1, choices=[("M", "Masculin"), ("F", "Féminin")], blank=True)
    mot_de_passe_hash = models.CharField(max_length=255, blank=True)

    statut = models.CharField(
        max_length=20, choices=StatutPsychologue.choices,
        default=StatutPsychologue.EN_ATTENTE
    )
    date_entretien = models.DateTimeField(null=True, blank=True)
    lieu_entretien = models.CharField(max_length=200, blank=True)
    email_invitation_envoyee = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)

    def peut_se_connecter(self):
        return self.statut == StatutPsychologue.VALIDE

    def __str__(self):
        return f"{self.nom_complet} — {self.structure}"