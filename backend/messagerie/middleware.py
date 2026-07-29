"""
Middleware d'authentification pour WebSocket via token DRF.
Le frontend envoie le token comme paramètre de requête :
  ws://host/ws/conversation/1/?token=xxxx
"""
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_key = params.get("token", [None])[0]
        scope["user"] = AnonymousUser()
        if token_key:
            user = await self._get_user_from_token(token_key)
            if user:
                scope["user"] = user
        return await super().__call__(scope, receive, send)
    @database_sync_to_async
    def _get_user_from_token(self, token_key):
        from rest_framework.authtoken.models import Token
        try:
            token = Token.objects.select_related("user").get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None