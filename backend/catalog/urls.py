from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, SessionViewSet

router = DefaultRouter()
router.register("sessions", SessionViewSet, basename="session")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = router.urls
