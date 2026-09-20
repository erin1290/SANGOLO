from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    UtilisateurViewSet, EcoutantViewSet,
    SuperviseurViewSet, PsychologuePartenaireViewSet,
)
from .auth import (
    inscription_ado, connexion_ado,
    connexion_ecoutant, connexion_superviseur, connexion_psychologue,
    changer_mot_de_passe,
    stats_superviseur, lister_ecoutants_en_attente, lister_ados_supervision,
    valider_ecoutant, refuser_ecoutant,
)

router = DefaultRouter()
router.register("utilisateurs", UtilisateurViewSet)
router.register("ecoutants", EcoutantViewSet)
router.register("superviseurs", SuperviseurViewSet)
router.register("psychologues", PsychologuePartenaireViewSet)

urlpatterns = [
    path("auth/ado/inscription/", inscription_ado, name="inscription_ado"),
    path("auth/ado/connexion/", connexion_ado, name="connexion_ado"),
    path("auth/ecoutant/connexion/", connexion_ecoutant, name="connexion_ecoutant"),
    path("auth/superviseur/connexion/", connexion_superviseur, name="connexion_superviseur"),
    path("auth/psychologue/connexion/", connexion_psychologue, name="connexion_psychologue"),
    path("auth/ado/changer-mot-de-passe/", changer_mot_de_passe, name="changer_mot_de_passe"),
    path("superviseur/stats/", stats_superviseur, name="stats_superviseur"),
    path("superviseur/ecoutants-en-attente/", lister_ecoutants_en_attente, name="lister_ecoutants_en_attente"),
    path("superviseur/ados/", lister_ados_supervision, name="lister_ados_supervision"),
    path("superviseur/ecoutants/<int:ecoutant_id>/valider/", valider_ecoutant, name="valider_ecoutant"),
    path("superviseur/ecoutants/<int:ecoutant_id>/refuser/", refuser_ecoutant, name="refuser_ecoutant"),
] + router.urls
