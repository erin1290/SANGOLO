"""
App: journal
Le journal émotionnel de l'ado — texte, audio ou photo, historique privé.
"""
from django.db import models
from accounts.models import Utilisateur


class Humeur(models.TextChoices):
    CONTENT = "content", "Content"
    NEUTRE = "neutre", "Neutre"
    TRISTE = "triste", "Triste"
    EN_COLERE = "colere", "En colère"
    FATIGUE = "fatigue", "Fatigué"


class EntreeJournal(models.Model):
    utilisateur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="entrees_journal"
    )
    humeur = models.CharField(max_length=20, choices=Humeur.choices)

    texte = models.TextField(blank=True)
    fichier_audio = models.FileField(upload_to="journal/audio/%Y/%m/", null=True, blank=True)
    fichier_photo = models.ImageField(upload_to="journal/photos/%Y/%m/", null=True, blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]
        indexes = [models.Index(fields=["utilisateur", "-date_creation"])]

    def type_contenu(self):
        if self.fichier_audio:
            return "audio"
        if self.fichier_photo:
            return "photo"
        return "texte"

    def __str__(self):
        return f"{self.utilisateur.pseudo} — {self.get_humeur_display()} — {self.date_creation:%d/%m %H:%M}"
