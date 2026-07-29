"""accounts/serializers.py"""
from rest_framework import serializers
from .models import Utilisateur, Ecoutant, Superviseur, PsychologuePartenaire


class UtilisateurSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(write_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id", "pseudo", "age", "mot_de_passe",
            "securite_biometrique_active", "consentement_analyse_ia",
            "date_creation",
        ]
        read_only_fields = ["id", "date_creation"]

    def create(self, validated_data):
        mot_de_passe = validated_data.pop("mot_de_passe")
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_mot_de_passe(mot_de_passe)
        utilisateur.save()
        return utilisateur


class EcoutantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ecoutant
        fields = [
            "id", "nom_complet", "email", "statut",
            "institution_partenaire", "formation_validee", "entretien_effectue",
            "disponible", "langue_preferee", "date_creation",
        ]
        read_only_fields = ["id", "statut", "date_creation"]


class SuperviseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Superviseur
        fields = ["id", "nom_complet", "email", "est_psychologue"]


class PsychologuePartenaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = PsychologuePartenaire
        fields = ["id", "nom_complet", "structure", "ville", "certifie"]
