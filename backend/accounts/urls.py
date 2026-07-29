from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    UtilisateurViewSet, EcoutantViewSet,
    SuperviseurViewSet, PsychologuePartenaireViewSet,
)
from .auth import (
    inscription_ado, connexion_ado,
    connexion_ecoutant, connexion_superviseur,
    changer_mot_de_passe,
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
    path("auth/ado/changer-mot-de-passe/", changer_mot_de_passe, name="changer_mot_de_passe"),
] + router.urls
