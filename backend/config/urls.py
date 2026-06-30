"""Root URL configuration.

Only a health-check endpoint exists at this scaffold stage. Feature routers
(auth, sessions, bookings, payments) are mounted under /api/ as they land.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "sessions-marketplace-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/health", health),
    path("api/", include("accounts.urls")),
    path("api/", include("catalog.urls")),
]
