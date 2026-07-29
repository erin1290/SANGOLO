from rest_framework import viewsets, permissions
from .models import Alerte
from .serializers import AlerteSerializer


class AlerteViewSet(viewsets.ModelViewSet):
    """
    Point d'entrée unique pour toute alerte — qu'elle vienne d'un écoutant
    (bouton Signaler côté chat) ou du module de supervision IA en tâche de fond.
    Seuls les superviseurs traitent les alertes.
    """
    serializer_class = AlerteSerializer
    queryset = Alerte.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, "superviseur_profile") or user.is_staff:
            return qs
        if hasattr(user, "ecoutant_profile"):
            # Un écoutant ne voit que les alertes issues de ses propres conversations.
            return qs.filter(conversation__ecoutant=user.ecoutant_profile)
        return qs.none()
