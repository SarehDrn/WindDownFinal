"""Load a demo user with 30 nights of sample sleep.

    python manage.py load_demo

Safe to run repeatedly: the demo user is reused and each night has a stable
external_id ("demo-YYYY-MM-DD"), so nights are updated in place instead of
duplicated. Demo nights that fall outside the latest 30-night window are
removed, so the user always has exactly 30 demo nights afterwards.
"""

import os
import random
from datetime import datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from sleep.models import SleepSession

DEMO_EMAIL = "demo@winddown.app"
DEFAULT_DEMO_PASSWORD = "winddown-demo"
NIGHTS = 30
EXTERNAL_ID_PREFIX = "demo-"


def demo_night(wake_date):
    """Deterministic sample night ending on the morning of `wake_date`."""
    rng = random.Random(f"winddown-demo-{wake_date.isoformat()}")
    bed_date = wake_date - timedelta(days=1)
    # Bedtime between 22:00 and 00:30, sleep 6.5 to 8.5 hours.
    bed_offset = rng.randint(0, 150)
    start = datetime.combine(bed_date, time(22, 0), tzinfo=timezone.get_current_timezone())
    start += timedelta(minutes=bed_offset)
    end = start + timedelta(minutes=rng.randint(390, 510))
    return {
        "start_time": start,
        "end_time": end,
        "minutes_to_fall_asleep": rng.randint(5, 30),
    }


class Command(BaseCommand):
    help = f"Create (or refresh) the demo user {DEMO_EMAIL} with {NIGHTS} nights of sample sleep."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=os.environ.get("DEMO_USER_PASSWORD", DEFAULT_DEMO_PASSWORD),
            help="Password for the demo user (default: $DEMO_USER_PASSWORD or 'winddown-demo').",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=DEMO_EMAIL, defaults={"email": DEMO_EMAIL}
        )
        user.set_password(options["password"])
        user.save()

        today = timezone.localdate()
        wake_dates = [today - timedelta(days=i) for i in range(NIGHTS)]
        wanted_ids = []
        for wake_date in wake_dates:
            external_id = f"{EXTERNAL_ID_PREFIX}{wake_date.isoformat()}"
            wanted_ids.append(external_id)
            SleepSession.objects.update_or_create(
                user=user,
                external_id=external_id,
                defaults={**demo_night(wake_date), "source": SleepSession.Source.MANUAL},
            )

        stale = SleepSession.objects.filter(
            user=user, external_id__startswith=EXTERNAL_ID_PREFIX
        ).exclude(external_id__in=wanted_ids)
        stale.delete()

        count = SleepSession.objects.filter(user=user).count()
        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} demo user {DEMO_EMAIL} with {count} nights of sleep.")
        )
