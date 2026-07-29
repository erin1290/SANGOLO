from rest_framework import viewsets, permissions
from .models import CreneauPlanning
from .serializers import CreneauPlanningSerializer


class CreneauPlanningViewSet(viewsets.ModelViewSet):
    serializer_class = CreneauPlanningSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        cercle_id = self.request.query_params.get("cercle")

        if hasattr(user, "ecoutant_profile"):
            qs = CreneauPlanning.objects.filter(ecoutant=user.ecoutant_profile)
        elif hasattr(user, "psychologue_profile"):
            qs = CreneauPlanning.objects.filter(psychologue=user.psychologue_profile)
        elif hasattr(user, "superviseur_profile") or user.is_staff:
            qs = CreneauPlanning.objects.all()
        elif hasattr(user, "utilisateur_profile"):
            # L'ado voit les creneaux des cercles dont il est membre
            from messagerie.models import MembreCercle
            cercle_ids = MembreCercle.objects.filter(
                utilisateur=user.utilisateur_profile
            ).values_list("cercle_id", flat=True)
            qs = CreneauPlanning.objects.filter(cercle_id__in=cercle_ids)
        else:
            qs = CreneauPlanning.objects.none()

        if cercle_id:
            qs = qs.filter(cercle_id=cercle_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, "ecoutant_profile"):
            serializer.save(ecoutant=user.ecoutant_profile)
        else:
            serializer.save()