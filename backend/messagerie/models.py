"""
App: messagerie
Tchat 1-to-1 avec un écoutant, et cercles d'écoute en petit groupe.
Aucun message n'est jamais généré automatiquement — chaque ligne vient
d'un humain (ado, écoutant, ou membre d'un cercle).
"""
from django.db import models
from accounts.models import Utilisateur, Ecoutant


class StatutConversation(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente d'un écoutant"
    EN_COURS = "en_cours", "En cours"
    CLOTUREE = "cloturee", "Clôturée"


class Conversation(models.Model):
    utilisateur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="conversations"
    )
    ecoutant = models.ForeignKey(
        Ecoutant, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="conversations"
    )
    statut = models.CharField(
        max_length=20, choices=StatutConversation.choices,
        default=StatutConversation.EN_ATTENTE
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_derniere_activite = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_derniere_activite"]


class AuteurMessage(models.TextChoices):
    UTILISATEUR = "utilisateur", "Ado"
    ECOUTANT = "ecoutant", "Écoutant"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    auteur = models.CharField(max_length=20, choices=AuteurMessage.choices)
    contenu = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)

    # Rempli par le module de supervision IA (cf. app alertes) — jamais visible
    # par l'ado ou l'écoutant, uniquement par un superviseur en cas d'alerte.
    signale_par_module_ia = models.BooleanField(default=False)

    lu = models.BooleanField(default=False)

    class Meta:
        ordering = ["date_envoi"]
        indexes = [models.Index(fields=["conversation", "date_envoi"])]


class CercleEcoute(models.Model):
    theme = models.CharField(
        max_length=100,
        help_text='Ex : "Pression scolaire", "Solitude", "Violences à la maison"'
    )
    ecoutant_animateur = models.ForeignKey(
        Ecoutant, on_delete=models.SET_NULL, null=True, related_name="cercles_animes"
    )
    actif = models.BooleanField(default=True)
    restreint = models.BooleanField(default=False, help_text="Si vrai, seuls les écoutants peuvent parler")
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.theme


class MembreCercle(models.Model):
    cercle = models.ForeignKey(CercleEcoute, on_delete=models.CASCADE, related_name="membres")
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    date_adhesion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cercle", "utilisateur")


class MessageCercle(models.Model):
    cercle = models.ForeignKey(CercleEcoute, on_delete=models.CASCADE, related_name="messages")
    # L'auteur est soit un membre (ado, via son pseudo), soit l'écoutant animateur
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)
    ecoutant = models.ForeignKey(Ecoutant, on_delete=models.SET_NULL, null=True, blank=True)
    contenu = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date_envoi"]


class ConversationAdoAdo(models.Model):
    """Conversation privée entre deux ados qui sont dans le même cercle."""
    expediteur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="conversations_ado_envoyees"
    )
    destinataire = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="conversations_ado_recues"
    )
    cercle = models.ForeignKey(
        CercleEcoute, on_delete=models.CASCADE, related_name="conversations_ado"
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_derniere_activite = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("expediteur", "destinataire", "cercle")
        ordering = ["-date_derniere_activite"]


class MessageAdoAdo(models.Model):
    """Message dans une conversation privée ado-ado."""
    conversation = models.ForeignKey(
        ConversationAdoAdo, on_delete=models.CASCADE, related_name="messages"
    )
    auteur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    contenu = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)

    class Meta:
        ordering = ["date_envoi"]


class EvaluationConversation(models.Model):
    """Note laissée par l'ado à la clôture d'une conversation avec un écoutant."""
    conversation = models.OneToOneField(
        Conversation, on_delete=models.CASCADE, related_name="evaluation"
    )
    note = models.PositiveSmallIntegerField(help_text="Note de 1 à 5")
    commentaire = models.TextField(blank=True)
    date_evaluation = models.DateTimeField(auto_now_add=True)