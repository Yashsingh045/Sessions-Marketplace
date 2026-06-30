"""GitHub OAuth → our-own-JWT flow.

Two entry points share one exchange routine:

  GET  /api/auth/github/login/      → returns the GitHub authorize URL
  GET  /api/auth/github/callback/   → GitHub redirects here; we mint a JWT and
                                       redirect the browser to the frontend with
                                       the tokens in the URL fragment
  POST /api/auth/github/exchange/   → SPA alternative: frontend posts {code},
                                       gets the JWT pair back as JSON

  GET/PATCH /api/auth/me/           → current user; PATCH updates name/avatar/role
"""
import os
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.shortcuts import redirect
from rest_framework import permissions, status
from rest_framework.decorators import (
    api_view,
    parser_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .serializers import UserSerializer
from .throttles import AuthThrottle
from .tokens import get_tokens_for_user

User = get_user_model()

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _exchange_code_for_user(code, intended_role=None):
    """Exchange an OAuth code for a GitHub profile and upsert our User.

    Returns (user, error_message). On success error_message is None.
    """
    token_resp = requests.post(
        GITHUB_TOKEN_URL,
        data={
            "client_id": settings.GITHUB_OAUTH_CLIENT_ID,
            "client_secret": settings.GITHUB_OAUTH_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_OAUTH_CALLBACK_URL,
        },
        headers={"Accept": "application/json"},
        timeout=10,
    )
    gh_access = token_resp.json().get("access_token")
    if not gh_access:
        return None, "Failed to exchange code with GitHub."

    auth_headers = {
        "Authorization": f"Bearer {gh_access}",
        "Accept": "application/json",
    }
    profile = requests.get(GITHUB_USER_URL, headers=auth_headers, timeout=10).json()
    github_id = profile.get("id")
    if not github_id:
        return None, "Could not read GitHub profile."

    email = profile.get("email") or ""
    if not email:
        emails = requests.get(GITHUB_EMAILS_URL, headers=auth_headers, timeout=10).json()
        if isinstance(emails, list):
            primary = next((e for e in emails if e.get("primary")), None)
            email = (primary or {}).get("email", "")

    defaults = {
        "username": profile.get("login") or f"gh_{github_id}",
        "email": email,
        "name": profile.get("name") or profile.get("login") or "",
        "avatar": profile.get("avatar_url") or "",
    }
    user, created = User.objects.get_or_create(github_id=github_id, defaults=defaults)

    if created and intended_role in (User.Role.USER, User.Role.CREATOR):
        user.role = intended_role
        user.save(update_fields=["role"])

    return user, None


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def github_login(request):
    """Build the GitHub authorize URL. Optional ?role=CREATOR is round-tripped
    via `state` so a brand-new user can be created as a CREATOR."""
    role = request.query_params.get("role", User.Role.USER)
    if role not in (User.Role.USER, User.Role.CREATOR):
        role = User.Role.USER
    params = {
        "client_id": settings.GITHUB_OAUTH_CLIENT_ID,
        "redirect_uri": settings.GITHUB_OAUTH_CALLBACK_URL,
        "scope": "read:user user:email",
        "state": role,
    }
    return Response({"authorize_url": f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def github_callback(request):
    code = request.query_params.get("code")
    state = request.query_params.get("state", "")
    if not code:
        return Response({"detail": "Missing code."}, status=status.HTTP_400_BAD_REQUEST)

    user, error = _exchange_code_for_user(code, intended_role=state)
    if error:
        return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

    tokens = get_tokens_for_user(user)
    # Tokens go in the URL fragment (#) so they are never sent to a server / logged.
    fragment = urlencode({**tokens, "role": user.role})
    return redirect(f"{settings.FRONTEND_BASE_URL}/auth/callback#{fragment}")


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def github_exchange(request):
    """SPA-friendly: frontend handles the GitHub redirect, then POSTs the code
    here and receives the JWT pair as JSON (no tokens in the URL)."""
    code = request.data.get("code")
    role = request.data.get("role", User.Role.USER)
    if not code:
        return Response({"detail": "Missing code."}, status=status.HTTP_400_BAD_REQUEST)

    user, error = _exchange_code_for_user(code, intended_role=role)
    if error:
        return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

    return Response({**get_tokens_for_user(user), "user": UserSerializer(user).data})


@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    if request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSerializer(request.user).data)


ALLOWED_AVATAR_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    """Store an uploaded avatar in MinIO (via django-storages) and save the
    resulting public object URL on the user."""
    file = request.FILES.get("avatar")
    if not file:
        return Response(
            {"detail": "No file provided (expected form field 'avatar')."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if file.size > MAX_AVATAR_BYTES:
        return Response(
            {"detail": "File too large (max 5 MB)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTS:
        return Response(
            {"detail": "Unsupported file type. Use PNG, JPG, GIF or WEBP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # S3Storage.file_overwrite defaults True → a stable key per user.
    key = f"user_{request.user.id}/avatar{ext}"
    saved_name = default_storage.save(key, file)
    request.user.avatar = default_storage.url(saved_name)
    request.user.save(update_fields=["avatar"])
    return Response(UserSerializer(request.user).data)
