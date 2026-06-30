from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("auth/github/login/", views.github_login, name="github-login"),
    path("auth/github/callback/", views.github_callback, name="github-callback"),
    path("auth/github/exchange/", views.github_exchange, name="github-exchange"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", views.me, name="me"),
    # Spec-required short alias for the profile endpoint.
    path("me/", views.me, name="me-short"),
]
