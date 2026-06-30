from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user.

    Authenticated via GitHub OAuth (no local password), so `username` mirrors
    the GitHub login and `github_id` is the stable identity key. `role` drives
    authorization across the API and is embedded in the issued JWT.
    """

    class Role(models.TextChoices):
        USER = "USER", "User"
        CREATOR = "CREATOR", "Creator"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    name = models.CharField(max_length=255, blank=True)
    # Stores the MinIO/S3 object URL (or key) for the user's avatar.
    avatar = models.CharField(
        max_length=500, blank=True, help_text="MinIO object URL or key"
    )
    github_id = models.BigIntegerField(unique=True, null=True, blank=True)

    @property
    def is_creator(self):
        return self.role == self.Role.CREATOR

    def __str__(self):
        return f"{self.username} ({self.role})"
