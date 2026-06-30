from decimal import Decimal

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
    is_past = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "session",
            "session_detail",
            "status",
            "is_past",
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
        # Paid sessions must complete the Razorpay flow (see /api/payments/).
        if Decimal(session.price) > 0:
            raise serializers.ValidationError(
                "This is a paid session — please complete payment to book."
            )
        return attrs


class CreatorBookingSerializer(serializers.ModelSerializer):
    """Creator-facing view of a booking on one of their sessions — shows who
    booked, not the full session payload."""

    user_username = serializers.CharField(source="user.username", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.CharField(source="user.avatar", read_only=True)
    session_id = serializers.IntegerField(source="session.id", read_only=True)
    session_title = serializers.CharField(source="session.title", read_only=True)
    session_datetime = serializers.DateTimeField(source="session.datetime", read_only=True)
    is_past = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user_username",
            "user_name",
            "user_avatar",
            "session_id",
            "session_title",
            "session_datetime",
            "status",
            "is_past",
            "created_at",
        ]
