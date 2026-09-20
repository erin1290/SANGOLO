from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.models import PsychologuePartenaire, StatutPsychologue
from messagerie.models import Conversation, StatutConversation
from messagerie.serializers import ConversationSerializer
from .models import Alerte, OrientationPsychologue, StatutAlerte
from .serializers import AlerteSerializer, OrientationPsychologueSerializer


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

    def update(self, request, *args, **kwargs):
        user = request.user
        if not (hasattr(user, "superviseur_profile") or user.is_staff):
            return Response({"detail": "Seul un superviseur peut qualifier une alerte."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def _superviseur(self, request):
        if not hasattr(request.user, "superviseur_profile"):
            return None
        return request.user.superviseur_profile

    @action(detail=True, methods=["post"], url_path="contacter-ado")
    def contacter_ado(self, request, pk=None):
        """Ouvre une discussion séparée de la conversation qui a déclenché l'alerte."""
        superviseur = self._superviseur(request)
        if not superviseur:
            return Response({"detail": "Seul un superviseur peut contacter l'ado."}, status=status.HTTP_403_FORBIDDEN)

        alerte = self.get_object()
        conversation, creee = Conversation.objects.get_or_create(
            utilisateur=alerte.conversation.utilisateur,
            superviseur=superviseur,
            defaults={"statut": StatutConversation.EN_COURS},
        )
        if alerte.statut == StatutAlerte.EN_ATTENTE:
            alerte.statut = StatutAlerte.EN_COURS
            alerte.superviseur_assigne = superviseur
            alerte.save(update_fields=["statut", "superviseur_assigne"])
        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED if creee else status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="psychologues-disponibles")
    def psychologues_disponibles(self, request):
        if not self._superviseur(request):
            return Response({"detail": "Seul un superviseur peut consulter cette liste."}, status=status.HTTP_403_FORBIDDEN)
        psychologues = PsychologuePartenaire.objects.filter(
            statut=StatutPsychologue.VALIDE, certifie=True, disponible=True
        ).order_by("nom_complet")
        return Response([
            {
                "id": p.id, "nom_complet": p.nom_complet, "structure": p.structure,
                "ville": p.ville, "telephone": p.telephone,
            }
            for p in psychologues
        ])

    @action(detail=True, methods=["post"], url_path="orienter-vers-psychologue")
    def orienter_vers_psychologue(self, request, pk=None):
        superviseur = self._superviseur(request)
        if not superviseur:
            return Response({"detail": "Seul un superviseur peut orienter un ado."}, status=status.HTTP_403_FORBIDDEN)
        psychologue_id = request.data.get("psychologue_id")
        try:
            psychologue = PsychologuePartenaire.objects.get(
                pk=psychologue_id, statut=StatutPsychologue.VALIDE,
                certifie=True, disponible=True,
            )
        except (PsychologuePartenaire.DoesNotExist, TypeError, ValueError):
            return Response({"detail": "Ce psychologue n'est pas disponible pour une orientation."}, status=status.HTTP_400_BAD_REQUEST)

        alerte = self.get_object()
        orientation, creee = OrientationPsychologue.objects.get_or_create(
            alerte=alerte, psychologue=psychologue, defaults={"superviseur": superviseur}
        )
        if alerte.statut == StatutAlerte.EN_ATTENTE:
            alerte.statut = StatutAlerte.EN_COURS
            alerte.superviseur_assigne = superviseur
            alerte.save(update_fields=["statut", "superviseur_assigne"])
        return Response(
            OrientationPsychologueSerializer(orientation).data,
            status=status.HTTP_201_CREATED if creee else status.HTTP_200_OK,
        )
