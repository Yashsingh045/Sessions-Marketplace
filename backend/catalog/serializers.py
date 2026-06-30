from rest_framework import serializers

from .models import Booking, Session


class SessionSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source="creator.name", read_only=True)
    creator_username = serializers.CharField(source="creator.username", read_only=True)
    booked_count = serializers.IntegerField(read_only=True)
    seats_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "title",
            "description",
            "creator",
            "creator_name",
            "creator_username",
            "datetime",
            "price",
            "capacity",
            "booked_count",
            "seats_left",
            "created_at",
        ]
        # creator is taken from the authenticated request, never the payload.
        read_only_fields = ["creator", "created_at"]


class BookingSerializer(serializers.ModelSerializer):
    session_detail = SessionSerializer(source="session", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "session",
            "session_detail",
            "status",
            "created_at",
        ]
        read_only_fields = ["user", "status", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        session = attrs["session"]
        if Booking.objects.filter(user=request.user, session=session).exists():
            raise serializers.ValidationError("You have already booked this session.")
        if session.seats_left <= 0:
            raise serializers.ValidationError("This session is fully booked.")
        return attrs
