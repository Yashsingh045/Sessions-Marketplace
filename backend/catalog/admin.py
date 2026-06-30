from django.contrib import admin

from .models import Booking, Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("title", "creator", "datetime", "price", "capacity", "booked_count")
    list_filter = ("datetime", "creator")
    search_fields = ("title", "description", "creator__username")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("user", "session", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__username", "session__title")
