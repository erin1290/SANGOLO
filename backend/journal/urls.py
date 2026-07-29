from rest_framework.routers import DefaultRouter
from .views import EntreeJournalViewSet

router = DefaultRouter()
router.register("entrees", EntreeJournalViewSet, basename="entreejournal")

urlpatterns = router.urls
