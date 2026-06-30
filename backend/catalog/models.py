from django.conf import settings
from django.db import models
from django.utils import timezone


class Session(models.Model):
    """A bookable live session published by a CREATOR."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    datetime = models.DateTimeField(help_text="When the session takes place")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    capacity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["datetime"]

    def __str__(self):
        return self.title

    @property
    def booked_count(self):
        return self.bookings.filter(status=Booking.Status.ACTIVE).count()

    @property
    def seats_left(self):
        return max(self.capacity - self.booked_count, 0)


class Booking(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PAST = "PAST", "Past"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # A user books a given session at most once.
        constraints = [
            models.UniqueConstraint(
                fields=["user", "session"], name="unique_user_session_booking"
            )
        ]

    @property
    def is_past(self):
        """Temporal flag derived from the session time — accurate regardless of
        the stored status field."""
        return self.session.datetime < timezone.now()

    def __str__(self):
        return f"{self.user} → {self.session} [{self.status}]"
