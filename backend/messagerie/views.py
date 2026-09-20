from django.db.models import Q, Max, OuterRef, Subquery
from rest_framework import viewsets, permissions, status
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.decorators import api_view, permission_classes as perm_decorator
from rest_framework.response import Response
from .models import (
    Conversation, Message, CercleEcoute, MembreCercle, MessageCercle,
    StatutConversation, ConversationAdoAdo, MessageAdoAdo,
)
from .serializers import (
    ConversationSerializer, MessageSerializer,
    CercleEcouteSerializer, MessageCercleSerializer,
    MembreCercleSerializer, ConversationAdoAdoSerializer, MessageAdoAdoSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "utilisateur_profile"):
            return Conversation.objects.filter(utilisateur=user.utilisateur_profile)
        if hasattr(user, "ecoutant_profile"):
            return Conversation.objects.filter(
                Q(ecoutant=user.ecoutant_profile) | Q(statut=StatutConversation.EN_ATTENTE)
            )
        if hasattr(user, "superviseur_profile") or user.is_staff:
            return Conversation.objects.all()
        return Conversation.objects.none()

    def create(self, request, *args, **kwargs):
        """Si une conversation existante, la retourner directement (WhatsApp-like)."""
        user = request.user
        if hasattr(user, "utilisateur_profile"):
            ecoutant_id = request.data.get("ecoutant")
            if ecoutant_id:
                existing = Conversation.objects.filter(
                    utilisateur=user.utilisateur_profile,
                    ecoutant_id=ecoutant_id,
                ).exclude(statut=StatutConversation.CLOTUREE).first()
                if existing:
                    return Response(ConversationSerializer(existing).data)
            else:
                existing = Conversation.objects.filter(
                    utilisateur=user.utilisateur_profile,
                    ecoutant__isnull=True,
                    statut=StatutConversation.EN_ATTENTE,
                ).first()
                if existing:
                    return Response(ConversationSerializer(existing).data)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, "utilisateur_profile"):
            serializer.save(utilisateur=user.utilisateur_profile)
        else:
            serializer.save()

    def partial_update(self, request, *args, **kwargs):
        """Permet a un ecoutant de s'assigner a une conversation en_attente.
        Le statut reste en_attente jusqu'a ce qu'un message soit envoye."""
        user = request.user
        conversation = self.get_object()
        if hasattr(user, "ecoutant_profile"):
            if conversation.ecoutant is None and conversation.statut == StatutConversation.EN_ATTENTE:
                conversation.ecoutant = user.ecoutant_profile
                conversation.save(update_fields=["ecoutant"])
                return Response(ConversationSerializer(conversation).data)
            return Response(
                {"detail": "Cette conversation est deja assignee."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        conversation = serializer.validated_data["conversation"]
        auteur = serializer.validated_data["auteur"]
        user = self.request.user
        if hasattr(user, "superviseur_profile"):
            if conversation.superviseur != user.superviseur_profile or auteur != "superviseur":
                raise PermissionDenied("Cette discussion est réservée au superviseur qui l'a ouverte.")
        elif hasattr(user, "utilisateur_profile"):
            if conversation.utilisateur != user.utilisateur_profile or auteur != "utilisateur":
                raise PermissionDenied("Vous ne pouvez écrire que dans vos propres discussions.")
        elif hasattr(user, "ecoutant_profile"):
            if conversation.ecoutant != user.ecoutant_profile or auteur != "ecoutant":
                raise PermissionDenied("Cette discussion n'est pas assignée à cet écoutant.")
        else:
            raise PermissionDenied("Profil non autorisé à envoyer un message.")
        message = serializer.save()
        # L'analyse asynchrone s'applique aussi aux messages envoyés par l'API.
        from alertes.supervision import planifier_analyse_message
        planifier_analyse_message(message.id)
        # Si c'est un ecoutant qui repond a une conversation en_attente, passer en cours
        if message.auteur == 'ecoutant' and message.conversation.statut == StatutConversation.EN_ATTENTE:
            message.conversation.statut = StatutConversation.EN_COURS
            message.conversation.save(update_fields=["statut"])

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "utilisateur_profile"):
            qs = Message.objects.filter(conversation__utilisateur=user.utilisateur_profile)
        elif hasattr(user, "ecoutant_profile"):
            # L'ecoutant voit les messages de SES conversations + les conversations en_attente
            qs = Message.objects.filter(
                Q(conversation__ecoutant=user.ecoutant_profile)
                | Q(conversation__statut=StatutConversation.EN_ATTENTE)
            )
        elif hasattr(user, "superviseur_profile") or user.is_staff:
            qs = Message.objects.all()
        else:
            qs = Message.objects.none()
        conversation_id = self.request.query_params.get("conversation")
        if conversation_id:
            qs = qs.filter(conversation_id=conversation_id)
        return qs


class CercleEcouteViewSet(viewsets.ModelViewSet):
    serializer_class = CercleEcouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "ecoutant_profile"):
            return CercleEcoute.objects.filter(ecoutant_animateur=user.ecoutant_profile, actif=True)
        if hasattr(user, "psychologue_profile"):
            return CercleEcoute.objects.filter(actif=True)
        if hasattr(user, "utilisateur_profile"):
            return CercleEcoute.objects.filter(actif=True)
        if hasattr(user, "superviseur_profile") or user.is_staff:
            return CercleEcoute.objects.all()
        return CercleEcoute.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, "ecoutant_profile"):
            serializer.save(ecoutant_animateur=user.ecoutant_profile)
        else:
            serializer.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        cercle = self.get_object()
        if hasattr(user, "ecoutant_profile"):
            if cercle.ecoutant_animateur != user.ecoutant_profile:
                return Response(
                    {"detail": "Vous ne pouvez modifier que vos propres cercles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        cercle = self.get_object()
        if hasattr(user, "ecoutant_profile"):
            if cercle.ecoutant_animateur != user.ecoutant_profile:
                return Response(
                    {"detail": "Vous ne pouvez supprimer que vos propres cercles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().destroy(request, *args, **kwargs)


class MessageCercleViewSet(viewsets.ModelViewSet):
    serializer_class = MessageCercleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        cercle_id = self.request.query_params.get("cercle")

        if hasattr(user, "superviseur_profile") or user.is_staff:
            qs = MessageCercle.objects.all()
        elif hasattr(user, "ecoutant_profile"):
            qs = MessageCercle.objects.filter(
                cercle__ecoutant_animateur=user.ecoutant_profile
            )
        elif hasattr(user, "utilisateur_profile"):
            membre_cercle_ids = MembreCercle.objects.filter(
                utilisateur=user.utilisateur_profile
            ).values_list("cercle_id", flat=True)
            qs = MessageCercle.objects.filter(cercle_id__in=membre_cercle_ids)
        else:
            qs = MessageCercle.objects.none()

        if cercle_id:
            qs = qs.filter(cercle_id=cercle_id)
        return qs


class MembreCercleViewSet(viewsets.ModelViewSet):
    serializer_class = MembreCercleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        cercle_id = self.request.query_params.get("cercle")

        # Pour l'action create (POST rejoindre un cercle), autoriser tous les cercles actifs
        if self.action == "create" and hasattr(user, "utilisateur_profile"):
            qs = MembreCercle.objects.all()
        elif hasattr(user, "superviseur_profile") or user.is_staff:
            qs = MembreCercle.objects.all()
        elif hasattr(user, "ecoutant_profile"):
            qs = MembreCercle.objects.filter(
                cercle__ecoutant_animateur=user.ecoutant_profile
            )
        elif hasattr(user, "utilisateur_profile"):
            membre_cercle_ids = MembreCercle.objects.filter(
                utilisateur=user.utilisateur_profile
            ).values_list("cercle_id", flat=True)
            qs = MembreCercle.objects.filter(cercle_id__in=membre_cercle_ids)
        else:
            qs = MembreCercle.objects.none()

        if cercle_id:
            qs = qs.filter(cercle_id=cercle_id)
        return qs
        
    def perform_create(self, serializer):
        user = self.request.user
        try:
            if hasattr(user, "utilisateur_profile"):
                serializer.save(utilisateur=user.utilisateur_profile)
            else:
                serializer.save()
        except IntegrityError:
            raise ValidationError({"detail": "Vous êtes déjà membre de ce cercle."})

    def destroy(self, request, *args, **kwargs):
        user = request.user
        membre = self.get_object()
        cercle = membre.cercle

        if hasattr(user, "utilisateur_profile"):
            if membre.utilisateur != user.utilisateur_profile:
                return Response(
                    {"detail": "Vous ne pouvez retirer que votre propre adhesion."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif hasattr(user, "ecoutant_profile"):
            if cercle.ecoutant_animateur != user.ecoutant_profile:
                return Response(
                    {"detail": "Vous ne pouvez gerer que les membres de vos propres cercles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif not (hasattr(user, "superviseur_profile") or user.is_staff):
            return Response(
                {"detail": "Permission refusee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)


@api_view(["GET"])
@perm_decorator([permissions.IsAuthenticated])
def lister_ecoutants(request):
    """Liste tous les ecoutants valides pour les ados."""
    from accounts.models import Ecoutant
    ecoutants = Ecoutant.objects.filter(statut="valide").values(
        "id", "nom_complet", "disponible", "formation_validee"
    )
    return Response(list(ecoutants))


@api_view(["GET"])
@perm_decorator([permissions.IsAuthenticated])
def lister_ados(request):
    """Liste tous les ados pour pouvoir les ajouter à un cercle."""
    from accounts.models import Utilisateur
    ados = Utilisateur.objects.all().values("id", "pseudo")
    return Response(list(ados))


@api_view(["POST"])
@perm_decorator([permissions.IsAuthenticated])
def marquer_messages_lus(request):
    """Marque tous les messages d'une conversation comme lus pour l'utilisateur courant."""
    conversation_id = request.data.get("conversation_id")
    if not conversation_id:
        return Response({"detail": "conversation_id requis."}, status=400)

    user = request.user
    if hasattr(user, "ecoutant_profile"):
        Message.objects.filter(
            conversation_id=conversation_id,
            auteur="utilisateur",
            lu=False,
        ).update(lu=True)
    elif hasattr(user, "utilisateur_profile"):
        Message.objects.filter(
            conversation_id=conversation_id,
            auteur__in=["ecoutant", "superviseur"],
            lu=False,
        ).update(lu=True)

    return Response({"detail": "Messages marques comme lus."})


@api_view(["GET"])
@perm_decorator([permissions.IsAuthenticated])
def conversation_stats(request):
    """Retourne les conversations pour l'utilisateur courant.
    L'écoutant voit ses conversations ET les conversations en attente sans écoutant."""
    user = request.user
    filtre = request.query_params.get("filter")

    if hasattr(user, "utilisateur_profile"):
        # L'ado voit toutes ses conversations
        conversations = Conversation.objects.filter(utilisateur=user.utilisateur_profile)
    elif hasattr(user, "ecoutant_profile"):
        # L'écoutant voit ses conversations assignées + les conversations en attente sans écoutant
        conversations = Conversation.objects.filter(
            Q(ecoutant=user.ecoutant_profile) |
            Q(ecoutant__isnull=True, statut=StatutConversation.EN_ATTENTE)
        )
    else:
        return Response([])

    result = []
    for conv in conversations:
        last_msg = conv.messages.order_by("-date_envoi").first()
        non_lus = conv.messages.filter(lu=False).exclude(
            auteur="ecoutant" if hasattr(user, "ecoutant_profile") else "utilisateur"
        ).count()

        ecoutant_nom = None
        if conv.ecoutant:
            ecoutant_nom = conv.ecoutant.nom_complet
        superviseur_nom = None
        if conv.superviseur:
            superviseur_nom = conv.superviseur.nom_complet

        result.append({
            "id": conv.id,
            "statut": conv.statut,
            "ecoutant": conv.ecoutant_id,
            "ecoutant_nom": ecoutant_nom,
            "superviseur": conv.superviseur_id,
            "superviseur_nom": superviseur_nom,
            "utilisateur_pseudo": conv.utilisateur.pseudo,
            "date_derniere_activite": conv.date_derniere_activite.isoformat() if conv.date_derniere_activite else None,
            "dernier_message": {
                "contenu": last_msg.contenu if last_msg else None,
                "auteur": last_msg.auteur if last_msg else None,
                "date_envoi": last_msg.date_envoi.isoformat() if last_msg else None,
            } if last_msg else None,
            "messages_non_lus": non_lus,
        })

    if filtre == "non_lus":
        result = [r for r in result if r["messages_non_lus"] > 0]

    result.sort(key=lambda x: x["date_derniere_activite"] or "", reverse=True)
    return Response(result)


# --- Conversations Ado-Ado ---

@api_view(["GET", "POST"])
@perm_decorator([permissions.IsAuthenticated])
def conversations_ado(request):
    """Liste ou crée des conversations entre ados dans un même cercle."""
    user = request.user
    if not hasattr(user, "utilisateur_profile"):
        return Response({"detail": "Réservé aux ados."}, status=403)

    if request.method == "GET":
        cercle_id = request.query_params.get("cercle")
        convs = ConversationAdoAdo.objects.filter(
            Q(expediteur=user.utilisateur_profile) | Q(destinataire=user.utilisateur_profile)
        )
        if cercle_id:
            convs = convs.filter(cercle_id=cercle_id)
        serializer = ConversationAdoAdoSerializer(convs, many=True, context={"request": request})
        return Response(serializer.data)

    # POST : créer ou récupérer une conversation existante
    destinataire_id = request.data.get("destinataire")
    cercle_id = request.data.get("cercle")
    if not destinataire_id or not cercle_id:
        return Response({"detail": "destinataire et cercle requis."}, status=400)

    from accounts.models import Utilisateur
    try:
        destinataire = Utilisateur.objects.get(id=destinataire_id)
    except Utilisateur.DoesNotExist:
        return Response({"detail": "Destinataire introuvable."}, status=404)

    # Vérifier que les deux sont membres du cercle
    if not MembreCercle.objects.filter(cercle_id=cercle_id, utilisateur=user.utilisateur_profile).exists():
        return Response({"detail": "Vous n'êtes pas membre de ce cercle."}, status=403)
    if not MembreCercle.objects.filter(cercle_id=cercle_id, utilisateur=destinataire).exists():
        return Response({"detail": "Ce membre n'est pas dans ce cercle."}, status=403)

    # Vérifier si une conversation existe déjà
    existing = ConversationAdoAdo.objects.filter(
        cercle_id=cercle_id
    ).filter(
        Q(expediteur=user.utilisateur_profile, destinataire=destinataire) |
        Q(expediteur=destinataire, destinataire=user.utilisateur_profile)
    ).first()

    if existing:
        return Response(ConversationAdoAdoSerializer(existing, context={"request": request}).data)

    conv = ConversationAdoAdo.objects.create(
        expediteur=user.utilisateur_profile,
        destinataire=destinataire,
        cercle_id=cercle_id,
    )
    return Response(ConversationAdoAdoSerializer(conv, context={"request": request}).data, status=201)


@api_view(["GET", "POST"])
@perm_decorator([permissions.IsAuthenticated])
def messages_ado(request):
    """Liste ou envoie des messages dans une conversation ado-ado."""
    user = request.user
    if not hasattr(user, "utilisateur_profile"):
        return Response({"detail": "Réservé aux ados."}, status=403)

    if request.method == "GET":
        conv_id = request.query_params.get("conversation")
        if not conv_id:
            return Response({"detail": "conversation requis."}, status=400)
        msgs = MessageAdoAdo.objects.filter(conversation_id=conv_id)
        serializer = MessageAdoAdoSerializer(msgs, many=True)
        return Response(serializer.data)

    # POST : envoyer un message
    conv_id = request.data.get("conversation")
    contenu = request.data.get("contenu")
    if not conv_id or not contenu:
        return Response({"detail": "conversation et contenu requis."}, status=400)

    try:
        conv = ConversationAdoAdo.objects.get(id=conv_id)
    except ConversationAdoAdo.DoesNotExist:
        return Response({"detail": "Conversation introuvable."}, status=404)

    # Vérifier que l'utilisateur est impliqué
    if user.utilisateur_profile not in (conv.expediteur, conv.destinataire):
        return Response({"detail": "Accès refusé."}, status=403)

    msg = MessageAdoAdo.objects.create(
        conversation=conv,
        auteur=user.utilisateur_profile,
        contenu=contenu,
    )
    conv.save()  # Met à jour date_derniere_activite
    return Response(MessageAdoAdoSerializer(msg).data, status=201)


@api_view(["POST"])
@perm_decorator([permissions.IsAuthenticated])
def marquer_messages_ado_lus(request):
    """Marque les messages ado-ado comme lus pour l'utilisateur courant."""
    conv_id = request.data.get("conversation_id")
    if not conv_id:
        return Response({"detail": "conversation_id requis."}, status=400)

    user = request.user
    if hasattr(user, "utilisateur_profile"):
        # Marquer comme lus les messages envoyés PAR LES AUTRES (pas les siens)
        MessageAdoAdo.objects.filter(
            conversation_id=conv_id,
            lu=False,
        ).exclude(auteur=user.utilisateur_profile).update(lu=True)

    return Response({"detail": "Messages marqués comme lus."})
