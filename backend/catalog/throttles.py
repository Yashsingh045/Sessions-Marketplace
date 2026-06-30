from rest_framework.throttling import UserRateThrottle


class BookingThrottle(UserRateThrottle):
    """Rate-limits booking creation and payment endpoints per authenticated user.
    Rate comes from THROTTLE_BOOKING (settings 'booking' scope)."""

    scope = "booking"
