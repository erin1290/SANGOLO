from django.contrib import admin
from .models import Utilisateur, Ecoutant, Superviseur, PsychologuePartenaire
@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ("pseudo", "age", "date_creation", "derniere_connexion")
    search_fields = ("pseudo",)
@admin.register(Ecoutant)
class EcoutantAdmin(admin.ModelAdmin):
    list_display = ("nom_complet", "email", "statut", "institution_partenaire", "disponible", "date_creation")
    list_filter = ("statut", "disponible", "formation_validee")
    search_fields = ("nom_complet", "email")
@admin.register(Superviseur)
class SuperviseurAdmin(admin.ModelAdmin):
    list_display = ("nom_complet", "email", "est_psychologue", "date_creation")
    search_fields = ("nom_complet", "email")
@admin.register(PsychologuePartenaire)
class PsychologuePartenaireAdmin(admin.ModelAdmin):
    list_display = ("nom_complet", "structure", "ville", "certifie")
    search_fields = ("nom_complet", "structure", "ville")