from rest_framework import serializers

from .models import SleepSession

END_BEFORE_START_ERROR = "Wake-up time must be after bedtime."


class SleepSessionSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = SleepSession
        fields = [
            "id",
            "start_time",
            "end_time",
            "minutes_to_fall_asleep",
            "source",
            "duration_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "source", "duration_minutes", "created_at", "updated_at"]
        extra_kwargs = {"minutes_to_fall_asleep": {"max_value": 600}}

    def validate(self, attrs):
        # On PATCH only some fields are sent; compare against the stored values.
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start is not None and end is not None and end <= start:
            raise serializers.ValidationError({"end_time": [END_BEFORE_START_ERROR]})
        return attrs
