"""Razorpay (test mode) payment flow for paid sessions.

  POST /api/payments/order/   → validate, create a Razorpay order, return it
  POST /api/payments/verify/  → verify the signature, then confirm the booking

Free sessions (price 0) skip this entirely and are booked via /api/bookings/.
"""
from decimal import Decimal

import razorpay
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Booking, Session
from .serializers import BookingSerializer
from .throttles import BookingThrottle


def get_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def _booking_blocker(user, session):
    """Return an error string if this user cannot book this session, else None."""
    if Booking.objects.filter(user=user, session=session).exists():
        return "You have already booked this session."
    if session.seats_left <= 0:
        return "This session is fully booked."
    return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([BookingThrottle])
def create_order(request):
    session = Session.objects.filter(id=request.data.get("session")).first()
    if not session:
        return Response(
            {"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if Decimal(session.price) <= 0:
        return Response(
            {"detail": "This session is free — book it directly."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    blocker = _booking_blocker(request.user, session)
    if blocker:
        return Response({"detail": blocker}, status=status.HTTP_400_BAD_REQUEST)

    amount_paise = int(Decimal(session.price) * 100)
    try:
        order = get_client().order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"sess{session.id}-user{request.user.id}",
                "notes": {
                    "session_id": str(session.id),
                    "user_id": str(request.user.id),
                },
            }
        )
    except Exception as exc:  # bad keys / gateway error
        return Response(
            {"detail": f"Could not create payment order: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID,
            "session_title": session.title,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([BookingThrottle])
def verify_payment(request):
    data = request.data
    required = [
        "session",
        "razorpay_order_id",
        "razorpay_payment_id",
        "razorpay_signature",
    ]
    if any(not data.get(k) for k in required):
        return Response(
            {"detail": "Missing payment fields."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session = Session.objects.filter(id=data.get("session")).first()
    if not session:
        return Response(
            {"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND
        )

    blocker = _booking_blocker(request.user, session)
    if blocker:
        return Response({"detail": blocker}, status=status.HTTP_400_BAD_REQUEST)

    # Cryptographically verify the payment came from Razorpay for this order.
    try:
        get_client().utility.verify_payment_signature(
            {
                "razorpay_order_id": data["razorpay_order_id"],
                "razorpay_payment_id": data["razorpay_payment_id"],
                "razorpay_signature": data["razorpay_signature"],
            }
        )
    except razorpay.errors.SignatureVerificationError:
        return Response(
            {"detail": "Payment verification failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    booking = Booking.objects.create(
        user=request.user,
        session=session,
        status=Booking.Status.ACTIVE,
        razorpay_order_id=data["razorpay_order_id"],
        razorpay_payment_id=data["razorpay_payment_id"],
    )
    return Response(
        BookingSerializer(booking, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )
