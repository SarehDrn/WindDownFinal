from datetime import datetime, timedelta, timezone

import pytest
from django.db import IntegrityError, transaction

from sleep.models import SleepSession

pytestmark = pytest.mark.django_db

BED = datetime(2026, 10, 1, 23, 0, tzinfo=timezone.utc)
WAKE = BED + timedelta(hours=8)


def test_defaults_to_manual_source(make_user):
    session = SleepSession.objects.create(user=make_user(), start_time=BED, end_time=WAKE)
    assert session.source == SleepSession.Source.MANUAL
    assert session.external_id is None
    assert session.minutes_to_fall_asleep is None


def test_db_rejects_end_before_start(make_user):
    with pytest.raises(IntegrityError), transaction.atomic():
        SleepSession.objects.create(user=make_user(), start_time=WAKE, end_time=BED)


def test_external_id_unique_per_user(make_user):
    user = make_user()
    SleepSession.objects.create(user=user, start_time=BED, end_time=WAKE, external_id="x1")
    with pytest.raises(IntegrityError), transaction.atomic():
        SleepSession.objects.create(user=user, start_time=BED, end_time=WAKE, external_id="x1")


def test_same_external_id_allowed_for_different_users(make_user):
    a, b = make_user("a@example.com"), make_user("b@example.com")
    SleepSession.objects.create(user=a, start_time=BED, end_time=WAKE, external_id="x1")
    SleepSession.objects.create(user=b, start_time=BED, end_time=WAKE, external_id="x1")
    assert SleepSession.objects.filter(external_id="x1").count() == 2


def test_many_sessions_without_external_id_allowed(make_user):
    user = make_user()
    SleepSession.objects.create(user=user, start_time=BED, end_time=WAKE)
    SleepSession.objects.create(user=user, start_time=BED, end_time=WAKE)
    assert user.sleep_sessions.count() == 2


def test_default_ordering_newest_first(make_user):
    user = make_user()
    older = SleepSession.objects.create(user=user, start_time=BED, end_time=WAKE)
    newer = SleepSession.objects.create(
        user=user, start_time=BED + timedelta(days=1), end_time=WAKE + timedelta(days=1)
    )
    assert list(SleepSession.objects.filter(user=user)) == [newer, older]
