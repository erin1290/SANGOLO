from rest_framework import serializers
from .models import Alerte


class AlerteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerte
        fields = [
            "id", "conversation", "source", "gravite", "description",
            "statut", "superviseur_assigne", "date_creation",
            "date_traitement", "justification_traitement",
        ]
        read_only_fields = ["id", "date_creation"]
