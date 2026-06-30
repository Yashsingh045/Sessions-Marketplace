from rest_framework import generics, permissions, viewsets

from .models import Booking, Session
from .permissions import IsCreatorOrReadOnly, IsCreatorRole
from .serializers import (
    BookingSerializer,
    CreatorBookingSerializer,
    SessionSerializer,
)


class SessionViewSet(viewsets.ModelViewSet):
    """Public catalog (list/retrieve open to all). Create/update/delete is
    restricted to CREATORs, and edits to the owning creator."""

    queryset = Session.objects.select_related("creator").all()
    serializer_class = SessionSerializer
    permission_classes = [IsCreatorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # ?mine=1 → only the requesting creator's own sessions (dashboard).
        if self.request.query_params.get("mine") and self.request.user.is_authenticated:
            qs = qs.filter(creator=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class BookingViewSet(viewsets.ModelViewSet):
    """A user's own bookings (active + past). Any authenticated user may book;
    the queryset is always scoped to the requester."""

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = (
            Booking.objects.select_related("session", "session__creator")
            .filter(user=self.request.user)
        )
        # Optional ?status=ACTIVE|PAST filter.
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status.upper())
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CreatorBookingsView(generics.ListAPIView):
    """GET /api/creator/bookings/ — all bookings across the requesting creator's
    sessions (who booked what). CREATOR only."""

    serializer_class = CreatorBookingSerializer
    permission_classes = [IsCreatorRole]

    def get_queryset(self):
        qs = (
            Booking.objects.select_related("session", "user")
            .filter(session__creator=self.request.user)
            .order_by("-created_at")
        )
        # Optional ?session=<id> to scope to a single session.
        session_id = self.request.query_params.get("session")
        if session_id:
            qs = qs.filter(session_id=session_id)
        return qs
