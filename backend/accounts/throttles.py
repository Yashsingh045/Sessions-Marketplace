from rest_framework.throttling import AnonRateThrottle


class AuthThrottle(AnonRateThrottle):
    """Rate-limits unauthenticated auth endpoints (OAuth login/callback/exchange)
    by client IP. Rate comes from THROTTLE_AUTH (settings 'auth' scope)."""

    scope = "auth"
