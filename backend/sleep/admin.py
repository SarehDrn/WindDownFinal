from django.contrib import admin

from .models import SleepSession


@admin.register(SleepSession)
class SleepSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "start_time", "end_time", "source"]
    list_filter = ["source"]
