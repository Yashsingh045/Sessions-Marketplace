from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_creator = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "name",
            "role",
            "avatar",
            "is_creator",
        ]
        # username/email come from GitHub; role/name/avatar are user-editable
        # (e.g. a USER can self-upgrade to CREATOR, set their display name).
        read_only_fields = ["id", "username", "email", "is_creator"]
