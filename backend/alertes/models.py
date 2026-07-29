"""
App: alertes
Le cœur du dispositif de sécurité : qu'une alerte vienne d'un écoutant
qui signale, ou du module de supervision IA qui détecte un signal,
elle arrive toujours au même endroit et c'est toujours un superviseur
humain qui décide de la suite.
"""
from django.db import models
from accounts.models import Superviseur
from messagerie.models import Conversation


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


class Alerte(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="alertes"
    )
    source = models.CharField(max_length=20, choices=SourceAlerte.choices)
    gravite = models.CharField(max_length=20, choices=GraviteAlerte.choices)
    description = models.TextField(
        help_text="Ce qui inquiète l'écoutant, ou le motif détecté par le module IA."
    )
    statut = models.CharField(
        max_length=20, choices=StatutAlerte.choices, default=StatutAlerte.EN_ATTENTE
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


