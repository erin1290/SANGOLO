from rest_framework import serializers
from .models import CreneauPlanning


class CreneauPlanningSerializer(serializers.ModelSerializer):
    cercle_theme = serializers.SerializerMethodField()

    class Meta:
        model = CreneauPlanning
        fields = [
            "id", "ecoutant", "psychologue", "type_creneau", "cercle",
            "cercle_theme", "jour_semaine", "heure", "lieu_institutionnel",
        ]
        read_only_fields = ["id"]

    def get_cercle_theme(self, obj):
        if obj.cercle:
            return obj.cercle.theme
        return None

    def validate(self, data):
        # Reproduit ici la regle du modele pour qu'elle soit verifiee
        # des l'API, avant meme d'atteindre la base de donnees.
        from .models import TypeCreneau
        if data.get("type_creneau") == TypeCreneau.SEANCE_PHYSIQUE:
            if data.get("ecoutant") is not None:
                raise serializers.ValidationError(
                    "Une seance physique ne peut etre tenue que par un "
                    "psychologue partenaire certifie, jamais un ecoutant."
                )
            if not data.get("lieu_institutionnel"):
                raise serializers.ValidationError(
                    "Une seance physique doit preciser un lieu institutionnel."
                )
        return data