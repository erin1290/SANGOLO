"""
App: planning
Créneaux fixés par les écoutants pour les cercles d’écoute.
Les séances physiques restent un type distinct, réservé aux
psychologues partenaires certifiés — jamais aux écoutants volontaires.
"""
from django.db import models


class TypeCreneau(models.TextChoices):
    CERCLE = "cercle", "Cercle d’écoute"
    SEANCE_PHYSIQUE = "seance_physique", "Séance physique (psychologue certifié uniquement)"


class CreneauPlanning(models.Model):
    ecoutant = models.ForeignKey(
        "accounts.Ecoutant", on_delete=models.CASCADE, related_name="creneaux", null=True, blank=True
    )
    psychologue = models.ForeignKey(
        "accounts.PsychologuePartenaire", on_delete=models.CASCADE,
        related_name="creneaux", null=True, blank=True
    )
    type_creneau = models.CharField(max_length=20, choices=TypeCreneau.choices)
    cercle = models.ForeignKey(
        "messagerie.CercleEcoute", on_delete=models.SET_NULL, null=True, blank=True
    )
    jour_semaine = models.PositiveSmallIntegerField(help_text="0 = lundi ... 6 = dimanche")
    heure = models.TimeField()
    lieu_institutionnel = models.CharField(
        max_length=150, blank=True,
        help_text="Obligatoire pour une séance physique — jamais un lieu privé."
    )

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.type_creneau == TypeCreneau.SEANCE_PHYSIQUE:
            if self.ecoutant is not None:
                raise ValidationError(
                    "Une séance physique ne peut être tenue que par un psychologue partenaire certifié."
                )
            if not self.lieu_institutionnel:
                raise ValidationError("Une séance physique doit préciser un lieu institutionnel.")
