from rest_framework.routers import DefaultRouter
from .views import RessourceViewSet

router = DefaultRouter()
router.register("ressources", RessourceViewSet, basename="ressource")
urlpatterns = router.urls
