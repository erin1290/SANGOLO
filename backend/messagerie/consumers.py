"""
messagerie/consumers.py

Deux consumers Channels :
- ConversationConsumer : le tchat 1-to-1 entre un ado et un ecoutant.
- CercleConsumer : les echanges de groupe dans un ecoute d'ecoute.

Dans les deux cas, chaque message recu est enregistre en base ET
transmis au module de supervision IA pour analyse en tache de fond
(cf. alertes/supervision.py) — jamais de reponse generee automatiquement,
uniquement une detection silencieuse de signaux a risque.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Conversation, Message, CercleEcoute, MessageCercle, MembreCercle
from alertes.supervision import analyser_message_en_tache_de_fond


class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"conversation_{self.conversation_id}"
        # Verifier l'authentification
        if self.scope["user"].is_anonymous:
            await self.close()
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    async def receive(self, text_data):
        data = json.loads(text_data)
        contenu = data["contenu"]
        auteur = data["auteur"]
        message = await self._enregistrer_message(contenu, auteur)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "diffuser_message",
                "auteur": auteur,
                "contenu": contenu,
                "date_envoi": message.date_envoi.isoformat(),
            },
        )
        analyser_message_en_tache_de_fond(message)
    async def diffuser_message(self, event):
        await self.send(text_data=json.dumps({
            "auteur": event["auteur"],
            "contenu": event["contenu"],
            "date_envoi": event["date_envoi"],
        }))
    @database_sync_to_async
    def _enregistrer_message(self, contenu, auteur):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation, auteur=auteur, contenu=contenu
        )
        # Mettre a jour la date de derniere activite
        from django.utils import timezone
        Conversation.objects.filter(id=self.conversation_id).update(
            date_derniere_activite=timezone.now()
        )
        return message


class CercleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.cercle_id = self.scope["url_route"]["kwargs"]["cercle_id"]
        self.group_name = f"cercle_{self.cercle_id}"
        if self.scope["user"].is_anonymous:
            await self.close()
            return
        # Verifier l'appartenance au cercle
        if not await self._verifier_appartenance():
            await self.close()
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = await self._enregistrer_message(
            contenu=data["contenu"],
            utilisateur_id=data.get("utilisateur_id"),
            ecoutant_id=data.get("ecoutant_id"),
        )
        # Récupérer le pseudo de l'expéditeur
        auteur_label = data.get("auteur_label", "")
        if not auteur_label:
            if data.get("utilisateur_id"):
                from accounts.models import Utilisateur
                try:
                    utilisateur = Utilisateur.objects.get(id=data["utilisateur_id"])
                    auteur_label = utilisateur.pseudo
                except Utilisateur.DoesNotExist:
                    auteur_label = "Membre"
            elif data.get("ecoutant_id"):
                from accounts.models import Ecoutant
                try:
                    ecoutant = Ecoutant.objects.get(id=data["ecoutant_id"])
                    auteur_label = ecoutant.nom_complet
                except Ecoutant.DoesNotExist:
                    auteur_label = "Animateur"
            else:
                auteur_label = "Membre"
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "diffuser_message",
                "contenu": data["contenu"],
                "auteur_label": auteur_label,
                "date_envoi": message.date_envoi.isoformat(),
            },
        )

    async def diffuser_message(self, event):
        await self.send(text_data=json.dumps({
            "auteur_label": event["auteur_label"],
            "contenu": event["contenu"],
            "date_envoi": event["date_envoi"],
        }))

    @database_sync_to_async
    def _verifier_appartenance(self):
        """Verifie que l'utilisateur a le droit de rejoindre ce cercle WebSocket."""
        user = self.scope["user"]
        cercle_id = int(self.cercle_id)
        try:
            cercle = CercleEcoute.objects.get(id=cercle_id)
        except CercleEcoute.DoesNotExist:
            return False
        # L'ecoutant animateur a toujours acces
        if hasattr(user, "ecoutant_profile"):
            return True
        # L'ado doit etre membre du cercle
        if hasattr(user, "utilisateur_profile"):
            return MembreCercle.objects.filter(
                cercle=cercle, utilisateur=user.utilisateur_profile
            ).exists()
        # Superviseur a acces a tout
        if hasattr(user, "superviseur_profile") or user.is_staff:
            return True
        return False

    @database_sync_to_async
    def _enregistrer_message(self, contenu, utilisateur_id, ecoutant_id):
        cercle = CercleEcoute.objects.get(id=self.cercle_id)
        return MessageCercle.objects.create(
            cercle=cercle,
            utilisateur_id=utilisateur_id,
            ecoutant_id=ecoutant_id,
            contenu=contenu,
        )