from rest_framework import serializers
from .models import (
    Conversation, Message, CercleEcoute, MembreCercle, MessageCercle,
    ConversationAdoAdo, MessageAdoAdo,
)


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "conversation", "auteur", "contenu", "date_envoi", "lu"]
        read_only_fields = ["id", "date_envoi"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    utilisateur_pseudo = serializers.CharField(source='utilisateur.pseudo', read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id", "utilisateur", "utilisateur_pseudo", "ecoutant", "statut",
            "date_creation", "date_derniere_activite", "messages",
        ]
        read_only_fields = ["id", "utilisateur", "date_creation", "date_derniere_activite"]


class MessageCercleSerializer(serializers.ModelSerializer):
    pseudo_auteur = serializers.SerializerMethodField()

    class Meta:
        model = MessageCercle
        fields = ["id", "cercle", "utilisateur", "ecoutant", "contenu", "date_envoi", "pseudo_auteur"]
        read_only_fields = ["id", "date_envoi"]

    def get_pseudo_auteur(self, obj):
        if obj.utilisateur:
            return obj.utilisateur.pseudo
        if obj.ecoutant:
            return obj.ecoutant.nom_complet
        return "Inconnu"


class MembreCercleSerializer(serializers.ModelSerializer):
    pseudo = serializers.CharField(source='utilisateur.pseudo', read_only=True)

    class Meta:
        model = MembreCercle
        fields = ["id", "cercle", "utilisateur", "pseudo", "date_adhesion"]
        read_only_fields = ["id", "utilisateur", "date_adhesion"]


class CercleEcouteSerializer(serializers.ModelSerializer):
    messages = MessageCercleSerializer(many=True, read_only=True)
    nombre_membres = serializers.SerializerMethodField()
    ecoutant_nom = serializers.CharField(source='ecoutant_animateur.nom_complet', read_only=True, default=None)
    creneaux = serializers.SerializerMethodField()

    class Meta:
        model = CercleEcoute
        fields = [
            "id", "theme", "ecoutant_animateur", "ecoutant_nom", "actif",
            "nombre_membres", "date_creation", "messages", "creneaux",
        ]
        read_only_fields = ["id", "date_creation", "ecoutant_animateur"]

    def get_nombre_membres(self, obj):
        return obj.membres.count()

    def get_creneaux(self, obj):
        from planning.models import CreneauPlanning
        from planning.serializers import CreneauPlanningSerializer
        creneaux = CreneauPlanning.objects.filter(cercle=obj)
        return CreneauPlanningSerializer(creneaux, many=True).data


class MessageAdoAdoSerializer(serializers.ModelSerializer):
    pseudo_auteur = serializers.CharField(source='auteur.pseudo', read_only=True)

    class Meta:
        model = MessageAdoAdo
        fields = ["id", "conversation", "auteur", "pseudo_auteur", "contenu", "date_envoi", "lu"]
        read_only_fields = ["id", "date_envoi"]


class ConversationAdoAdoSerializer(serializers.ModelSerializer):
    pseudo_expediteur = serializers.CharField(source='expediteur.pseudo', read_only=True)
    pseudo_destinataire = serializers.CharField(source='destinataire.pseudo', read_only=True)
    dernier_message = serializers.SerializerMethodField()
    messages_non_lus = serializers.SerializerMethodField()

    class Meta:
        model = ConversationAdoAdo
        fields = [
            "id", "expediteur", "pseudo_expediteur", "destinataire", "pseudo_destinataire",
            "cercle", "date_creation", "date_derniere_activite", "dernier_message", "messages_non_lus",
        ]
        read_only_fields = ["id", "date_creation", "date_derniere_activite"]

    def get_dernier_message(self, obj):
        msg = obj.messages.order_by("-date_envoi").first()
        if msg:
            return {"contenu": msg.contenu, "auteur": msg.auteur_id, "date_envoi": msg.date_envoi.isoformat()}
        return None

    def get_messages_non_lus(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(lu=False).exclude(auteur=request.user.utilisateur_profile).count()