from rest_framework import viewsets

from .models import SleepSession
from .serializers import SleepSessionSerializer


class SleepSessionViewSet(viewsets.ModelViewSet):
    """CRUD for the logged-in user's own sleep sessions.

    The queryset is always filtered by request.user, so another user's
    session id returns 404.
    """

    serializer_class = SleepSessionSerializer
    queryset = SleepSession.objects.none()  # for schema generation

    def get_queryset(self):
        return SleepSession.objects.filter(user=self.request.user).order_by("-start_time")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, source=SleepSession.Source.MANUAL)
