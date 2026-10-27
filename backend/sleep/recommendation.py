"""Bedtime recommendation logic (spec: Recommendation Logic v1).

    bedtime = wake_time - (cycles x cycle_length) - time_to_fall_asleep

Only the cold-start (population average) mode is implemented here. Personal
mode (7+ nights, user's own averages) is tracked in issue #5.
"""

from dataclasses import dataclass
from datetime import time

# Population averages.
DEFAULT_CYCLE_LENGTH_MINUTES = 90
DEFAULT_MINUTES_TO_FALL_ASLEEP = 15
CYCLE_OPTIONS = (5, 6)
MIN_SLEEP_MINUTES = 7 * 60
# Nights of personal data needed before personal mode can apply.
PERSONAL_MODE_MIN_NIGHTS = 7

MINUTES_PER_DAY = 24 * 60


@dataclass(frozen=True)
class Recommendation:
    wake: time
    bedtime: time
    previous_day: bool
    cycles: int
    cycle_length_minutes: int
    minutes_to_fall_asleep: int
    sleep_minutes: int
    reason: str


def choose_cycles(cycle_length_minutes, options=CYCLE_OPTIONS, min_sleep_minutes=MIN_SLEEP_MINUTES):
    """Fewest cycles that give at least `min_sleep_minutes` of sleep.

    If no option reaches the minimum, use the largest option (closest to it).
    """
    for cycles in sorted(options):
        if cycles * cycle_length_minutes >= min_sleep_minutes:
            return cycles
    return max(options)


def recommend_bedtime(
    wake,
    cycle_length_minutes=DEFAULT_CYCLE_LENGTH_MINUTES,
    minutes_to_fall_asleep=DEFAULT_MINUTES_TO_FALL_ASLEEP,
):
    """Recommend a bedtime for a target wake-up `datetime.time`.

    Wraps around midnight: `previous_day` is True when the bedtime falls on
    the calendar day before the wake-up time (e.g. wake 07:00 -> bed 23:45).
    """
    cycles = choose_cycles(cycle_length_minutes)
    sleep_minutes = cycles * cycle_length_minutes
    wake_minutes = wake.hour * 60 + wake.minute
    bed_minutes = wake_minutes - sleep_minutes - minutes_to_fall_asleep

    previous_day = bed_minutes < 0
    bed_minutes %= MINUTES_PER_DAY
    bedtime = time(bed_minutes // 60, bed_minutes % 60)

    reason = (
        f"{cycles} cycles of {cycle_length_minutes} min + "
        f"{minutes_to_fall_asleep} min to fall asleep"
    )
    return Recommendation(
        wake=time(wake.hour, wake.minute),
        bedtime=bedtime,
        previous_day=previous_day,
        cycles=cycles,
        cycle_length_minutes=cycle_length_minutes,
        minutes_to_fall_asleep=minutes_to_fall_asleep,
        sleep_minutes=sleep_minutes,
        reason=reason,
    )


def population_message(nights_logged):
    """User-facing note explaining that population averages were used."""
    remaining = PERSONAL_MODE_MIN_NIGHTS - nights_logged
    if remaining > 0:
        nights = "night" if remaining == 1 else "nights"
        return (
            "Based on population averages (90-min cycles, 15 min to fall asleep). "
            f"Log {remaining} more {nights} to unlock personal recommendations."
        )
    return (
        "Based on population averages (90-min cycles, 15 min to fall asleep). "
        "Personal recommendations are not available yet."
    )
