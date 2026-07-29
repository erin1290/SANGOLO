"""accounts/views.py"""
from rest_framework import viewsets, permissions
from .models import Utilisateur, Ecoutant, Superviseur, PsychologuePartenaire
from .serializers import (
    UtilisateurSerializer, EcoutantSerializer,
    SuperviseurSerializer, PsychologuePartenaireSerializer,
)


class UtilisateurViewSet(viewsets.ModelViewSet):
    """Inscription anonyme de l'ado — pas d'authentification requise à la création."""
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class EcoutantViewSet(viewsets.ModelViewSet):
    """Pas de création libre : les comptes écoutants sont créés côté admin
    après le processus de validation (cf. StatutEcoutant)."""
    queryset = Ecoutant.objects.all()
    serializer_class = EcoutantSerializer
    permission_classes = [permissions.IsAuthenticated]


class SuperviseurViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Superviseur.objects.all()
    serializer_class = SuperviseurSerializer
    permission_classes = [permissions.IsAdminUser]


class PsychologuePartenaireViewSet(viewsets.ModelViewSet):
    queryset = PsychologuePartenaire.objects.all()
    serializer_class = PsychologuePartenaireSerializer
    permission_classes = [permissions.IsAuthenticated]
