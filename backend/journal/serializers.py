from rest_framework import serializers
from .models import EntreeJournal


class EntreeJournalSerializer(serializers.ModelSerializer):
    type_contenu = serializers.CharField(read_only=True)

    class Meta:
        model = EntreeJournal
        fields = [
            "id", "humeur", "texte", "fichier_audio", "fichier_photo",
            "type_contenu", "date_creation",
        ]
        read_only_fields = ["id", "date_creation"]
