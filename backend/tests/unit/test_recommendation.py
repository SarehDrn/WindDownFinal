from datetime import time

import pytest

from sleep.recommendation import (
    choose_cycles,
    population_message,
    recommend_bedtime,
)


def test_default_wake_0700():
    rec = recommend_bedtime(time(7, 0))
    # 07:00 - 5 x 90 min - 15 min = 23:15 the night before.
    assert rec.bedtime == time(23, 15)
    assert rec.previous_day is True
    assert rec.cycles == 5
    assert rec.cycle_length_minutes == 90
    assert rec.minutes_to_fall_asleep == 15
    assert rec.sleep_minutes == 450
    assert rec.reason == "5 cycles of 90 min + 15 min to fall asleep"


@pytest.mark.parametrize(
    "wake,bedtime,previous_day",
    [
        (time(7, 0), time(23, 15), True),
        (time(6, 30), time(22, 45), True),
        (time(0, 0), time(16, 15), True),  # midnight wake
        (time(1, 15), time(17, 30), True),  # just after midnight
        (time(7, 45), time(0, 0), False),  # bedtime exactly midnight, same day
        (time(8, 0), time(0, 15), False),  # bedtime after midnight
        (time(12, 0), time(4, 15), False),  # midday wake (night shift)
        (time(23, 59), time(16, 14), False),
    ],
)
def test_bedtime_wraps_around_midnight(wake, bedtime, previous_day):
    rec = recommend_bedtime(wake)
    assert rec.bedtime == bedtime
    assert rec.previous_day is previous_day


def test_choose_cycles_prefers_fewest_cycles_with_at_least_7_hours():
    assert choose_cycles(90) == 5  # 7.5 h
    assert choose_cycles(84) == 5  # exactly 7 h
    assert choose_cycles(83) == 6  # 5 cycles would be < 7 h
    assert choose_cycles(70) == 6  # 7 h with 6 cycles
    assert choose_cycles(60) == 6  # nothing reaches 7 h: most sleep possible


def test_custom_parameters_change_reason_and_bedtime():
    rec = recommend_bedtime(time(7, 0), cycle_length_minutes=80, minutes_to_fall_asleep=14)
    assert rec.cycles == 6
    assert rec.bedtime == time(22, 46)  # 07:00 - 480 - 14
    assert rec.reason == "6 cycles of 80 min + 14 min to fall asleep"


def test_seconds_are_ignored():
    assert recommend_bedtime(time(7, 0, 59)).wake == time(7, 0)


def test_population_message_counts_remaining_nights():
    assert "population averages" in population_message(0)
    assert "Log 7 more nights" in population_message(0)
    assert "Log 1 more night " in population_message(6)
    assert "not available yet" in population_message(7)
