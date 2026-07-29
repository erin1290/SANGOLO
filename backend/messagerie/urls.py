from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    ConversationViewSet, MessageViewSet,
    CercleEcouteViewSet, MessageCercleViewSet,
    MembreCercleViewSet,
    lister_ecoutants,
    lister_ados,
    marquer_messages_lus,
    conversation_stats,
    conversations_ado,
    messages_ado,
    marquer_messages_ado_lus,
)

router = DefaultRouter()
router.register("conversations", ConversationViewSet, basename="conversation")
router.register("messages", MessageViewSet, basename="message")
router.register("cercles", CercleEcouteViewSet, basename="cercle")
router.register("messages-cercle", MessageCercleViewSet, basename="messagecercle")
router.register("membres-cercle", MembreCercleViewSet, basename="membrecercle")

urlpatterns = [
    path("ecoutants/", lister_ecoutants, name="lister_ecoutants"),
    path("ados/", lister_ados, name="lister_ados"),
    path("messages/marquer-lus/", marquer_messages_lus, name="marquer_messages_lus"),
    path("conversation-stats/", conversation_stats, name="conversation_stats"),
    path("conversations-ado/", conversations_ado, name="conversations_ado"),
    path("messages-ado/", messages_ado, name="messages_ado"),
    path("messages-ado/marquer-lus/", marquer_messages_ado_lus, name="marquer_messages_ado_lus"),
] + router.urls
