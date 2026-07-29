from rest_framework import serializers
from .models import Ressource


class RessourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ressource
        fields = [
            "id", "nom", "type_ressource", "ville",
            "contact", "partenaire_certifie", "date_ajout",
        ]
        read_only_fields = ["id", "date_ajout"]
