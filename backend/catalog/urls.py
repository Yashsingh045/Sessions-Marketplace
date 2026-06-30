from django.urls import path
from rest_framework.routers import DefaultRouter

from .payments import create_order, verify_payment
from .views import BookingViewSet, CreatorBookingsView, SessionViewSet

router = DefaultRouter()
router.register("sessions", SessionViewSet, basename="session")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = router.urls + [
    path("creator/bookings/", CreatorBookingsView.as_view(), name="creator-bookings"),
    path("payments/order/", create_order, name="payment-order"),
    path("payments/verify/", verify_payment, name="payment-verify"),
]
