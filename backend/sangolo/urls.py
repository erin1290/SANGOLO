from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/journal/", include("journal.urls")),
    path("api/messagerie/", include("messagerie.urls")),
    path("api/alertes/", include("alertes.urls")),
    path("api/ressources/", include("ressources.urls")),
    path("api/planning/", include("planning.urls")),
]
