from datetime import date, time, timedelta

from sleep.management.commands.load_demo import demo_night


def test_demo_night_is_deterministic():
    assert demo_night(date(2026, 10, 1)) == demo_night(date(2026, 10, 1))


def test_demo_nights_are_plausible():
    for i in range(60):
        wake_date = date(2026, 10, 1) - timedelta(days=i)
        night = demo_night(wake_date)
        start, end = night["start_time"], night["end_time"]
        assert end > start
        assert 390 <= (end - start).total_seconds() / 60 <= 510
        assert 5 <= night["minutes_to_fall_asleep"] <= 30
        # Bedtime is the evening before (22:00 to 00:30) the wake-up day.
        assert start.date() in {wake_date - timedelta(days=1), wake_date}
        assert start.time() >= time(22, 0) or start.time() <= time(0, 30)
        assert end.date() == wake_date
