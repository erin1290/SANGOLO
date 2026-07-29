from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/conversation/(?P<conversation_id>\d+)/$", consumers.ConversationConsumer.as_asgi()),
    re_path(r"ws/cercle/(?P<cercle_id>\d+)/$", consumers.CercleConsumer.as_asgi()),
]
