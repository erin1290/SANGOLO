from rest_framework import serializers
from .models import Alerte, OrientationPsychologue


class AlerteSerializer(serializers.ModelSerializer):
    gravite_display = serializers.SerializerMethodField()
    source_display = serializers.SerializerMethodField()
    pseudo_ado = serializers.SerializerMethodField()

    class Meta:
        model = Alerte
        fields = [
            "id", "conversation", "source", "gravite",
            "gravite_display", "source_display", "pseudo_ado",
            "message", "description", "statut", "verdict_ia", "superviseur_assigne",
            "date_creation", "date_traitement", "justification_traitement",
        ]
        read_only_fields = ["id", "date_creation", "message"]

    def get_gravite_display(self, obj):
        return obj.get_gravite_display()

    def get_source_display(self, obj):
        return obj.get_source_display()

    def get_pseudo_ado(self, obj):
        if hasattr(obj.conversation, 'utilisateur'):
            return obj.conversation.utilisateur.pseudo
        if hasattr(obj.conversation, 'utilisateur_id'):
            try:
                from accounts.models import Utilisateur
                return Utilisateur.objects.get(id=obj.conversation.utilisateur_id).pseudo
            except Exception:
                return ''
        return ''


class OrientationPsychologueSerializer(serializers.ModelSerializer):
    psychologue_nom = serializers.CharField(source="psychologue.nom_complet", read_only=True)
    structure = serializers.CharField(source="psychologue.structure", read_only=True)

    class Meta:
        model = OrientationPsychologue
        fields = ["id", "alerte", "psychologue", "psychologue_nom", "structure", "date_creation"]
        read_only_fields = ["id", "alerte", "psychologue", "date_creation"]
