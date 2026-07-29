from rest_framework.routers import DefaultRouter
from .views import CreneauPlanningViewSet

router = DefaultRouter()
router.register("creneaux", CreneauPlanningViewSet, basename="creneau")
urlpatterns = router.urls
