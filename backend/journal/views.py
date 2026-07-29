from rest_framework import viewsets, permissions
from .models import EntreeJournal
from .serializers import EntreeJournalSerializer


class EntreeJournalViewSet(viewsets.ModelViewSet):
    serializer_class = EntreeJournalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "utilisateur_profile"):
            return EntreeJournal.objects.filter(utilisateur=user.utilisateur_profile)
        return EntreeJournal.objects.none()

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user.utilisateur_profile)