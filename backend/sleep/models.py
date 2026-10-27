from django.conf import settings
from django.db import models
from django.db.models import F, Q


class SleepSession(models.Model):
    """One night (or nap) of sleep belonging to a single user."""

    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        GOOGLE = "google", "Google Health"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sleep_sessions"
    )
    start_time = models.DateTimeField(help_text="Bedtime (when the user went to bed).")
    end_time = models.DateTimeField(help_text="Wake-up time.")
    minutes_to_fall_asleep = models.PositiveSmallIntegerField(null=True, blank=True)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.MANUAL)
    external_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="ID from an external source; unique per user to prevent duplicate imports.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_time"]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_time__gt=F("start_time")),
                name="sleep_end_after_start",
            ),
            models.UniqueConstraint(
                fields=["user", "external_id"],
                condition=Q(external_id__isnull=False),
                name="sleep_unique_external_id_per_user",
            ),
        ]

    @property
    def duration_minutes(self):
        return int((self.end_time - self.start_time).total_seconds() // 60)

    def __str__(self):
        return f"SleepSession {self.pk}"
