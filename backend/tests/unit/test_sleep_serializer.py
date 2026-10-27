from datetime import datetime, timedelta, timezone

import pytest

from sleep.models import SleepSession
from sleep.serializers import END_BEFORE_START_ERROR, SleepSessionSerializer

BED = datetime(2026, 10, 1, 23, 0, tzinfo=timezone.utc)
WAKE = BED + timedelta(hours=8)


def test_valid_session():
    serializer = SleepSessionSerializer(
        data={"start_time": BED.isoformat(), "end_time": WAKE.isoformat(), "minutes_to_fall_asleep": 12}
    )
    assert serializer.is_valid(), serializer.errors


@pytest.mark.parametrize("end", [BED, BED - timedelta(minutes=1)])
def test_end_must_be_after_start(end):
    serializer = SleepSessionSerializer(data={"start_time": BED.isoformat(), "end_time": end.isoformat()})
    assert not serializer.is_valid()
    assert serializer.errors["end_time"] == [END_BEFORE_START_ERROR]


def test_required_fields():
    serializer = SleepSessionSerializer(data={})
    assert not serializer.is_valid()
    assert set(serializer.errors) == {"start_time", "end_time"}


def test_minutes_to_fall_asleep_cannot_be_negative():
    serializer = SleepSessionSerializer(
        data={"start_time": BED.isoformat(), "end_time": WAKE.isoformat(), "minutes_to_fall_asleep": -5}
    )
    assert not serializer.is_valid()
    assert "minutes_to_fall_asleep" in serializer.errors


def test_partial_update_checks_against_stored_times():
    instance = SleepSession(start_time=BED, end_time=WAKE)
    serializer = SleepSessionSerializer(
        instance, data={"end_time": (BED - timedelta(hours=1)).isoformat()}, partial=True
    )
    assert not serializer.is_valid()
    assert serializer.errors["end_time"] == [END_BEFORE_START_ERROR]


def test_source_is_read_only():
    serializer = SleepSessionSerializer(
        data={"start_time": BED.isoformat(), "end_time": WAKE.isoformat(), "source": "google"}
    )
    assert serializer.is_valid()
    assert "source" not in serializer.validated_data


def test_duration_minutes():
    assert SleepSession(start_time=BED, end_time=WAKE).duration_minutes == 480
