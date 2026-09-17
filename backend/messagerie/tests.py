"""
messagerie/tests.py — un utilisateur ne doit jamais voir les conversations
ou messages d'un autre.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Utilisateur, Ecoutant, StatutEcoutant
from .models import Conversation, Message, StatutConversation


class ConversationScopingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user_ado_a = User.objects.create_user(username="ado_a", password="motdepasse123")
        self.ado_a = Utilisateur.objects.create(
            user=self.user_ado_a, pseudo="ado_a", age=15, mot_de_passe_hash=self.user_ado_a.password,
        )
        self.user_ado_b = User.objects.create_user(username="ado_b", password="motdepasse123")
        self.ado_b = Utilisateur.objects.create(
            user=self.user_ado_b, pseudo="ado_b", age=16, mot_de_passe_hash=self.user_ado_b.password,
        )

        self.user_ecoutant = User.objects.create_user(username="ecoutant_a", password="motdepasse123")
        self.ecoutant = Ecoutant.objects.create(
            user=self.user_ecoutant, nom_complet="Écoutant Test", email="e@partenaire.org",
            mot_de_passe_hash=self.user_ecoutant.password, statut=StatutEcoutant.VALIDE,
        )

        self.user_ecoutant_2 = User.objects.create_user(username="ecoutant_b", password="motdepasse123")
        self.ecoutant_2 = Ecoutant.objects.create(
            user=self.user_ecoutant_2, nom_complet="Écoutant Test 2", email="e2@partenaire.org",
            mot_de_passe_hash=self.user_ecoutant_2.password, statut=StatutEcoutant.VALIDE,
        )

        self.conversation_a = Conversation.objects.create(
            utilisateur=self.ado_a, ecoutant=self.ecoutant, statut=StatutConversation.EN_COURS,
        )
        self.conversation_b = Conversation.objects.create(
            utilisateur=self.ado_b, ecoutant=self.ecoutant, statut=StatutConversation.EN_COURS,
        )
        Message.objects.create(conversation=self.conversation_a, auteur="utilisateur", contenu="secret A")
        Message.objects.create(conversation=self.conversation_b, auteur="utilisateur", contenu="secret B")

    def test_ado_ne_voit_que_ses_propres_conversations(self):
        self.client.force_authenticate(user=self.user_ado_a)
        response = self.client.get("/api/messagerie/conversations/")
        ids = [c["id"] for c in response.data.get("results", response.data)]
        self.assertIn(self.conversation_a.id, ids)
        self.assertNotIn(self.conversation_b.id, ids)

    def test_ado_ne_voit_pas_les_messages_dune_autre_conversation(self):
        """
        Régression du bug corrigé en session : MessageViewSet n'avait
        au départ AUCUN filtre, donc n'importe quel compte authentifié
        pouvait lister tous les messages de toutes les conversations.
        """
        self.client.force_authenticate(user=self.user_ado_a)
        response = self.client.get("/api/messagerie/messages/")
        contenus = [m["contenu"] for m in response.data.get("results", response.data)]
        self.assertIn("secret A", contenus)
        self.assertNotIn("secret B", contenus)

    def test_creer_conversation_rattache_automatiquement_lado_connecte(self):
        """
        Régression du deuxième bug corrigé en session : perform_create
        n'assignait pas l'ado automatiquement.
        """
        self.client.force_authenticate(user=self.user_ado_a)
        response = self.client.post("/api/messagerie/conversations/", {"ecoutant": self.ecoutant_2.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nouvelle = Conversation.objects.get(id=response.data["id"])
        self.assertEqual(nouvelle.utilisateur, self.ado_a)
