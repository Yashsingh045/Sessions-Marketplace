from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "name", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser")
    search_fields = ("username", "email", "name")
    fieldsets = UserAdmin.fieldsets + (
        ("Marketplace", {"fields": ("role", "name", "avatar", "github_id")}),
    )
