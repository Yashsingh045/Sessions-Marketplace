"""Seed demo data: one CREATOR, one USER, a few sessions and sample bookings.

Idempotent — safe to run repeatedly (used on container start when
SEED_DEMO_DATA=true, or manually via `python manage.py seed_demo`).

Note: demo users authenticate via GitHub in the real flow; these rows exist so
the catalog has content immediately and the dashboards have data to show.
"""
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from catalog.models import Booking, Session


class Command(BaseCommand):
    help = "Seed demo creator, user, sessions and bookings (idempotent)."

    def handle(self, *args, **options):
        creator, _ = User.objects.get_or_create(
            username="demo_creator",
            defaults={
                "github_id": 900001,
                "role": User.Role.CREATOR,
                "name": "Demo Creator",
                "email": "creator@demo.test",
            },
        )
        if creator.role != User.Role.CREATOR:
            creator.role = User.Role.CREATOR
            creator.save(update_fields=["role"])

        user, _ = User.objects.get_or_create(
            username="demo_user",
            defaults={
                "github_id": 900002,
                "role": User.Role.USER,
                "name": "Demo User",
                "email": "user@demo.test",
            },
        )

        now = timezone.now()
        # Wellness-themed so the derived category tags (Meditation / Yoga /
        # Sound Healing / Breathwork) are meaningful and match the UI theme.
        specs = [
            {
                "title": "Morning Clarity Meditation",
                "description": "Start your day with focused breathwork and guided "
                "visualization to set positive intentions.",
                "datetime": now + timedelta(days=2, hours=2),
                "price": Decimal("499.00"),
                "capacity": 25,
            },
            {
                "title": "Sunrise Vinyasa Yoga Flow",
                "description": "A gentle flowing yoga practice to awaken the body "
                "and align breath with movement.",
                "datetime": now + timedelta(days=4),
                "price": Decimal("0.00"),
                "capacity": 40,
            },
            {
                "title": "Crystal Bowl Sound Healing Bath",
                "description": "Deep cellular relaxation through the resonant "
                "frequencies of alchemy crystal sound bowls.",
                "datetime": now + timedelta(days=6, hours=5),
                "price": Decimal("899.00"),
                "capacity": 30,
            },
            {
                "title": "Pranayama Breathwork Essentials",
                "description": "Learn foundational breathing techniques to regulate "
                "your nervous system and find calm.",
                "datetime": now + timedelta(days=9),
                "price": Decimal("299.00"),
                "capacity": 50,
            },
            {
                "title": "Restorative Meditation (past session)",
                "description": "A grounding meditation to release tension. This "
                "session has already taken place.",
                "datetime": now - timedelta(days=5),
                "price": Decimal("399.00"),
                "capacity": 20,
            },
        ]

        sessions = []
        for spec in specs:
            session, created = Session.objects.get_or_create(
                creator=creator,
                title=spec["title"],
                defaults={
                    "description": spec["description"],
                    "datetime": spec["datetime"],
                    "price": spec["price"],
                    "capacity": spec["capacity"],
                },
            )
            sessions.append(session)

        upcoming, past = sessions[0], sessions[-1]
        Booking.objects.get_or_create(
            user=user, session=upcoming, defaults={"status": Booking.Status.ACTIVE}
        )
        Booking.objects.get_or_create(
            user=user, session=past, defaults={"status": Booking.Status.PAST}
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded: creator='{creator.username}', user='{user.username}', "
                f"sessions={Session.objects.filter(creator=creator).count()}, "
                f"bookings={Booking.objects.filter(user=user).count()}"
            )
        )
