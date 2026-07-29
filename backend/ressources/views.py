from rest_framework import viewsets, permissions
from .models import Ressource
from .serializers import RessourceSerializer


class RessourceViewSet(viewsets.ModelViewSet):
    """Annuaire filtrable par ville — lecture ouverte à tout utilisateur connecté,
    écriture réservée à l'admin (cf. permissions par action)."""
    serializer_class = RessourceSerializer
    queryset = Ressource.objects.all()
    filterset_fields = ["ville", "type_ressource"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
