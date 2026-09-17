from rest_framework import serializers
from .models import Alerte


class AlerteSerializer(serializers.ModelSerializer):
    gravite_display = serializers.SerializerMethodField()
    source_display = serializers.SerializerMethodField()
    pseudo_ado = serializers.SerializerMethodField()

    class Meta:
        model = Alerte
        fields = [
            "id", "conversation", "source", "gravite",
            "gravite_display", "source_display", "pseudo_ado",
            "description", "statut", "superviseur_assigne",
            "date_creation", "date_traitement", "justification_traitement",
        ]
        read_only_fields = ["id", "date_creation"]

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
