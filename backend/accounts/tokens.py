from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user):
    """Issue our own JWT pair, embedding the role so the frontend and the API
    can authorize without an extra DB lookup. Custom claims set on the refresh
    token are copied onto the access token by SimpleJWT."""
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username
    refresh["name"] = user.name or user.username
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
