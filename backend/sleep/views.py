from dataclasses import asdict

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SleepSession
from .recommendation import population_message, recommend_bedtime
from .serializers import (
    RecommendationQuerySerializer,
    RecommendationSerializer,
    SleepSessionSerializer,
)


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


class RecommendationView(APIView):
    """Recommend a bedtime for a target wake-up time.

    Cold start only: always uses population averages for now.
    """

    @extend_schema(
        parameters=[RecommendationQuerySerializer],
        responses={200: RecommendationSerializer},
    )
    def get(self, request):
        query = RecommendationQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)

        result = recommend_bedtime(query.validated_data["wake"])
        nights_logged = SleepSession.objects.filter(user=request.user).count()
        data = {
            **asdict(result),
            "mode": "population",
            "uses_population_averages": True,
            "nights_logged": nights_logged,
            "message": population_message(nights_logged),
        }
        return Response(RecommendationSerializer(data).data)
