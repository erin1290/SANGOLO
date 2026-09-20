"""
App: alertes
Le cœur du dispositif de sécurité : qu'une alerte vienne d'un écoutant
qui signale, ou du module de supervision IA qui détecte un signal,
elle arrive toujours au même endroit et c'est toujours un superviseur
humain qui décide de la suite.
"""
from django.db import models
from accounts.models import Superviseur, PsychologuePartenaire
from messagerie.models import Conversation, Message


class SourceAlerte(models.TextChoices):
    ECOUTANT = "ecoutant", "Signalée par un écoutant"
    MODULE_IA = "module_ia", "Détectée par le module de supervision"


class GraviteAlerte(models.TextChoices):
    FAIBLE = "faible", "Faible"
    MOYEN = "moyen", "Moyen"
    URGENT = "urgent", "Urgent"


class StatutAlerte(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente"
    EN_COURS = "en_cours", "En cours de traitement"
    CLOTUREE = "cloturee", "Clôturée"


class VerdictIA(models.TextChoices):
    A_CONFIRMER = "a_confirmer", "À confirmer"
    CONFIRMEE = "confirmee", "Signal confirmé"
    FAUX_POSITIF = "faux_positif", "Faux positif"


class Alerte(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="alertes"
    )
    message = models.ForeignKey(
        Message, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="alertes_ia",
        help_text="Message source, réservé à l'apprentissage local et aux superviseurs.",
    )
    source = models.CharField(max_length=20, choices=SourceAlerte.choices)
    gravite = models.CharField(max_length=20, choices=GraviteAlerte.choices)
    description = models.TextField(
        help_text="Ce qui inquiète l'écoutant, ou le motif détecté par le module IA."
    )
    statut = models.CharField(
        max_length=20, choices=StatutAlerte.choices, default=StatutAlerte.EN_ATTENTE
    )
    verdict_ia = models.CharField(
        max_length=20, choices=VerdictIA.choices, default=VerdictIA.A_CONFIRMER,
        help_text="Validation humaine utilisée pour améliorer le classifieur local.",
    )
    superviseur_assigne = models.ForeignKey(
        Superviseur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="alertes_traitees"
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)
    justification_traitement = models.TextField(
        blank=True,
        help_text="Traçabilité : pourquoi cette décision a été prise (exigence du cahier des charges)."
    )

    class Meta:
        ordering = ["-gravite", "-date_creation"]
        indexes = [models.Index(fields=["statut", "gravite"])]

    def __str__(self):
        return f"Alerte {self.get_gravite_display()} — {self.get_source_display()}"


class OrientationPsychologue(models.Model):
    """Demande d'orientation décidée par un superviseur humain."""

    alerte = models.ForeignKey(Alerte, on_delete=models.CASCADE, related_name="orientations")
    psychologue = models.ForeignKey(
        PsychologuePartenaire, on_delete=models.PROTECT, related_name="orientations_recues"
    )
    superviseur = models.ForeignKey(
        Superviseur, on_delete=models.SET_NULL, null=True, related_name="orientations_creees"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["alerte", "psychologue"], name="orientation_unique_par_alerte"),
        ]
        ordering = ["-date_creation"]

    def __str__(self):
        return f"Orientation alerte #{self.alerte_id} vers {self.psychologue}"
