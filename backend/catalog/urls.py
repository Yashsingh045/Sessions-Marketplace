from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, CreatorBookingsView, SessionViewSet

router = DefaultRouter()
router.register("sessions", SessionViewSet, basename="session")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = router.urls + [
    path("creator/bookings/", CreatorBookingsView.as_view(), name="creator-bookings"),
]
