"""
App: ressources
Annuaire des psychologues, ONG et centres d'écoute, gérable par l'admin.
"""
from django.db import models

class TypeRessource(models.TextChoices):
    PSYCHOLOGUE = "psychologue", "Psychologue"
    ONG = "ong", "ONG"
    CENTRE = "centre", "Centre d'écoute"


class Ressource(models.Model):
    nom = models.CharField(max_length=150)
    type_ressource = models.CharField(max_length=20, choices=TypeRessource.choices)
    ville = models.CharField(max_length=80)
    contact = models.CharField(max_length=150, blank=True)
    partenaire_certifie = models.BooleanField(default=False)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ville", "nom"]

    def __str__(self):
        return f"{self.nom} ({self.ville})"


